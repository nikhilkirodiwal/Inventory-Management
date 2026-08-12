import Partner from "../models/partner.js";
import PartnerTransaction from "../models/partnerTransaction.js";
import Shop from "../models/shop.js";

/* ─── helpers ────────────────────────────────────────────────────────────── */
const monthRange = (month) => {
  const [year, mon] = month.split("-").map(Number);
  return {
    $gte: new Date(Date.UTC(year, mon - 1, 1)),
    $lt: new Date(Date.UTC(year, mon, 1)),
  };
};
const currentMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const buildTypeMap = (stats) => {
  const map = {};
  stats.forEach((s) => {
    const key = String(s._id.partner);
    map[key] = map[key] || { transferred: 0, received: 0 };
    if (s._id.type === "transfer") map[key].transferred = s.total;
    else map[key].received = s.total;
  });
  return map;
};

/* GET /api/partners?month=YYYY-MM — every partner with all-time AND
   current-month (or requested month) stat snapshots */
export const getPartners = async (req, res) => {
  try {
    const month = req.query.month || currentMonthKey();
    const partners = await Partner.find().sort({ createdAt: 1 }).lean();
    const partnerIds = partners.map((p) => p._id);

    const [allTimeStats, monthStats, lastDates] = await Promise.all([
      PartnerTransaction.aggregate([
        { $match: { partner: { $in: partnerIds } } },
        {
          $group: {
            _id: { partner: "$partner", type: "$type" },
            total: { $sum: "$amount" },
          },
        },
      ]),
      PartnerTransaction.aggregate([
        { $match: { partner: { $in: partnerIds }, date: monthRange(month) } },
        {
          $group: {
            _id: { partner: "$partner", type: "$type" },
            total: { $sum: "$amount" },
          },
        },
      ]),
      PartnerTransaction.aggregate([
        { $match: { partner: { $in: partnerIds } } },
        { $sort: { date: -1 } },
        {
          $group: {
            _id: "$partner",
            lastDate: { $first: "$date" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const allTimeMap = buildTypeMap(allTimeStats);
    const monthMap = buildTypeMap(monthStats);
    const lastMap = Object.fromEntries(
      lastDates.map((d) => [String(d._id), d]),
    );

    const data = partners.map((p) => {
      const key = String(p._id);
      const at = allTimeMap[key] || { transferred: 0, received: 0 };
      const mo = monthMap[key] || { transferred: 0, received: 0 };
      const last = lastMap[key];
      return {
        ...p,
        allTime: { ...at, netBalance: at.received - at.transferred },
        monthly: { ...mo, netBalance: mo.received - mo.transferred, month },
        // legacy flat fields — kept in case older frontend code still reads these directly
        totalTransferred: at.transferred,
        totalReceived: at.received,
        netBalance: at.received - at.transferred,
        transactionCount: last?.count || 0,
        lastTransactionDate: last?.lastDate || null,
      };
    });

    res.json({ success: true, data, month });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createPartner = async (req, res) => {
  try {
    const { name, note } = req.body || {};
    if (!name)
      return res.status(400).json({ success: false, message: "Name required" });
    const partner = await Partner.create({ name, note });
    res.status(201).json({ success: true, data: partner });
  } catch (err) {
    if (err.code === 11000)
      return res
        .status(400)
        .json({ success: false, message: "Partner already exists" });
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updatePartner = async (req, res) => {
  try {
    const { name, note } = req.body || {};
    const partner = await Partner.findByIdAndUpdate(
      req.params.id,
      { name, note },
      { new: true, runValidators: true },
    );
    if (!partner)
      return res
        .status(404)
        .json({ success: false, message: "Partner not found" });
    res.json({ success: true, data: partner });
  } catch (err) {
    if (err.code === 11000)
      return res
        .status(400)
        .json({
          success: false,
          message: "A partner with this name already exists",
        });
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deletePartner = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner)
      return res
        .status(404)
        .json({ success: false, message: "Partner not found" });

    await PartnerTransaction.deleteMany({ partner: partner._id });
    await partner.deleteOne();

    res.json({ success: true, message: "Partner deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* GET /api/partners/:id — partner record + every transaction, oldest first
   (kept for backward compat / exports; the UI now drills down via /shops) */
export const getPartnerDetail = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner)
      return res
        .status(404)
        .json({ success: false, message: "Partner not found" });

    const transactions = await PartnerTransaction.find({
      partner: partner._id,
    }).sort({ date: 1 });

    res.json({ success: true, data: { partner, transactions } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* GET /api/partners/:id/shops?month=YYYY-MM — level 2:
   this partner's transactions for the month, grouped by site.
   A "shop" with shopId "unassigned" is included whenever legacy
   (pre-shop-tagging) transactions fall in that month. */
export const getPartnerShops = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner)
      return res
        .status(404)
        .json({ success: false, message: "Partner not found" });

    const month = req.query.month || currentMonthKey();

    const grouped = await PartnerTransaction.aggregate([
      { $match: { partner: partner._id, date: monthRange(month) } },
      {
        $group: {
          _id: { shop: "$shop", type: "$type" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
          lastDate: { $max: "$date" },
        },
      },
    ]);

    const shopMap = {};
    grouped.forEach((g) => {
      const key = g._id.shop ? String(g._id.shop) : "unassigned";
      shopMap[key] = shopMap[key] || {
        transferred: 0,
        received: 0,
        count: 0,
        lastDate: null,
      };
      if (g._id.type === "transfer") shopMap[key].transferred = g.total;
      else shopMap[key].received = g.total;
      shopMap[key].count += g.count;
      if (!shopMap[key].lastDate || g.lastDate > shopMap[key].lastDate)
        shopMap[key].lastDate = g.lastDate;
    });

    const shopIds = Object.keys(shopMap).filter((k) => k !== "unassigned");
    const shopDocs = await Shop.find({ _id: { $in: shopIds } })
      .select("name")
      .lean();
    const nameMap = Object.fromEntries(
      shopDocs.map((s) => [String(s._id), s.name]),
    );

    const shops = Object.entries(shopMap)
      .map(([key, v]) => ({
        shopId: key,
        shopName:
          key === "unassigned" ? "Unassigned" : nameMap[key] || "Unknown Site",
        transferred: v.transferred,
        received: v.received,
        netBalance: v.received - v.transferred,
        transactionCount: v.count,
        lastTransactionDate: v.lastDate,
      }))
      .sort((a, b) => {
        if (a.shopId === "unassigned") return 1;
        if (b.shopId === "unassigned") return -1;
        return a.shopName.localeCompare(b.shopName);
      });

    const monthTotals = shops.reduce(
      (a, s) => ({
        transferred: a.transferred + s.transferred,
        received: a.received + s.received,
      }),
      { transferred: 0, received: 0 },
    );

    res.json({
      success: true,
      data: {
        partner,
        month,
        shops,
        monthTotals: {
          ...monthTotals,
          netBalance: monthTotals.received - monthTotals.transferred,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* GET /api/partners/:id/shops/:shopId — level 3:
   every transaction between this partner and this one site, day-wise,
   oldest first (frontend filters by month client-side, same pattern as
   before). :shopId may be the literal string "unassigned". */
export const getPartnerShopTransactions = async (req, res) => {
  try {
    const { id, shopId } = req.params;
    const partner = await Partner.findById(id);
    if (!partner)
      return res
        .status(404)
        .json({ success: false, message: "Partner not found" });

    let shop = null;
    const match = { partner: partner._id };
    if (shopId === "unassigned") {
      match.shop = null;
    } else {
      shop = await Shop.findById(shopId).select("name");
      if (!shop)
        return res
          .status(404)
          .json({ success: false, message: "Site not found" });
      match.shop = shop._id;
    }

    const transactions = await PartnerTransaction.find(match).sort({ date: 1 });

    res.json({ success: true, data: { partner, shop, shopId, transactions } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const { date, type, amount, note, shop } = req.body || {};
    if (!date || !type || amount === undefined)
      return res
        .status(400)
        .json({
          success: false,
          message: "date, type, and amount are required",
        });
    if (!["transfer", "receive"].includes(type))
      return res
        .status(400)
        .json({
          success: false,
          message: "type must be 'transfer' or 'receive'",
        });

    const partner = await Partner.findById(req.params.id);
    if (!partner)
      return res
        .status(404)
        .json({ success: false, message: "Partner not found" });

    let shopValue = null;
    if (shop && shop !== "unassigned") {
      const shopDoc = await Shop.findById(shop);
      if (!shopDoc)
        return res
          .status(400)
          .json({ success: false, message: "Invalid site" });
      shopValue = shopDoc._id;
    }

    const txn = await PartnerTransaction.create({
      partner: partner._id,
      shop: shopValue,
      date,
      type,
      amount: Number(amount),
      note: note || "",
    });
    res.status(201).json({ success: true, data: txn });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const { date, type, amount, note, shop } = req.body || {};
    const update = { date, type, amount: Number(amount), note };
    if (shop !== undefined) {
      update.shop = shop && shop !== "unassigned" ? shop : null;
    }
    const txn = await PartnerTransaction.findByIdAndUpdate(
      req.params.txnId,
      update,
      { new: true, runValidators: true },
    );
    if (!txn)
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
    res.json({ success: true, data: txn });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const txn = await PartnerTransaction.findByIdAndDelete(req.params.txnId);
    if (!txn)
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
    res.json({ success: true, message: "Transaction deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
