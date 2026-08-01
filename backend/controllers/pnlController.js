import DayBook from "../models/dayBook.js";
import Shop from "../models/shop.js";
import LedgerEntry from "../models/ledgerEntry.js";

const monthRange = (month) => {
  const [year, mon] = month.split("-").map(Number);
  return { $gte: new Date(Date.UTC(year, mon - 1, 1)), $lt: new Date(Date.UTC(year, mon, 1)) };
};

/* GET /api/pnl?month=YYYY-MM (omit month for all-time)
 *
 * Per-shop:  revenue = kitchenSale + coffeeShop + officialCr + personalCr
 *            expenses = cashExpenses   (Vendor category shown as an informational
 *                       sub-total, not subtracted a second time — it's already
 *                       inside cashExpenses)
 *            P&L = revenue − expenses
 *
 * Combined:  revenue = Σ(per-shop revenue) + global Patient Bill
 *            expenses = Σ(per-shop expenses) + global Salary + global Admin Expense
 *            P&L = revenue − expenses
 */
export const getPnl = async (req, res) => {
  try {
    const { month } = req.query;
    const dateMatch = month ? { date: monthRange(month) } : {};

    const perShopAgg = await DayBook.aggregate([
      { $match: dateMatch },
      {
        $addFields: {
          vendorArr: {
            $filter: {
              input: { $objectToArray: { $ifNull: ["$expenseEntries", {}] } },
              as: "e",
              cond: { $eq: ["$$e.k", "Vendor"] },
            },
          },
        },
      },
      { $addFields: { vendorAmt: { $sum: "$vendorArr.v" } } },
      {
        $group: {
          _id: "$shop",
          revenue: { $sum: { $add: ["$kitchenSale", "$coffeeShop", "$officialCr", "$personalCr"] } },
          expenses: { $sum: "$cashExpenses" },
          vendor: { $sum: "$vendorAmt" },
          days: { $sum: 1 },
        },
      },
    ]);

    const shopIds = perShopAgg.map((s) => s._id).filter(Boolean);
    const shops = await Shop.find({ _id: { $in: shopIds } }).select("name").lean();
    const shopNameMap = Object.fromEntries(shops.map((s) => [String(s._id), s.name]));

    const perShop = perShopAgg
      .map((s) => ({
        shopId: s._id,
        shopName: shopNameMap[String(s._id)] || "Unassigned",
        revenue: s.revenue,
        expenses: s.expenses,
        vendor: s.vendor,
        days: s.days,
        profitLoss: s.revenue - s.expenses,
      }))
      .sort((a, b) => a.shopName.localeCompare(b.shopName));

    const shopTotals = perShop.reduce(
      (a, s) => ({ revenue: a.revenue + s.revenue, expenses: a.expenses + s.expenses, vendor: a.vendor + s.vendor }),
      { revenue: 0, expenses: 0, vendor: 0 },
    );

    const ledgerMatch = month ? { date: monthRange(month) } : {};
    const [patientBillAgg, salaryAgg, adminExpenseAgg] = await Promise.all([
      LedgerEntry.aggregate([{ $match: { kind: "patientBill", ...ledgerMatch } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      LedgerEntry.aggregate([{ $match: { kind: "salary", ...ledgerMatch } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      LedgerEntry.aggregate([{ $match: { kind: "adminExpense", ...ledgerMatch } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    ]);
    const patientBill = patientBillAgg[0]?.total || 0;
    const salary = salaryAgg[0]?.total || 0;
    const adminExpense = adminExpenseAgg[0]?.total || 0;

    const combinedRevenue = shopTotals.revenue + patientBill;
    const combinedExpenses = shopTotals.expenses + salary + adminExpense;

    const combined = {
      shopRevenue: shopTotals.revenue,
      shopExpenses: shopTotals.expenses,
      vendor: shopTotals.vendor,
      patientBill,
      salary,
      adminExpense,
      revenue: combinedRevenue,
      expenses: combinedExpenses,
      profitLoss: combinedRevenue - combinedExpenses,
    };

    res.json({ success: true, data: { month: month || "all-time", perShop, combined } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};