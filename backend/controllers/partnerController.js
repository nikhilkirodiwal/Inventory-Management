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
const buildStats = (list) => {
  const transferred = list
    .filter((t) => t.type === "transfer")
    .reduce((s, t) => s + t.amount, 0);
  const received = list
    .filter((t) => t.type === "receive")
    .reduce((s, t) => s + t.amount, 0);
  const lastTransactionDate = list.reduce(
    (max, t) => (!max || t.date > max ? t.date : max),
    null,
  );
  return {
    transferred,
    received,
    netBalance: received - transferred,
    transactionCount: list.length,
    lastTransactionDate,
  };
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

/* GET /api/partners/:id — partner record + every transaction, newest first
   (kept for backward compat / exports) */
export const getPartnerDetail = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner)
      return res
        .status(404)
        .json({ success: false, message: "Partner not found" });

    const transactions = await PartnerTransaction.find({ partner: partner._id })
      .populate("shop", "name")
      .sort({ date: -1 });

    res.json({ success: true, data: { partner, transactions } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* GET /api/partners/:id/overview — EVERY shop/site in the system (even ones
   with zero activity for this partner) plus that partner's full, all-time
   transaction history grouped under each site. This powers the "all shops,
   then all transactions per site" partner page. */
export const getPartnerOverview = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner)
      return res
        .status(404)
        .json({ success: false, message: "Partner not found" });

    const [allShops, transactions] = await Promise.all([
      Shop.find().sort({ name: 1 }).select("name").lean(),
      PartnerTransaction.find({ partner: partner._id }).sort({ date: -1 }),
    ]);

    const byShop = {};
    transactions.forEach((t) => {
      const key = t.shop ? String(t.shop) : "unassigned";
      byShop[key] = byShop[key] || [];
      byShop[key].push(t);
    });

    const shops = allShops.map((sh) => {
      const key = String(sh._id);
      const list = byShop[key] || [];
      return {
        shopId: key,
        shopName: sh.name,
        transactions: list,
        ...buildStats(list),
      };
    });

    // Unassigned always shows up as a card too, so there's somewhere to log
    // a transaction that isn't tied to any specific site.
    const unassignedList = byShop.unassigned || [];
    shops.push({
      shopId: "unassigned",
      shopName: "Unassigned",
      transactions: unassignedList,
      ...buildStats(unassignedList),
    });

    const allTimeTotals = buildStats(transactions);

    res.json({ success: true, data: { partner, shops, allTimeTotals } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* GET /api/partners/:id/shops?month=YYYY-MM — every shop/site, scoped to one
   month, for the level-2 "site-wise this month" summary view */
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

    const statMap = {};
    grouped.forEach((g) => {
      const key = g._id.shop ? String(g._id.shop) : "unassigned";
      statMap[key] = statMap[key] || {
        transferred: 0,
        received: 0,
        count: 0,
        lastDate: null,
      };
      if (g._id.type === "transfer") statMap[key].transferred = g.total;
      else statMap[key].received = g.total;
      statMap[key].count += g.count;
      if (!statMap[key].lastDate || g.lastDate > statMap[key].lastDate)
        statMap[key].lastDate = g.lastDate;
    });

    // Every shop gets a card, even with zero activity this month
    const allShops = await Shop.find().sort({ name: 1 }).select("name").lean();
    const shops = allShops.map((sh) => {
      const key = String(sh._id);
      const v = statMap[key] || {
        transferred: 0,
        received: 0,
        count: 0,
        lastDate: null,
      };
      return {
        shopId: key,
        shopName: sh.name,
        transferred: v.transferred,
        received: v.received,
        netBalance: v.received - v.transferred,
        transactionCount: v.count,
        lastTransactionDate: v.lastDate,
      };
    });

    if (statMap.unassigned) {
      const v = statMap.unassigned;
      shops.push({
        shopId: "unassigned",
        shopName: "Unassigned",
        transferred: v.transferred,
        received: v.received,
        netBalance: v.received - v.transferred,
        transactionCount: v.count,
        lastTransactionDate: v.lastDate,
      });
    }

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
   oldest first (frontend filters by month client-side). :shopId may be
   the literal string "unassigned". */
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
