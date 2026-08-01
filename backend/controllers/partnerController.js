import Partner from "../models/partner.js";
import PartnerTransaction from "../models/partnerTransaction.js";

/* GET /api/partners — every partner with a running balance snapshot */
export const getPartners = async (req, res) => {
  try {
    const partners = await Partner.find().sort({ createdAt: 1 }).lean();
    const partnerIds = partners.map((p) => p._id);

    const stats = await PartnerTransaction.aggregate([
      { $match: { partner: { $in: partnerIds } } },
      { $sort: { date: 1 } },
      {
        $group: {
          _id: { partner: "$partner", type: "$type" },
          total: { $sum: "$amount" },
        },
      },
    ]);

    const lastDates = await PartnerTransaction.aggregate([
      { $match: { partner: { $in: partnerIds } } },
      { $sort: { date: -1 } },
      { $group: { _id: "$partner", lastDate: { $first: "$date" }, count: { $sum: 1 } } },
    ]);

    const statMap = {};
    stats.forEach((s) => {
      const key = String(s._id.partner);
      statMap[key] = statMap[key] || { transferred: 0, received: 0 };
      if (s._id.type === "transfer") statMap[key].transferred = s.total;
      else statMap[key].received = s.total;
    });
    const lastMap = Object.fromEntries(lastDates.map((d) => [String(d._id), d]));

    const data = partners.map((p) => {
      const st = statMap[String(p._id)] || { transferred: 0, received: 0 };
      const last = lastMap[String(p._id)];
      return {
        ...p,
        totalTransferred: st.transferred,
        totalReceived: st.received,
        // Net = money the partner has put IN minus money paid OUT to them.
        // Positive = partner is net-owed less / has contributed more than withdrawn.
        netBalance: st.received - st.transferred,
        transactionCount: last?.count || 0,
        lastTransactionDate: last?.lastDate || null,
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createPartner = async (req, res) => {
  try {
    const { name, note } = req.body || {};
    if (!name) return res.status(400).json({ success: false, message: "Name required" });
    const partner = await Partner.create({ name, note });
    res.status(201).json({ success: true, data: partner });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: "Partner already exists" });
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
    if (!partner) return res.status(404).json({ success: false, message: "Partner not found" });
    res.json({ success: true, data: partner });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: "A partner with this name already exists" });
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deletePartner = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) return res.status(404).json({ success: false, message: "Partner not found" });

    await PartnerTransaction.deleteMany({ partner: partner._id });
    await partner.deleteOne();

    res.json({ success: true, message: "Partner deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* GET /api/partners/:id — partner record + every transaction, oldest first */
export const getPartnerDetail = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) return res.status(404).json({ success: false, message: "Partner not found" });

    const transactions = await PartnerTransaction.find({ partner: partner._id }).sort({ date: 1 });

    res.json({ success: true, data: { partner, transactions } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const { date, type, amount, note } = req.body || {};
    if (!date || !type || amount === undefined)
      return res.status(400).json({ success: false, message: "date, type, and amount are required" });
    if (!["transfer", "receive"].includes(type))
      return res.status(400).json({ success: false, message: "type must be 'transfer' or 'receive'" });

    const partner = await Partner.findById(req.params.id);
    if (!partner) return res.status(404).json({ success: false, message: "Partner not found" });

    const txn = await PartnerTransaction.create({
      partner: partner._id,
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
    const { date, type, amount, note } = req.body || {};
    const txn = await PartnerTransaction.findByIdAndUpdate(
      req.params.txnId,
      { date, type, amount: Number(amount), note },
      { new: true, runValidators: true },
    );
    if (!txn) return res.status(404).json({ success: false, message: "Transaction not found" });
    res.json({ success: true, data: txn });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const txn = await PartnerTransaction.findByIdAndDelete(req.params.txnId);
    if (!txn) return res.status(404).json({ success: false, message: "Transaction not found" });
    res.json({ success: true, message: "Transaction deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};