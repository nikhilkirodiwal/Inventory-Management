import mongoose from "mongoose";
import LedgerEntry from "../models/ledgerEntry.js";
import Shop from "../models/shop.js";

const VALID_KINDS = ["salary", "adminExpense", "patientBill"];
// These two are tied to a specific site — every entry must carry a shop.
// adminExpense stays business-wide (never shop-scoped).
const SITE_SCOPED_KINDS = ["salary", "patientBill"];

const sumEntries = (entries = []) =>
  entries.reduce((s, e) => s + (Number(e.amount) || 0), 0);

const computeAmount = (body) => {
  const entries = Array.isArray(body.entries) ? body.entries : [];
  return entries.length ? sumEntries(entries) : Number(body.directAmount) || 0;
};

const invalidKind = (res) =>
  res.status(400).json({ success: false, message: "Invalid ledger kind" });

/* GET /api/ledger/:kind/shops — site picker for salary / patientBill.
   Lists every shop with a lifetime total + this-month total for that kind,
   so the "choose a site" screen can show something useful, not just names. */
export const getLedgerShopTotals = async (req, res) => {
  try {
    const { kind } = req.params;
    if (!VALID_KINDS.includes(kind)) return invalidKind(res);
    if (!SITE_SCOPED_KINDS.includes(kind))
      return res
        .status(400)
        .json({
          success: false,
          message: "This ledger is business-wide, not site-scoped",
        });

    const shops = await Shop.find().sort({ name: 1 }).lean();
    const shopIds = shops.map((s) => s._id);

    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const monthEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );

    const [allTime, thisMonth] = await Promise.all([
      LedgerEntry.aggregate([
        { $match: { kind, shop: { $in: shopIds } } },
        {
          $group: {
            _id: "$shop",
            total: { $sum: "$amount" },
            days: { $sum: 1 },
            lastDate: { $max: "$date" },
          },
        },
      ]),
      LedgerEntry.aggregate([
        {
          $match: {
            kind,
            shop: { $in: shopIds },
            date: { $gte: monthStart, $lt: monthEnd },
          },
        },
        { $group: { _id: "$shop", total: { $sum: "$amount" } } },
      ]),
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

/* GET /api/ledger/:kind?month=YYYY-MM&shop=<id>
   shop is required for salary / patientBill, ignored for adminExpense. */
export const getLedgerEntries = async (req, res) => {
  try {
    const { kind } = req.params;
    if (!VALID_KINDS.includes(kind)) return invalidKind(res);

    const { month, shop } = req.query;
    const query = { kind };

    if (SITE_SCOPED_KINDS.includes(kind)) {
      if (!shop)
        return res
          .status(400)
          .json({
            success: false,
            message: "shop is required for this ledger",
          });
      query.shop = shop;
    }

    if (month) {
      const [year, mon] = month.split("-").map(Number);
      query.date = {
        $gte: new Date(Date.UTC(year, mon - 1, 1)),
        $lt: new Date(Date.UTC(year, mon, 1)),
      };
    }

    const docs = await LedgerEntry.find(query).sort({ date: 1 });
    const total = docs.reduce((s, d) => s + (d.amount || 0), 0);

    res.json({ success: true, data: docs, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* GET /api/ledger/:kind/summary?shop=<id> — monthly totals, for the P&L /
   overview cards. shop is optional for salary / patientBill (omit it to get
   every site's numbers combined); ignored for adminExpense. */
export const getLedgerSummary = async (req, res) => {
  try {
    const { kind } = req.params;
    if (!VALID_KINDS.includes(kind)) return invalidKind(res);

    const { shop } = req.query;
    const match = { kind };
    if (SITE_SCOPED_KINDS.includes(kind) && shop) {
      match.shop = new mongoose.Types.ObjectId(shop);
    }

    const summary = await LedgerEntry.aggregate([
      { $match: match },
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          total: { $sum: "$amount" },
          days: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
    ]);
    const grandTotal = summary.reduce((s, m) => s + m.total, 0);

    res.json({ success: true, data: summary, grandTotal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createLedgerEntry = async (req, res) => {
  try {
    const { kind } = req.params;
    if (!VALID_KINDS.includes(kind)) return invalidKind(res);

    const { date, entries = [], directAmount, note, shop } = req.body || {};
    if (!date)
      return res
        .status(400)
        .json({ success: false, message: "date is required" });

    let shopValue = null;
    if (SITE_SCOPED_KINDS.includes(kind)) {
      if (!shop)
        return res
          .status(400)
          .json({
            success: false,
            message: "shop is required for this ledger",
          });
      const shopDoc = await Shop.findById(shop);
      if (!shopDoc)
        return res
          .status(400)
          .json({ success: false, message: "Invalid site" });
      shopValue = shopDoc._id;
    }

    const amount = computeAmount({ entries, directAmount });
    const doc = await LedgerEntry.create({
      kind,
      shop: shopValue,
      date,
      entries,
      directAmount: entries.length ? 0 : Number(directAmount) || 0,
      amount,
      note: note || "",
    });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    if (err.code === 11000)
      return res
        .status(400)
        .json({
          success: false,
          message: "An entry for this date already exists.",
        });
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateLedgerEntry = async (req, res) => {
  try {
    const { kind } = req.params;
    if (!VALID_KINDS.includes(kind)) return invalidKind(res);

    const { entries = [], directAmount, note, date, shop } = req.body || {};
    const amount = computeAmount({ entries, directAmount });

    const update = {
      date,
      entries,
      directAmount: entries.length ? 0 : Number(directAmount) || 0,
      amount,
      note,
    };

    if (SITE_SCOPED_KINDS.includes(kind) && shop) {
      const shopDoc = await Shop.findById(shop);
      if (!shopDoc)
        return res
          .status(400)
          .json({ success: false, message: "Invalid site" });
      update.shop = shopDoc._id;
    }

    const doc = await LedgerEntry.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: "Entry not found" });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteLedgerEntry = async (req, res) => {
  try {
    const doc = await LedgerEntry.findByIdAndDelete(req.params.id);
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: "Entry not found" });
    res.json({ success: true, message: "Entry deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
