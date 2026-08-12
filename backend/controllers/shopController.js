import Shop from "../models/shop.js";
import User from "../models/user.js";
import bcrypt from "bcryptjs";
import DayBook from "../models/dayBook.js";
import LedgerEntry from "../models/ledgerEntry.js";
import { computeShopPnl } from "../utils/pnl.js";

/* Flatten a daybook doc's Map field (expenseEntries) so it survives JSON
   serialization. Mongoose Maps stringify to "{}" via a bare res.json() call
   unless flattened first — the /daybook routes already do this via their own
   serialize() helper; shop routes need the same treatment. */
const serializeDaybook = (doc) => {
  const obj = doc.toObject ? doc.toObject({ getters: false }) : { ...doc };
  if (obj.expenseEntries instanceof Map) {
    obj.expenseEntries = Object.fromEntries(obj.expenseEntries);
  }
  return obj;
};

const currentMonthKey = () => {
  const n = new Date();
  return `${n.getUTCFullYear()}-${String(n.getUTCMonth() + 1).padStart(2, "0")}`;
};

const monthRangeFromKey = (monthKey) => {
  const [year, mon] = monthKey.split("-").map(Number);
  return {
    start: new Date(Date.UTC(year, mon - 1, 1)),
    end: new Date(Date.UTC(year, mon, 1)),
  };
};

/* Shared by getShop's initial snapshot and the standalone /pnl endpoint, so
   the "which month's stats am I looking at" math lives in exactly one place. */
