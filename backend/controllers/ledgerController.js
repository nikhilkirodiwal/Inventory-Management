import LedgerEntry from "../models/ledgerEntry.js";

const VALID_KINDS = ["salary", "adminExpense", "patientBill"];

const sumEntries = (entries = []) => entries.reduce((s, e) => s + (Number(e.amount) || 0), 0);

const computeAmount = (body) => {
  const entries = Array.isArray(body.entries) ? body.entries : [];
  return entries.length ? sumEntries(entries) : Number(body.directAmount) || 0;
};

/* GET /api/ledger/:kind?month=YYYY-MM */
export const getLedgerEntries = async (req, res) => {
  try {
    const { kind } = req.params;
    if (!VALID_KINDS.includes(kind)) return res.status(400).json({ success: false, message: "Invalid ledger kind" });

    const { month } = req.query;
    const query = { kind };
    if (month) {
      const [year, mon] = month.split("-").map(Number);
      query.date = { $gte: new Date(Date.UTC(year, mon - 1, 1)), $lt: new Date(Date.UTC(year, mon, 1)) };
    }

    const docs = await LedgerEntry.find(query).sort({ date: 1 });
    const total = docs.reduce((s, d) => s + (d.amount || 0), 0);

    res.json({ success: true, data: docs, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* GET /api/ledger/:kind/summary — monthly totals, for the P&L and overview cards */
export const getLedgerSummary = async (req, res) => {
  try {
    const { kind } = req.params;
    if (!VALID_KINDS.includes(kind)) return res.status(400).json({ success: false, message: "Invalid ledger kind" });

    const summary = await LedgerEntry.aggregate([
      { $match: { kind } },
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
    if (!VALID_KINDS.includes(kind)) return res.status(400).json({ success: false, message: "Invalid ledger kind" });

    const { date, entries = [], directAmount, note } = req.body || {};
    if (!date) return res.status(400).json({ success: false, message: "date is required" });

    const amount = computeAmount({ entries, directAmount });
    const doc = await LedgerEntry.create({ kind, date, entries, directAmount: entries.length ? 0 : Number(directAmount) || 0, amount, note: note || "" });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: "An entry for this date already exists." });
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateLedgerEntry = async (req, res) => {
  try {
    const { entries = [], directAmount, note, date } = req.body || {};
    const amount = computeAmount({ entries, directAmount });
    const doc = await LedgerEntry.findByIdAndUpdate(
      req.params.id,
      { date, entries, directAmount: entries.length ? 0 : Number(directAmount) || 0, amount, note },
      { new: true, runValidators: true },
    );
    if (!doc) return res.status(404).json({ success: false, message: "Entry not found" });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteLedgerEntry = async (req, res) => {
  try {
    const doc = await LedgerEntry.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Entry not found" });
    res.json({ success: true, message: "Entry deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};