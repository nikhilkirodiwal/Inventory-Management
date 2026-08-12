import DayBook from "../models/dayBook.js";
import Shop from "../models/shop.js";
import LedgerEntry from "../models/ledgerEntry.js";
import { computeShopPnl } from "../utils/pnl.js";

const monthRange = (month) => {
  const [year, mon] = month.split("-").map(Number);
  return {
    $gte: new Date(Date.UTC(year, mon - 1, 1)),
    $lt: new Date(Date.UTC(year, mon, 1)),
  };
};

/* GET /api/pnl?month=YYYY-MM (omit month for all-time)
 *
 * Per-shop:  revenue  = Total Sale + Patient Bill (site ledger) + UPI Received
 *            expenses = Personal Cr + Salary (site ledger) + Cash Expenses
 *            P&L = revenue − expenses
 *
 * Combined:  revenue  = Σ(per-shop revenue)
 *            expenses = Σ(per-shop expenses) + Admin Expense (business-wide,
 *                       not tied to any one site)
 *            P&L = revenue − expenses
 */
export const getPnl = async (req, res) => {
  try {
    const { month } = req.query;
    const dateMatch = month ? { date: monthRange(month) } : {};
    const ledgerDateMatch = month ? { date: monthRange(month) } : {};

    const [
      dayBookAgg,
      shops,
      patientBillByShop,
      salaryByShop,
      adminExpenseAgg,
    ] = await Promise.all([
      DayBook.aggregate([
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
            totalSale: { $sum: "$totalSale" },
            upiReceived: { $sum: "$upiReceived" },
            personalCr: { $sum: "$personalCr" },
            cashExpenses: { $sum: "$cashExpenses" },
            cashToOffice: { $sum: "$cashToOffice" },
            vendor: { $sum: "$vendorAmt" },
            days: { $sum: 1 },
          },
        },
      ]),
      Shop.find().select("name").lean(),
      LedgerEntry.aggregate([
        { $match: { kind: "patientBill", ...ledgerDateMatch } },
        { $group: { _id: "$shop", total: { $sum: "$amount" } } },
      ]),
      LedgerEntry.aggregate([
        { $match: { kind: "salary", ...ledgerDateMatch } },
        { $group: { _id: "$shop", total: { $sum: "$amount" } } },
      ]),
      LedgerEntry.aggregate([
        { $match: { kind: "adminExpense", ...ledgerDateMatch } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const shopNameMap = Object.fromEntries(
      shops.map((s) => [String(s._id), s.name]),
    );
    const dayBookMap = Object.fromEntries(
      dayBookAgg.filter((d) => d._id).map((d) => [String(d._id), d]),
    );
    const patientBillMap = Object.fromEntries(
      patientBillByShop
        .filter((p) => p._id)
        .map((p) => [String(p._id), p.total]),
    );
    const salaryMap = Object.fromEntries(
      salaryByShop.filter((s) => s._id).map((s) => [String(s._id), s.total]),
    );
    const adminExpense = adminExpenseAgg[0]?.total || 0;

    // Union of every shop that had daybook activity, a patient bill entry, or
    // a salary entry this period — a shop with only ledger entries (no
    // daybook days logged yet) should still show up.
    const shopIds = new Set([
      ...Object.keys(dayBookMap),
      ...Object.keys(patientBillMap),
      ...Object.keys(salaryMap),
    ]);

    const perShop = Array.from(shopIds)
      .map((id) => {
        const db = dayBookMap[id] || {
          totalSale: 0,
          upiReceived: 0,
          personalCr: 0,
          cashExpenses: 0,
          cashToOffice: 0,
          vendor: 0,
          days: 0,
        };
        const patientBill = patientBillMap[id] || 0;
        const salary = salaryMap[id] || 0;
        const { revenue, expenses, profitLoss } = computeShopPnl({
          totalSale: db.totalSale,
          patientBill,
          upiReceived: db.upiReceived,
          personalCr: db.personalCr,
          salary,
          cashExpenses: db.cashExpenses,
        });
        return {
          shopId: id,
          shopName: shopNameMap[id] || "Unknown Site",
          totalSale: db.totalSale,
          patientBill,
          upiReceived: db.upiReceived,
          personalCr: db.personalCr,
          salary,
          cashExpenses: db.cashExpenses,
          cashToOffice: db.cashToOffice,
          vendor: db.vendor,
          days: db.days,
          revenue,
          expenses,
          profitLoss,
        };
      })
      .sort((a, b) => a.shopName.localeCompare(b.shopName));

    const shopTotals = perShop.reduce(
      (a, s) => ({
        revenue: a.revenue + s.revenue,
        expenses: a.expenses + s.expenses,
        totalSale: a.totalSale + s.totalSale,
        patientBill: a.patientBill + s.patientBill,
        upiReceived: a.upiReceived + s.upiReceived,
        personalCr: a.personalCr + s.personalCr,
        salary: a.salary + s.salary,
        cashExpenses: a.cashExpenses + s.cashExpenses,
        cashToOffice: a.cashToOffice + s.cashToOffice,
        vendor: a.vendor + s.vendor,
      }),
      {
        revenue: 0,
        expenses: 0,
        totalSale: 0,
        patientBill: 0,
        upiReceived: 0,
        personalCr: 0,
        salary: 0,
        cashExpenses: 0,
        cashToOffice: 0,
        vendor: 0,
      },
    );

    const combinedRevenue = shopTotals.revenue;
    const combinedExpenses = shopTotals.expenses + adminExpense;

    const combined = {
      ...shopTotals,
      adminExpense,
      revenue: combinedRevenue,
      expenses: combinedExpenses,
      profitLoss: combinedRevenue - combinedExpenses,
    };

    res.json({
      success: true,
      data: { month: month || "all-time", perShop, combined },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
