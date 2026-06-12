import DayBook from "../models/dayBook.js";

/* ─── helpers ────────────────────────────────────────────────────────────── */
const sumMap = (obj = {}) =>
  Object.values(obj).reduce((s, v) => s + (Number(v) || 0), 0);

const sumPersonEntries = (arr = []) =>
  arr.reduce((s, x) => s + (Number(x.amount) || 0), 0);

/**
 * Recompute all derived fields from raw inputs.
 * expenseEntries arrives as a plain object from JSON — Mongoose Map handles it.
 */
const recompute = (body) => {
  const openingCash = Number(body.openingCash) || 0;
  const cafeSale = Number(body.cafeSale) || 0;
  const cafeNight = Number(body.cafeNight) || 0;
  const upiReceived = Number(body.upiReceived) || 0;

  const cashToOfficeEntries = Array.isArray(body.cashToOfficeEntries)
    ? body.cashToOfficeEntries
    : [];
  const cashToOffice = cashToOfficeEntries.length
    ? sumPersonEntries(cashToOfficeEntries)
    : Number(body.cashToOffice) || 0;

  const kitchenSaleEntries = Array.isArray(body.kitchenSaleEntries)
    ? body.kitchenSaleEntries
    : [];
  const kitchenSale = kitchenSaleEntries.length
    ? sumPersonEntries(kitchenSaleEntries)
    : Number(body.kitchenSale) || 0;

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

  const coffeeShopEntries = Array.isArray(body.coffeeShopEntries)
    ? body.coffeeShopEntries
    : [];
  const coffeeShop = coffeeShopEntries.length
    ? sumPersonEntries(coffeeShopEntries)
    : Number(body.coffeeShop ?? body.coffeeShopSale) || 0;

  // expenseEntries: plain object from frontend — values may be strings
  const rawExp =
    body.expenseEntries && typeof body.expenseEntries === "object"
      ? body.expenseEntries
      : {};
  // Filter to only non-zero entries
  const expenseEntries = {};
  Object.entries(rawExp).forEach(([k, v]) => {
    const n = Number(v);
    if (n > 0) expenseEntries[k] = n;
  });
  const cashExpenses = sumMap(expenseEntries) || Number(body.cashExpenses) || 0;

  const totalSale =
    kitchenSale +
    coffeeShop +
    cafeSale +
    cafeNight -
    officialCr -
    personalCr -
    upiReceived;
  const totalCash =
    openingCash +
    kitchenSale +
    officialCr +
    personalCr +
    coffeeShop +
    cafeSale +
    cafeNight -
    upiReceived;
  const closingCash = totalCash - cashExpenses - cashToOffice;

  return {
    openingCash,

    kitchenSale,
    kitchenSaleEntries,

    officialCr,
    officialCrEntries,

    personalCr,
    personalCrEntries,

    coffeeShop,
    coffeeShopSale: coffeeShop,
    coffeeShopEntries,

    cafeSale,
    cafeNight,
    upiReceived,

    totalSale,
    totalCash,

    expenseEntries,
    cashExpenses,

    cashToOffice,
    cashToOfficeEntries,

    closingCash,
  };
};

