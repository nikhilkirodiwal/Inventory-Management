/* ─── Month helpers ──────────────────────────────────────────────────────── */
export const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
export const toMonthKey = (y, m) => `${y}-${String(m).padStart(2, "0")}`;
export const parseKey = (k) => {
  const [y, m] = k.split("-");
  return { year: +y, month: +m };
};
export const displayMonth = (k) => {
  const { year, month } = parseKey(k);
  return `${MONTH_NAMES[month - 1]} ${year}`;
};
export const prevMonth = (k) => {
  const { year, month } = parseKey(k);
  return month === 1 ? toMonthKey(year - 1, 12) : toMonthKey(year, month - 1);
};
export const nextMonth = (k) => {
  const { year, month } = parseKey(k);
  return month === 12 ? toMonthKey(year + 1, 1) : toMonthKey(year, month + 1);
};
export const isAfterToday = (k) => {
  const { year, month } = parseKey(k);
  const n = new Date();
  return (
    year > n.getFullYear() ||
    (year === n.getFullYear() && month > n.getMonth() + 1)
  );
};
export const lastNMonths = (base, n) => {
  const r = [];
  let c = base;
  for (let i = 0; i < n; i++) {
    r.push(c);
    c = prevMonth(c);
  }
  return r;
};
export const yearsFrom = (sy, ek) => {
  const { year: ey } = parseKey(ek);
  const r = [];
  for (let y = ey; y >= sy; y--) r.push(y);
  return r;
};
export const monthsForYear = (y, ek) => {
  const { year: ey, month: em } = parseKey(ek);
  const r = [];
  const maxM = y === ey ? em : 12;
  for (let m = maxM; m >= 1; m--) r.push(toMonthKey(y, m));
  return r;
};
export const todayStr = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
};

/* ─── Default expense categories ─────────────────────────────────────────── */
// Salary and Advance used to live here as generic category keys. They now
// have their own by-person breakdown fields (salaryEntries / advanceEntries),
// so they're intentionally no longer part of this list.
export const DEFAULT_EXPENSE_CATS = [
  "Ration",
  "Paneer",
  "Veg",
  "Bread",
  "Juice",
  "Disposable",
  "Biscuits/Chips",
  "Sweets/Snacks",
  "Milk",
  "Room Rent",
  "LPG",
  "Egg",
  "HK",
  "Stationery",
  "Metro/Hsp",
  "Crockery",
  "CD/Coconut",
  "Mineral Water",
  "Misc/Repair",
  "OT",
  "Mobile/Petrol",
  "Vendor",
  "Conveyance",
  "Travel Exp",
];

/* ─── Formatters ─────────────────────────────────────────────────────────── */
export const fmt = (n) =>
  n === undefined || n === null || isNaN(n)
    ? "—"
    : new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
export const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
export const normalizeExpenses = (raw) => {
  if (!raw || typeof raw !== "object") return {};
  return Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, Number(v) || 0]),
  );
};
export const sumExpenses = (obj = {}) =>
  Object.values(obj).reduce((s, v) => s + (Number(v) || 0), 0);
export const sumPersonEntries = (arr = []) =>
  arr.reduce((s, x) => s + (Number(x.amount) || 0), 0);
export const subTabTotal = (t) =>
  t.entries?.length > 0
    ? sumPersonEntries(t.entries)
    : Number(t.directAmount) || 0;
export const flattenSubTabs = (tabs = []) =>
  tabs.flatMap((t) =>
    t.entries?.length > 0
      ? t.entries.map((e) => ({
          name: `[${t.name}] ${e.name}`,
          amount: e.amount,
        }))
      : [{ name: t.name, amount: t.directAmount }],
  );

/* ─── Personal Cr. partial-credit helpers ────────────────────────────────── */
export const creditLeft = (item) =>
  Math.max(0, (Number(item.amount) || 0) - (Number(item.creditedAmount) || 0));
export const creditStatus = (item) => {
  const amount = Number(item.amount) || 0;
  const credited = Number(item.creditedAmount) || 0;
  if (credited <= 0) return "pending";
  if (credited >= amount) return "full";
  return "partial";
};
export const creditPct = (item) => {
  const amount = Number(item.amount) || 0;
  if (amount <= 0) return 0;
  const credited = Number(item.creditedAmount) || 0;
  return Math.min(100, Math.round((credited / amount) * 100));
};