const computeShopMonthStats = async (shopId, monthKey) => {
  const { start, end } = monthRangeFromKey(monthKey);

  const [dayAgg, patientBillAgg, salaryAgg] = await Promise.all([
    DayBook.aggregate([
      { $match: { shop: shopId, date: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: null,
          totalSale: { $sum: "$totalSale" },
          upiReceived: { $sum: "$upiReceived" },
          personalCr: { $sum: "$personalCr" },
          cashExpenses: { $sum: "$cashExpenses" },
          cashToOffice: { $sum: "$cashToOffice" },
        },
      },
    ]),
    LedgerEntry.aggregate([
      {
        $match: {
          kind: "patientBill",
          shop: shopId,
          date: { $gte: start, $lt: end },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    LedgerEntry.aggregate([
      {
        $match: {
          kind: "salary",
          shop: shopId,
          date: { $gte: start, $lt: end },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const d = dayAgg[0] || {
    totalSale: 0,
    upiReceived: 0,
    personalCr: 0,
    cashExpenses: 0,
    cashToOffice: 0,
  };
  const patientBill = patientBillAgg[0]?.total || 0;
  const salary = salaryAgg[0]?.total || 0;

  const { revenue, expenses, profitLoss } = computeShopPnl({
    totalSale: d.totalSale,
    patientBill,
    upiReceived: d.upiReceived,
    personalCr: d.personalCr,
    salary,
    cashExpenses: d.cashExpenses,
  });

  return {
    month: monthKey,
    totalSale: d.totalSale,
    patientBill,
    salary,
    cashExpenses: d.cashExpenses,
    cashToOffice: d.cashToOffice,
    personalCr: d.personalCr,
    upiReceived: d.upiReceived,
    revenue,
    expenses,
    profitLoss,
  };
};

export const createShop = async (req, res) => {
  try {
    const { name, address, contact, adminEmail, adminPassword } =
      req.body || {};

    if (!name)
      return res.status(400).json({ success: false, message: "Name required" });

    const shop = await Shop.create({ name, address, contact });

    let adminUser = null;
    if (adminEmail && adminPassword) {
      const existing = await User.findOne({ email: adminEmail.toLowerCase() });
      const hashed = await bcrypt.hash(adminPassword, 10);

      if (existing) {
        existing.role = "admin";
        existing.shop = shop._id;
        existing.password = hashed;
        await existing.save();
        adminUser = existing;
      } else {
        adminUser = await User.create({
          name: `${name} Admin`,
          email: adminEmail.toLowerCase(),
          password: hashed,
          role: "admin",
          shop: shop._id,
        });
      }
    }

    res.status(201).json({ success: true, data: { shop, adminUser } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* GET /api/shops — list every shop with a lightweight performance snapshot:
   lifetime figures (admin count, entry count, total sale, cash-in-hand, net
   profit) PLUS this-month Total Sale and this-month P&L (Total Sale +
   Patient Bill + UPI − Personal Cr − Salary − Cash Expenses, site ledger
   Patient Bill/Salary included) so the overview cards mean something at a
   glance, not just names. */
export const getShops = async (req, res) => {
  try {
    const shops = await Shop.find().sort({ createdAt: -1 }).lean();
    const shopIds = shops.map((s) => s._id);
    const { start: monthStart, end: monthEnd } =
      monthRangeFromKey(currentMonthKey());
    const monthDateMatch = { date: { $gte: monthStart, $lt: monthEnd } };

    const [
      adminCounts,
      dayStats,
      monthDayStats,
      monthPatientBill,
      monthSalary,
    ] = await Promise.all([
      User.aggregate([
        {
          $match: { shop: { $in: shopIds }, role: { $in: ["admin", "staff"] } },
        },
        { $group: { _id: "$shop", count: { $sum: 1 } } },
      ]),
      DayBook.aggregate([
        { $match: { shop: { $in: shopIds } } },
        { $sort: { date: 1 } },
        {
          $group: {
            _id: "$shop",
            entries: { $sum: 1 },
            totalSale: { $sum: "$totalSale" },
            totalCashExpenses: { $sum: "$cashExpenses" },
            firstOpeningCash: { $first: "$openingCash" },
            lastDate: { $last: "$date" },
            lastCashInHand: { $last: "$cashInHand" },
          },
        },
      ]),
      DayBook.aggregate([
        { $match: { shop: { $in: shopIds }, ...monthDateMatch } },
        {
          $group: {
            _id: "$shop",
            totalSale: { $sum: "$totalSale" },
            upiReceived: { $sum: "$upiReceived" },
            personalCr: { $sum: "$personalCr" },
            cashExpenses: { $sum: "$cashExpenses" },
          },
        },
      ]),
      LedgerEntry.aggregate([
        {
          $match: {
            kind: "patientBill",
            shop: { $in: shopIds },
            ...monthDateMatch,
          },
        },
        { $group: { _id: "$shop", total: { $sum: "$amount" } } },
      ]),
      LedgerEntry.aggregate([
        {
          $match: { kind: "salary", shop: { $in: shopIds }, ...monthDateMatch },
        },
        { $group: { _id: "$shop", total: { $sum: "$amount" } } },
      ]),
    ]);

    const adminMap = Object.fromEntries(
      adminCounts.map((a) => [String(a._id), a.count]),
    );
    const statMap = Object.fromEntries(dayStats.map((d) => [String(d._id), d]));
    const monthMap = Object.fromEntries(
      monthDayStats.map((d) => [String(d._id), d]),
    );
    const monthPBMap = Object.fromEntries(
      monthPatientBill.map((d) => [String(d._id), d.total]),
    );
    const monthSalMap = Object.fromEntries(
      monthSalary.map((d) => [String(d._id), d.total]),
    );

    const data = shops.map((s) => {
      const key = String(s._id);
      const stat = statMap[key];
      const m = monthMap[key] || {
        totalSale: 0,
        upiReceived: 0,
        personalCr: 0,
        cashExpenses: 0,
      };
      const { profitLoss } = computeShopPnl({
        totalSale: m.totalSale,
        patientBill: monthPBMap[key] || 0,
        upiReceived: m.upiReceived,
        personalCr: m.personalCr,
        salary: monthSalMap[key] || 0,
        cashExpenses: m.cashExpenses,
      });
      return {
        ...s,
        adminCount: adminMap[key] || 0,
        entryCount: stat?.entries || 0,
        totalSale: stat?.totalSale || 0,
        lastEntryDate: stat?.lastDate || null,
        cashInHand: stat?.lastCashInHand ?? null,
        netProfit: stat
          ? (stat.lastCashInHand ?? 0) - (stat.firstOpeningCash ?? 0)
          : 0,
        currentMonthTotalSale: m.totalSale,
        currentMonthProfitLoss: profitLoss,
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* GET /api/shops/:id — full detail: shop record, its admins, every daybook
   entry ever logged for it, and a computed current-month P&L snapshot
   (Total Sale, Patient Bill, Salary, Cash Expenses, Cash to Office, P&L). */
export const getShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop)
      return res
        .status(404)
        .json({ success: false, message: "Shop not found" });

    const admins = await User.find({ shop: shop._id }).select("-password");
    const daybookDocs = await DayBook.find({ shop: shop._id }).sort({
      date: -1,
    });
    const daybooks = daybookDocs.map(serializeDaybook);

    const currentMonthStats = await computeShopMonthStats(
      shop._id,
      currentMonthKey(),
    );

    res.json({
      success: true,
      data: { shop, admins, daybooks, currentMonthStats },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* GET /api/shops/:id/pnl?month=YYYY-MM — P&L snapshot for one shop, one
   month (defaults to the current calendar month if omitted). Powers the
   "This Month" stat cards on the shop detail view, refetched whenever a
   different month tab is selected there. */
export const getShopMonthlyPnl = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).select("_id");
    if (!shop)
      return res
        .status(404)
        .json({ success: false, message: "Shop not found" });

    const month = req.query.month || currentMonthKey();
    const stats = await computeShopMonthStats(shop._id, month);

    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMyShop = async (req, res) => {
  try {
    if (!req.user?.shop) {
      return res
        .status(404)
        .json({ success: false, message: "No shop assigned" });
    }

    const shop = await Shop.findById(req.user.shop);
    if (!shop)
      return res
        .status(404)
        .json({ success: false, message: "Shop not found" });

    const admins = await User.find({ shop: shop._id }).select("-password");
    const daybookDocs = await DayBook.find({ shop: shop._id }).sort({
      date: -1,
    });
    const daybooks = daybookDocs.map(serializeDaybook);

    res.json({ success: true, data: { shop, admins, daybooks } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateShop = async (req, res) => {
  try {
    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        address: req.body.address,
        contact: req.body.contact,
      },
      { new: true, runValidators: true },
    );

    if (!shop)
      return res
        .status(404)
        .json({ success: false, message: "Shop not found" });

    res.json({ success: true, data: shop });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop)
      return res
        .status(404)
        .json({ success: false, message: "Shop not found" });

    await User.updateMany(
      { shop: shop._id },
      { $unset: { shop: "" }, $set: { role: "user" } },
    );
    await DayBook.deleteMany({ shop: shop._id });
    await shop.deleteOne();

    res.json({ success: true, message: "Shop deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const setShopAdmin = async (req, res) => {
  try {
    const shopId = req.params.id;
    const { email, password, name } = req.body || {};

    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Email and password required" });

    const shop = await Shop.findById(shopId);
    if (!shop)
      return res
        .status(404)
        .json({ success: false, message: "Shop not found" });

    const hashed = await bcrypt.hash(password, 10);

    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      user.role = "admin";
      user.shop = shop._id;
      user.password = hashed;
      if (name) user.name = name;
      await user.save();
    } else {
      user = await User.create({
        name: name || `${shop.name} Admin`,
        email: email.toLowerCase(),
        password: hashed,
        role: "admin",
        shop: shop._id,
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          shop: user.shop,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* PUT /api/shops/:id/admin/:adminId — update an existing site admin's name,
   email, and/or password. Password is only changed if a new one is sent;
   leaving it blank keeps the current one. */
export const updateShopAdmin = async (req, res) => {
  try {
    const { id: shopId, adminId } = req.params;
    const { name, email, password } = req.body || {};

    const admin = await User.findOne({ _id: adminId, shop: shopId });
    if (!admin)
      return res
        .status(404)
        .json({ success: false, message: "Admin not found for this site" });

    if (email && email.toLowerCase() !== admin.email) {
      const clash = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: admin._id },
      });
      if (clash)
        return res
          .status(400)
          .json({ success: false, message: "That email is already in use" });
      admin.email = email.toLowerCase();
    }
    if (name) admin.name = name;
    if (password) admin.password = await bcrypt.hash(password, 10);

    await admin.save();

    res.json({
      success: true,
      data: {
        user: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          shop: admin.shop,
        },
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
