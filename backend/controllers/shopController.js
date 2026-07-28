import Shop from "../models/shop.js";
import User from "../models/user.js";
import bcrypt from "bcryptjs";
import DayBook from "../models/dayBook.js";

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

/* GET /api/shops — list every shop with a lightweight performance snapshot
   (admin count, entry count, total sale, latest cash-in-hand, net profit)
   so the superadmin overview can show real numbers, not just names. */
export const getShops = async (req, res) => {
  try {
    const shops = await Shop.find().sort({ createdAt: -1 }).lean();
    const shopIds = shops.map((s) => s._id);

    const [adminCounts, dayStats] = await Promise.all([
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
    ]);

    const adminMap = Object.fromEntries(
      adminCounts.map((a) => [String(a._id), a.count]),
    );
    const statMap = Object.fromEntries(dayStats.map((d) => [String(d._id), d]));

    const data = shops.map((s) => {
      const stat = statMap[String(s._id)];
      return {
        ...s,
        adminCount: adminMap[String(s._id)] || 0,
        entryCount: stat?.entries || 0,
        totalSale: stat?.totalSale || 0,
        lastEntryDate: stat?.lastDate || null,
        cashInHand: stat?.lastCashInHand ?? null,
        netProfit: stat
          ? (stat.lastCashInHand ?? 0) - (stat.firstOpeningCash ?? 0)
          : 0,
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* GET /api/shops/:id — full detail: shop record, its admins, and every
   daybook entry ever logged for it, correctly serialized. */
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

    res.json({ success: true, data: { shop, admins, daybooks } });
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
