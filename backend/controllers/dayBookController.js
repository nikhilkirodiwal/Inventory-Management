import DayBook from "../models/dayBook.js";

// GET /api/daybook?month=2026-04
export const getEntries = async (req, res) => {
  try {
    const { month, page = 1, limit = 31 } = req.query;
    const query = {};

    if (month) {
      const [year, mon] = month.split("-").map(Number);
      // Use UTC dates to match MongoDB ISODate storage
      const start = new Date(Date.UTC(year, mon - 1, 1)); // 2026-04-01T00:00:00.000Z
      const end = new Date(Date.UTC(year, mon, 1)); // 2026-05-01T00:00:00.000Z (exclusive)
      query.date = { $gte: start, $lt: end }; // $lt instead of $lte avoids the 23:59:59 gap
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [entries, total] = await Promise.all([
      DayBook.find(query).sort({ date: 1 }).skip(skip).limit(Number(limit)),
      DayBook.countDocuments(query),
    ]);

    const totals = entries.reduce(
      (acc, e) => ({
        kitchenSale: acc.kitchenSale + e.kitchenSale,
        coffeeShopSale: acc.coffeeShopSale + e.coffeeShopSale,
        totalSale: acc.totalSale + e.totalSale,
        cashExpenses: acc.cashExpenses + e.cashExpenses,
      }),
      { kitchenSale: 0, coffeeShopSale: 0, totalSale: 0, cashExpenses: 0 },
    );

    res.json({
      success: true,
      data: entries,
      totals,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/daybook/:id
export const getEntry = async (req, res) => {
  try {
    const entry = await DayBook.findById(req.params.id);
    if (!entry)
      return res
        .status(404)
        .json({ success: false, message: "Entry not found" });
    res.json({ success: true, data: entry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/daybook
export const createEntry = async (req, res) => {
  try {
    const entry = await DayBook.create(req.body);
    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    if (err.code === 11000)
      return res
        .status(400)
        .json({
          success: false,
          message: "Entry for this date already exists",
        });
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/daybook/:id
export const updateEntry = async (req, res) => {
  try {
    const entry = await DayBook.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!entry)
      return res
        .status(404)
        .json({ success: false, message: "Entry not found" });
    res.json({ success: true, data: entry });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/daybook/:id
export const deleteEntry = async (req, res) => {
  try {
    const entry = await DayBook.findByIdAndDelete(req.params.id);
    if (!entry)
      return res
        .status(404)
        .json({ success: false, message: "Entry not found" });
    res.json({ success: true, message: "Entry deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/daybook/summary/monthly
export const getMonthlySummary = async (req, res) => {
  try {
    const summary = await DayBook.aggregate([
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          totalSale: { $sum: "$totalSale" },
          totalCash: { $sum: "$totalCash" },
          totalExpenses: { $sum: "$cashExpenses" },
          avgClosing: { $avg: "$closingCash" },
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