/* ─── GET /api/daybook?month=2026-04 ─────────────────────────────────────── */
export const getEntries = async (req, res) => {
  try {
    const { month, page = 1, limit = 31 } = req.query;
    const query = {};

    if (month) {
      const [year, mon] = month.split("-").map(Number);
      const start = new Date(Date.UTC(year, mon - 1, 1));
      const end = new Date(Date.UTC(year, mon, 1)); // exclusive
      query.date = { $gte: start, $lt: end };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [entries, total] = await Promise.all([
      DayBook.find(query).sort({ date: 1 }).skip(skip).limit(Number(limit)),
      DayBook.countDocuments(query),
    ]);

    // Serialize: convert Mongoose Map → plain object for expenseEntries
    const serialized = entries.map((e) => {
      const obj = e.toObject({ getters: false });
      if (obj.expenseEntries instanceof Map) {
        obj.expenseEntries = Object.fromEntries(obj.expenseEntries);
      }
      return obj;
    });

    const totals = serialized.reduce(
      (acc, e) => ({
        kitchenSale: acc.kitchenSale + (e.kitchenSale || 0),
        officialCr: acc.officialCr + (e.officialCr || 0),
        personalCr: acc.personalCr + (e.personalCr || 0),
        coffeeShop: acc.coffeeShop + (e.coffeeShop || e.coffeeShopSale || 0),
        cafeSale: acc.cafeSale + (e.cafeSale || 0),
        cafeNight: acc.cafeNight + (e.cafeNight || 0),
        upiReceived: acc.upiReceived + (e.upiReceived || 0),
        totalSale: acc.totalSale + (e.totalSale || 0),
        totalCash: acc.totalCash + (e.totalCash || 0),
        cashExpenses: acc.cashExpenses + (e.cashExpenses || 0),
        cashToOffice: acc.cashToOffice + (e.cashToOffice || 0),
      }),
      {
        kitchenSale: 0,
        officialCr: 0,
        personalCr: 0,
        coffeeShop: 0,
        cafeSale: 0,
        cafeNight: 0,
        upiReceived: 0,
        totalSale: 0,
        totalCash: 0,
        cashExpenses: 0,
        cashToOffice: 0,
      },
    );

    res.json({
      success: true,
      data: serialized,
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
    const entry = await DayBook.findById(req.params.id);
    if (!entry)
      return res
        .status(404)
        .json({ success: false, message: "Entry not found" });
    const obj = entry.toObject({ getters: false });
    if (obj.expenseEntries instanceof Map)
      obj.expenseEntries = Object.fromEntries(obj.expenseEntries);
    res.json({ success: true, data: obj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─── POST /api/daybook ──────────────────────────────────────────────────── */
export const createEntry = async (req, res) => {
  try {
    const incomingDate = new Date(req.body.date);
    const todayUTC = new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate(),
      ),
    );
    if (incomingDate > todayUTC)
      return res.status(400).json({
        success: false,
        message: "Cannot create an entry for a future date.",
      });
    const computed = recompute(req.body);
    const entry = await DayBook.create({
      date: req.body.date,
      ...computed,
    });
    const obj = entry.toObject({ getters: false });
    if (obj.expenseEntries instanceof Map)
      obj.expenseEntries = Object.fromEntries(obj.expenseEntries);
    res.status(201).json({ success: true, data: obj });
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
    const computed = recompute(req.body);
    const entry = await DayBook.findByIdAndUpdate(
      req.params.id,
      { $set: computed },
      { new: true, runValidators: true },
    );
    if (!entry)
      return res
        .status(404)
        .json({ success: false, message: "Entry not found" });
    const obj = entry.toObject({ getters: false });
    if (obj.expenseEntries instanceof Map)
      obj.expenseEntries = Object.fromEntries(obj.expenseEntries);
    res.json({ success: true, data: obj });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/* ─── DELETE /api/daybook/:id ────────────────────────────────────────────── */
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

/* ─── GET /api/daybook/summary/monthly ──────────────────────────────────── */
export const getMonthlySummary = async (req, res) => {
  try {
    const summary = await DayBook.aggregate([
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          totalSale: { $sum: "$totalSale" },
          totalCash: { $sum: "$totalCash" },
          cashExpenses: { $sum: "$cashExpenses" },
          cashToOffice: { $sum: "$cashToOffice" },
          kitchenSale: { $sum: "$kitchenSale" },
          officialCr: { $sum: "$officialCr" },
          personalCr: { $sum: "$personalCr" },
          coffeeShop: { $sum: "$coffeeShop" },
          upiReceived: { $sum: "$upiReceived" },
          lastClosing: { $last: "$closingCash" },
          days: { $sum: 1 },
        },
      },
      {
        $addFields: {
          surplus: {
            $subtract: ["$totalCash", "$cashExpenses", "$cashToOffice"],
          },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
    ]);
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
