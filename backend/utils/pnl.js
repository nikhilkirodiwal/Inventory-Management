/**
 * Per-shop P&L, in one place so it can't drift between the P&L tab, the
 * superadmin shop cards, and the shop detail view.
 *
 *   revenue  = Total Sale (kitchen + coffee) + Patient Bill (site ledger) + UPI Received
 *   expenses = Personal Cr + Salary (site ledger) + Cash Expenses
 *   P&L      = revenue − expenses
 *
 * Patient Bill and Salary here are the SITE-WISE LedgerEntry totals (managed
 * by the superadmin's Ledger tab), not the daybook's own officialCr/salary
 * fields — those are a separate, informal day-to-day tracking mechanism.
 */
export const computeShopPnl = ({
  totalSale = 0,
  patientBill = 0,
  upiReceived = 0,
  personalCr = 0,
  salary = 0,
  cashExpenses = 0,
} = {}) => {
  const revenue = totalSale + patientBill + upiReceived;
  const expenses = personalCr + salary + cashExpenses;
  return { revenue, expenses, profitLoss: revenue - expenses };
};