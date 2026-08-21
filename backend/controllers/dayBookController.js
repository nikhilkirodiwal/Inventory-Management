import DayBook from "../models/dayBook.js";
import Shop from "../models/shop.js";
import mongoose from "mongoose";

/* ─── helpers ────────────────────────────────────────────────────────────── */
const sumPersonEntries = (arr = []) =>
  arr.reduce((s, x) => s + (Number(x.amount) || 0), 0);

const sumMap = (obj = {}) =>
  Object.values(obj).reduce((s, v) => s + (Number(v) || 0), 0);

const tabTotal = (t) =>
  Array.isArray(t.entries) && t.entries.length > 0
    ? sumPersonEntries(t.entries)
    : Number(t.directAmount) || 0;

/**
 * Recompute ALL derived fields from raw body.
 * Formulas:
 *   ④ totalSale  = kitchenSale + coffeeShop  (each already the sum of its sub-tabs)
 *   ⑧ totalCash  = openingCash + totalSale − officialCr − personalCr − upiReceived
 *   ⑩ cashExpenses = sum(expenseEntries) + salary + advance
 *   ⑪ cashInHand = totalCash − cashExpenses − cashToOffice  (→ next day's openingCash)
 *   Purchase Credit is tracked separately and does NOT affect any of the
 *   above — it's a liability record (goods bought on credit), not cash.
 */
const recompute = (body) => {
  /* ② Kitchen sub-tabs */
  const kitchenSubTabs = Array.isArray(body.kitchenSubTabs)
    ? body.kitchenSubTabs
    : [];
  const kitchenSale = kitchenSubTabs.length
    ? kitchenSubTabs.reduce((s, t) => s + tabTotal(t), 0)
    : Number(body.kitchenSale) || 0;

  /* ③ Coffee sub-tabs */
  const coffeeSubTabs = Array.isArray(body.coffeeSubTabs)
    ? body.coffeeSubTabs
    : [];
  const coffeeShop = coffeeSubTabs.length
    ? coffeeSubTabs.reduce((s, t) => s + tabTotal(t), 0)
    : Number(body.coffeeShop ?? body.coffeeShopSale) || 0;

  /* ⑤ ⑥ Credits — officialCrEntries pass through as-is (name/amount/note) */
  const officialCrEntries = Array.isArray(body.officialCrEntries)
    ? body.officialCrEntries
    : [];
  const officialCr = officialCrEntries.length
    ? sumPersonEntries(officialCrEntries)
    : Number(body.officialCr) || 0;

  // Personal Cr entries carry a per-entry `creditedAmount` — how much of
  // that person's credit has actually been settled so far — and an
  // optional `note`. creditedAmount clamped to [0, amount]; the remaining
  // ("left") amount is just amount - creditedAmount, derived on read.
  const personalCrEntriesRaw = Array.isArray(body.personalCrEntries)
    ? body.personalCrEntries
    : [];
  const personalCrEntries = personalCrEntriesRaw.map((e) => {
    const amount = Number(e.amount) || 0;
    let creditedAmount = Number(e.creditedAmount) || 0;
    if (creditedAmount < 0) creditedAmount = 0;
    if (creditedAmount > amount) creditedAmount = amount;
    return { name: e.name, amount, creditedAmount, note: e.note || "" };
  });
  const personalCr = personalCrEntries.length
    ? sumPersonEntries(personalCrEntries)
    : Number(body.personalCr) || 0;

  /* ⑦ UPI */
  const upiReceived = Number(body.upiReceived) || 0;

  /* ⑨ Cash to office */
  const cashToOfficeEntries = Array.isArray(body.cashToOfficeEntries)
    ? body.cashToOfficeEntries
    : [];
  const cashToOffice = cashToOfficeEntries.length
    ? sumPersonEntries(cashToOfficeEntries)
    : Number(body.cashToOffice) || 0;

  /* Salary — own by-person breakdown, no longer a key inside expenseEntries */
  const salaryEntries = Array.isArray(body.salaryEntries)
    ? body.salaryEntries
    : [];
  const salary = salaryEntries.length
    ? sumPersonEntries(salaryEntries)
    : Number(body.salary) || 0;

  /* Advance — same treatment as Salary */
  const advanceEntries = Array.isArray(body.advanceEntries)
    ? body.advanceEntries
    : [];
  const advance = advanceEntries.length
    ? sumPersonEntries(advanceEntries)
    : Number(body.advance) || 0;

  /* Purchase Credit — liability tracker only, does not touch cash formulas */
  const purchaseCreditEntries = Array.isArray(body.purchaseCreditEntries)
    ? body.purchaseCreditEntries
    : [];
  const purchaseCredit = purchaseCreditEntries.length
    ? sumPersonEntries(purchaseCreditEntries)
    : Number(body.purchaseCredit) || 0;

  /* ⑩ Expenses (generic category map — Salary/Advance excluded from here now) */
  const rawExp =
    body.expenseEntries && typeof body.expenseEntries === "object"
      ? body.expenseEntries
      : {};
  const expenseEntries = {};
  Object.entries(rawExp).forEach(([k, v]) => {
    if (/^salary$/i.test(k) || /^advance$/i.test(k)) return; // guard against legacy clients
    const n = Number(v);
    if (n > 0) expenseEntries[k] = n;
  });
  const cashExpenses = sumMap(expenseEntries) + salary + advance;

  /* ① Opening cash */
  const openingCash = Number(body.openingCash) || 0;

  /* ── Core formulas ── */
  const totalSale = kitchenSale + coffeeShop;
  const totalCash =
    openingCash + totalSale - officialCr - personalCr - upiReceived;
  const cashInHand = totalCash - cashExpenses - cashToOffice;

  return {
    openingCash,

    kitchenSubTabs,
    kitchenSale,
    kitchenSaleEntries: kitchenSubTabs.flatMap((t) => t.entries || []), // legacy flat copy

    coffeeSubTabs,
    coffeeShop,
    coffeeShopSale: coffeeShop, // legacy alias
    coffeeShopEntries: coffeeSubTabs.flatMap((t) => t.entries || []), // legacy flat copy

    officialCr,
    officialCrEntries,

    personalCr,
    personalCrEntries,

    upiReceived,

    totalSale,
    totalCash,

    cashToOffice,
    cashToOfficeEntries,

    salary,
    salaryEntries,

    advance,
    advanceEntries,

    purchaseCredit,
    purchaseCreditEntries,

    expenseEntries,
    cashExpenses,

    cashInHand,
    closingCash: cashInHand, // alias — next day opening cash
  };
};

