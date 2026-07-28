import DayBook from "../models/dayBook.js";

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
 *   ⑪ cashInHand = totalCash − cashExpenses − cashToOffice  (→ next day's openingCash)
 *   closingCash = cashInHand  (alias kept for any older code/reports still reading it)
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

  /* ⑤ ⑥ Credits */
  const officialCrEntries = Array.isArray(body.officialCrEntries)
    ? body.officialCrEntries
    : [];
  const officialCr = officialCrEntries.length
    ? sumPersonEntries(officialCrEntries)
    : Number(body.officialCr) || 0;

  const personalCrEntries = Array.isArray(body.personalCrEntries)
    ? body.personalCrEntries
    : [];
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

  /* ⑩ Expenses */
  const rawExp =
    body.expenseEntries && typeof body.expenseEntries === "object"
      ? body.expenseEntries
      : {};
  const expenseEntries = {};
  Object.entries(rawExp).forEach(([k, v]) => {
    const n = Number(v);
    if (n > 0) expenseEntries[k] = n;
  });
  const cashExpenses = sumMap(expenseEntries) || Number(body.cashExpenses) || 0;

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
        return res.status(403).json({ success: false, message: "Shop not assigned" });
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

    if ((req.user.role === "admin" || req.user.role === "staff") && String(doc.shop) !== String(req.user.shop)) {
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
      return res
        .status(400)
        .json({
          success: false,
          message: "Cannot create an entry for a future date.",
        });

    const computed = recompute(req.body);
    const payload = { date: req.body.date, ...computed };

    if (req.user.role === "admin" || req.user.role === "staff") {
      if (!req.user.shop) {
        return res.status(403).json({ success: false, message: "Shop not assigned" });
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
      return res
        .status(400)
        .json({
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

    if ((req.user.role === "admin" || req.user.role === "staff") && String(existing.shop) !== String(req.user.shop)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const computed = recompute(req.body);
    const setObj = { $set: computed };

    if (req.user.role === "superadmin" && req.body.shop) {
      setObj.$set.shop = req.body.shop;
    }

    const doc = await DayBook.findByIdAndUpdate(
      req.params.id,
      setObj,
      { new: true, runValidators: true },
    );
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

    if ((req.user.role === "admin" || req.user.role === "staff") && String(doc.shop) !== String(req.user.shop)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    await doc.deleteOne();
    res.json({ success: true, message: "Entry deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─── GET /api/daybook/summary/monthly ──────────────────────────────────── */
export const getMonthlySummary = async (req, res) => {
  try {
    const summary = await DayBook.aggregate([
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          totalSale: { $sum: "$totalSale" },
          kitchenSale: { $sum: "$kitchenSale" },
          coffeeShop: { $sum: "$coffeeShop" },
          officialCr: { $sum: "$officialCr" },
          personalCr: { $sum: "$personalCr" },
          upiReceived: { $sum: "$upiReceived" },
          totalCash: { $sum: "$totalCash" },
          cashToOffice: { $sum: "$cashToOffice" },
          cashExpenses: { $sum: "$cashExpenses" },
          cashInHand: { $sum: "$cashInHand" },
          lastClosing: { $last: "$cashInHand" }, // next month's first opening cash
          days: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
    ]);
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