/* ── serialize one Mongoose doc → plain object ────────────────────────────── */
const serialize = (doc) => {
  const obj = doc.toObject ? doc.toObject({ getters: false }) : { ...doc };
  if (obj.expenseEntries instanceof Map)
    obj.expenseEntries = Object.fromEntries(obj.expenseEntries);
  return obj;
};

/* ─── GET /api/daybook?month=2026-05 ─────────────────────────────────────── */
export const getEntries = async (req, res) => {
  try {
    const { month, page = 1, limit = 31 } = req.query;
    const query = {};
    const { shop } = req.query;

    if (req.user.role === "admin" || req.user.role === "staff") {
      if (!req.user.shop) {
        return res
          .status(403)
          .json({ success: false, message: "Shop not assigned" });
      }
      query.shop = req.user.shop;
    } else if (req.user.role === "superadmin") {
      if (shop) query.shop = shop;
    } else {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (month) {
      const [year, mon] = month.split("-").map(Number);
      query.date = {
        $gte: new Date(Date.UTC(year, mon - 1, 1)),
        $lt: new Date(Date.UTC(year, mon, 1)),
      };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [docs, total] = await Promise.all([
      DayBook.find(query).sort({ date: 1 }).skip(skip).limit(Number(limit)),
      DayBook.countDocuments(query),
    ]);

    const data = docs.map(serialize);

    const totals = data.reduce(
      (acc, e) => ({
        kitchenSale: acc.kitchenSale + (e.kitchenSale || 0),
        coffeeShop: acc.coffeeShop + (e.coffeeShop ?? e.coffeeShopSale ?? 0),
        officialCr: acc.officialCr + (e.officialCr || 0),
        personalCr: acc.personalCr + (e.personalCr || 0),
        upiReceived: acc.upiReceived + (e.upiReceived || 0),
        totalSale: acc.totalSale + (e.totalSale || 0),
        totalCash: acc.totalCash + (e.totalCash || 0),
        cashToOffice: acc.cashToOffice + (e.cashToOffice || 0),
        salary: acc.salary + (e.salary || 0),
        advance: acc.advance + (e.advance || 0),
        purchaseCredit: acc.purchaseCredit + (e.purchaseCredit || 0),
        cashExpenses: acc.cashExpenses + (e.cashExpenses || 0),
        cashInHand: acc.cashInHand + (e.cashInHand ?? e.closingCash ?? 0),
      }),
      {
        kitchenSale: 0,
        coffeeShop: 0,
        officialCr: 0,
        personalCr: 0,
        upiReceived: 0,
        totalSale: 0,
        totalCash: 0,
        cashToOffice: 0,
        salary: 0,
        advance: 0,
        purchaseCredit: 0,
        cashExpenses: 0,
        cashInHand: 0,
      },
    );

    res.json({
      success: true,
      data,
      totals,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─── GET /api/daybook/:id ───────────────────────────────────────────────── */
export const getEntry = async (req, res) => {
  try {
    const doc = await DayBook.findById(req.params.id);
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: "Entry not found" });

    if (
      (req.user.role === "admin" || req.user.role === "staff") &&
      String(doc.shop) !== String(req.user.shop)
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.json({ success: true, data: serialize(doc) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─── POST /api/daybook ──────────────────────────────────────────────────── */
export const createEntry = async (req, res) => {
  try {
    // Block future dates
    const incoming = new Date(req.body.date);
    const todayUTC = new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate(),
      ),
    );
    if (incoming > todayUTC)
      return res.status(400).json({
        success: false,
        message: "Cannot create an entry for a future date.",
      });

    const computed = recompute(req.body);
    const payload = { date: req.body.date, ...computed };

    if (req.user.role === "admin" || req.user.role === "staff") {
      if (!req.user.shop) {
        return res
          .status(403)
          .json({ success: false, message: "Shop not assigned" });
      }
      payload.shop = req.user.shop;
    } else if (req.user.role === "superadmin") {
      if (req.body.shop) payload.shop = req.body.shop;
    } else {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const doc = await DayBook.create(payload);
    res.status(201).json({ success: true, data: serialize(doc) });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({
        success: false,
        message: "Entry for this date already exists.",
      });
    res.status(400).json({ success: false, message: err.message });
  }
};

/* ─── PUT /api/daybook/:id ───────────────────────────────────────────────── */
export const updateEntry = async (req, res) => {
  try {
    const existing = await DayBook.findById(req.params.id);
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Entry not found" });

    if (
      (req.user.role === "admin" || req.user.role === "staff") &&
      String(existing.shop) !== String(req.user.shop)
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const computed = recompute(req.body);
    const setObj = { $set: computed };

    if (req.user.role === "superadmin" && req.body.shop) {
      setObj.$set.shop = req.body.shop;
    }

    const doc = await DayBook.findByIdAndUpdate(req.params.id, setObj, {
      new: true,
      runValidators: true,
    });
    res.json({ success: true, data: serialize(doc) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/* ─── PATCH /api/daybook/:id/personal-cr/:index ──────────────────────────────
   Update how much of a single Personal Cr entry has been credited (and,
   optionally, its note) without touching anything else on the day's record.
   Body: { creditedAmount, note? }. creditedAmount clamped to [0, amount] —
   a confirmation is expected to have already happened on the client before
   this is called. */
export const updatePersonalCrCredit = async (req, res) => {
  try {
    const doc = await DayBook.findById(req.params.id);
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: "Entry not found" });

    if (
      (req.user.role === "admin" || req.user.role === "staff") &&
      String(doc.shop) !== String(req.user.shop)
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const idx = Number(req.params.index);
    const entry = doc.personalCrEntries[idx];
    if (!entry)
      return res
        .status(404)
        .json({ success: false, message: "Entry not found" });

    let creditedAmount = Number(req.body?.creditedAmount);
    if (!Number.isFinite(creditedAmount))
      return res
        .status(400)
        .json({ success: false, message: "creditedAmount must be a number" });
    if (creditedAmount < 0) creditedAmount = 0;
    if (creditedAmount > entry.amount) creditedAmount = entry.amount;

    doc.personalCrEntries[idx].creditedAmount = creditedAmount;
    if (req.body?.note !== undefined) {
      doc.personalCrEntries[idx].note = String(req.body.note || "");
    }
    await doc.save();

    res.json({ success: true, data: serialize(doc) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/* ─── DELETE /api/daybook/:id ────────────────────────────────────────────── */
export const deleteEntry = async (req, res) => {
  try {
    const doc = await DayBook.findById(req.params.id);
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: "Entry not found" });

    if (
      (req.user.role === "admin" || req.user.role === "staff") &&
      String(doc.shop) !== String(req.user.shop)
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    await doc.deleteOne();
    res.json({ success: true, message: "Entry deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─── GET /api/daybook/summary/monthly?shop=<id> ─────────────────────────────
   Monthly roll-up, scoped to one shop (admin/staff forced to their own;
   superadmin may pass ?shop=<id>, or omit it to get every shop grouped
   separately). */
export const getMonthlySummary = async (req, res) => {
  try {
    const match = {};

    if (req.user.role === "admin" || req.user.role === "staff") {
      if (!req.user.shop) {
        return res
          .status(403)
          .json({ success: false, message: "Shop not assigned" });
      }
      match.shop = new mongoose.Types.ObjectId(req.user.shop);
    } else if (req.user.role === "superadmin") {
      if (req.query.shop)
        match.shop = new mongoose.Types.ObjectId(req.query.shop);
    } else {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const groupId = { year: { $year: "$date" }, month: { $month: "$date" } };
    if (!match.shop) groupId.shop = "$shop"; // superadmin, all shops: keep them separated

    const summary = await DayBook.aggregate([
      { $match: match },
      { $sort: { date: 1 } },
      {
        $group: {
          _id: groupId,
          totalSale: { $sum: "$totalSale" },
          kitchenSale: { $sum: "$kitchenSale" },
          coffeeShop: { $sum: "$coffeeShop" },
          officialCr: { $sum: "$officialCr" },
          personalCr: { $sum: "$personalCr" },
          upiReceived: { $sum: "$upiReceived" },
          cashToOffice: { $sum: "$cashToOffice" },
          salary: { $sum: "$salary" },
          advance: { $sum: "$advance" },
          purchaseCredit: { $sum: "$purchaseCredit" },
          cashExpenses: { $sum: "$cashExpenses" },
          openingCash: { $first: "$openingCash" },
          cashInHand: { $last: "$cashInHand" }, // next month's opening cash
          days: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "shops",
          localField: "_id.shop",
          foreignField: "_id",
          as: "shopDoc",
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          shop: "$_id.shop",
          shopName: { $arrayElemAt: ["$shopDoc.name", 0] },
          days: 1,
          totalSale: 1,
          kitchenSale: 1,
          coffeeShop: 1,
          officialCr: 1,
          personalCr: 1,
          upiReceived: 1,
          cashToOffice: 1,
          salary: 1,
          advance: 1,
          purchaseCredit: 1,
          cashExpenses: 1,
          openingCash: 1,
          cashInHand: 1,
        },
      },
      { $sort: { year: -1, month: -1 } },
    ]);

    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─── GET /api/daybook/shop-totals/:field ─────────────────────────────────────
   Superadmin-only. Every shop with lifetime + this-month totals for one
   DayBook field (currently "salary" or "officialCr" — i.e. Patient Bill).
   Powers the read-only Salary / Patient Bill "pick a site" screens: these
   are no longer separate manually-entered ledgers, they're just a view
   into each shop's own daybook data. */
const SHOP_TOTAL_FIELDS = ["salary", "officialCr"];

export const getShopFieldTotals = async (req, res) => {
  try {
    const { field } = req.params;
    if (!SHOP_TOTAL_FIELDS.includes(field)) {
      return res.status(400).json({ success: false, message: "Invalid field" });
    }

    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const monthEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );

    const [allTime, thisMonth, shops] = await Promise.all([
      DayBook.aggregate([
        { $match: { [field]: { $gt: 0 } } },
        {
          $group: {
            _id: "$shop",
            total: { $sum: `$${field}` },
            days: { $sum: 1 },
            lastDate: { $max: "$date" },
          },
        },
      ]),
      DayBook.aggregate([
        {
          $match: {
            [field]: { $gt: 0 },
            date: { $gte: monthStart, $lt: monthEnd },
          },
        },
        { $group: { _id: "$shop", total: { $sum: `$${field}` } } },
      ]),
      Shop.find().sort({ name: 1 }).lean(),
    ]);

    const allTimeMap = Object.fromEntries(
      allTime.map((a) => [String(a._id), a]),
    );
    const monthMap = Object.fromEntries(
      thisMonth.map((a) => [String(a._id), a.total]),
    );

    const data = shops.map((s) => ({
      _id: s._id,
      name: s.name,
      address: s.address,
      allTimeTotal: allTimeMap[String(s._id)]?.total || 0,
      days: allTimeMap[String(s._id)]?.days || 0,
      lastEntryDate: allTimeMap[String(s._id)]?.lastDate || null,
      thisMonthTotal: monthMap[String(s._id)] || 0,
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
