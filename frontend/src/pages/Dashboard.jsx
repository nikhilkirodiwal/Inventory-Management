import { Fragment, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import API from "../api/axios";

/* ─── Month helpers ─────────────────────────────────────────────────────────── */
const MONTH_NAMES = [
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
const toMonthKey = (y, m) => `${y}-${String(m).padStart(2, "0")}`;
const parseKey = (k) => {
  const [y, m] = k.split("-");
  return { year: +y, month: +m };
};
const displayMonth = (k) => {
  const { year, month } = parseKey(k);
  return `${MONTH_NAMES[month - 1]} ${year}`;
};
const prevMonth = (k) => {
  const { year, month } = parseKey(k);
  return month === 1 ? toMonthKey(year - 1, 12) : toMonthKey(year, month - 1);
};
const nextMonth = (k) => {
  const { year, month } = parseKey(k);
  return month === 12 ? toMonthKey(year + 1, 1) : toMonthKey(year, month + 1);
};
const isAfterToday = (k) => {
  const { year, month } = parseKey(k);
  const n = new Date();
  return (
    year > n.getFullYear() ||
    (year === n.getFullYear() && month > n.getMonth() + 1)
  );
};
const lastNMonths = (base, n) => {
  const r = [];
  let c = base;
  for (let i = 0; i < n; i++) {
    r.push(c);
    c = prevMonth(c);
  }
  return r;
};
const todayStr = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
};

const yearsFrom = (sy, ek) => {
  const { year: ey } = parseKey(ek);
  const r = [];
  for (let y = ey; y >= sy; y--) r.push(y);
  return r;
};
const monthsForYear = (y, ek) => {
  const { year: ey, month: em } = parseKey(ek);
  const r = [];
  const maxM = y === ey ? em : 12;
  for (let m = maxM; m >= 1; m--) r.push(toMonthKey(y, m));
  return r;
};

/* ─── Default expense categories ─────────────────────────────────────────── */
const DEFAULT_EXPENSE_CATS = [
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
  "Advance",
  "Salary",
];

/* ─── Formatters ─────────────────────────────────────────────────────────── */
const fmt = (n) =>
  n === undefined || n === null || isNaN(n)
    ? "—"
    : new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

/* expenseEntries from MongoDB Map comes back as a plain object — normalize it */
const normalizeExpenses = (raw) => {
  if (!raw || typeof raw !== "object") return {};
  // Mongoose Map serializes as { key: value } plain object over JSON — fine
  return Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, Number(v) || 0]),
  );
};

const sumExpenses = (obj = {}) =>
  Object.values(obj).reduce((s, v) => s + (Number(v) || 0), 0);
const sumPersonEntries = (arr = []) =>
  arr.reduce((s, x) => s + (Number(x.amount) || 0), 0);

const COLUMNS = [
  { key: "date", label: "Date", align: "left" },
  { key: "openingCash", label: "Op. Cash", align: "right" },
  { key: "kitchenSale", label: "Kitchen", align: "right" },
  { key: "officialCr", label: "Off. Cr", align: "right" },
  { key: "personalCr", label: "Per. Cr", align: "right" },
  { key: "coffeeShop", label: "Coffee Shop", align: "right" },
  { key: "cafeSale", label: "Café Sale", align: "right" },
  { key: "cafeNight", label: "Café Night", align: "right" },
  { key: "upiReceived", label: "UPI Recv.", align: "right" },
  { key: "totalSale", label: "Total Sale", align: "right" },
  { key: "totalCash", label: "Total Cash", align: "right" },
  { key: "cashToOffice", label: "Cash Office", align: "right" },
  { key: "cashExpenses", label: "Cash Exp.", align: "right" },
  { key: "deficit", label: "Surplus/Def", align: "right" },
  { key: "closingCash", label: "Closing", align: "right" },
];

/* ─── Badge ───────────────────────────────────────────────────────────────── */
function Badge({ children, variant = "default" }) {
  const s = {
    positive: {
      background: "rgba(34,197,94,0.1)",
      color: "#22c55e",
      border: "1px solid rgba(34,197,94,0.2)",
    },
    negative: {
      background: "var(--danger-soft)",
      color: "var(--danger-text)",
      border: "1px solid var(--danger-border)",
    },
    neutral: {
      background: "var(--accent-soft)",
      color: "var(--accent-text)",
      border: "1px solid var(--accent-border)",
    },
  };
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
      style={s[variant] ?? s.neutral}
    >
      {children}
    </span>
  );
}

/* ─── StatCard ────────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, accent, danger }) {
  const bg = accent
    ? "var(--accent-soft)"
    : danger
      ? "var(--danger-soft)"
      : "var(--bg-surface)";
  const bc = accent
    ? "var(--accent-border)"
    : danger
      ? "var(--danger-border)"
      : "var(--border)";
  const color = accent
    ? "var(--accent-text)"
    : danger
      ? "var(--danger-text)"
      : "var(--text-primary)";
  return (
    <div
      className="rounded-xl px-5 py-4 flex flex-col gap-1 border"
      style={{ background: bg, borderColor: bc, boxShadow: "var(--shadow)" }}
    >
      <span
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </span>
      <span className="text-xl font-bold tabular-nums" style={{ color }}>
        ₹{fmt(value)}
      </span>
      {sub && (
        <span className="text-xs" style={{ color: "var(--text-sec)" }}>
          {sub}
        </span>
      )}
    </div>
  );
}

/* ─── MonthTab ────────────────────────────────────────────────────────────── */
function MonthTab({ mk, active, hasData, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5"
      style={{
        color: active ? "var(--accent-text)" : "var(--text-muted)",
        borderBottom: active
          ? "2px solid var(--accent)"
          : "2px solid transparent",
      }}
    >
      {displayMonth(mk)}
      {hasData && (
        <span
          className="w-1.5 h-1.5 rounded-full inline-block"
          style={{ background: active ? "var(--accent)" : "var(--text-muted)" }}
        />
      )}
    </button>
  );
}

/* ─── MonthRow ────────────────────────────────────────────────────────────── */
function MonthRow({ mk, data, loading, onClick }) {
  if (loading)
    return (
      <tr className="border-b" style={{ borderColor: "var(--border-sub)" }}>
        <td
          className="px-4 py-3 font-semibold"
          style={{ color: "var(--accent-text)" }}
        >
          {displayMonth(mk)}
        </td>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <td key={i} className="px-4 py-3 text-right">
            <span
              className="inline-block w-16 h-3 rounded animate-pulse"
              style={{ background: "var(--border)" }}
            />
          </td>
        ))}
      </tr>
    );
  if (!data || data.length === 0)
    return (
      <tr className="border-b" style={{ borderColor: "var(--border-sub)" }}>
        <td
          className="px-4 py-3 font-semibold"
          style={{ color: "var(--accent-text)" }}
        >
          {displayMonth(mk)}
        </td>
        <td
          colSpan={6}
          className="px-4 py-3 text-xs italic"
          style={{ color: "var(--text-muted)" }}
        >
          No data
        </td>
      </tr>
    );
  const t = data.reduce(
    (a, e) => ({
      totalSale: a.totalSale + (e.totalSale || 0),
      totalCash: a.totalCash + (e.totalCash || 0),
      cashExpenses: a.cashExpenses + (e.cashExpenses || 0),
    }),
    { totalSale: 0, totalCash: 0, cashExpenses: 0 },
  );
  const def = t.totalCash - t.cashExpenses;
  return (
    <tr
      className="border-b cursor-pointer transition-colors"
      style={{ borderColor: "var(--border-sub)" }}
      onClick={onClick}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "var(--bg-hover)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <td
        className="px-4 py-3 font-semibold"
        style={{ color: "var(--accent-text)" }}
      >
        {displayMonth(mk)}
      </td>
      <td
        className="px-4 py-3 tabular-nums"
        style={{ color: "var(--text-primary)" }}
      >
        {fmt(t.totalSale)}
      </td>
      <td
        className="px-4 py-3 tabular-nums"
        style={{ color: "var(--text-primary)" }}
      >
        {fmt(t.totalCash)}
      </td>
      <td
        className="px-4 py-3 tabular-nums"
        style={{ color: "var(--danger-text)" }}
      >
        {fmt(t.cashExpenses)}
      </td>
      <td className="px-4 py-3 tabular-nums font-bold">
        <Badge variant={def >= 0 ? "positive" : "negative"}>₹{fmt(def)}</Badge>
      </td>
      <td
        className="px-4 py-3 tabular-nums text-xs"
        style={{ color: "var(--text-muted)" }}
      >
        {data.length} days
      </td>
      <td className="px-4 py-3">
        <span
          className="text-xs px-2 py-1 rounded border"
          style={{
            borderColor: "var(--accent-border)",
            color: "var(--accent-text)",
            background: "var(--accent-soft)",
          }}
        >
          View →
        </span>
      </td>
    </tr>
  );
}

/* ─── PersonEntryPopup ────────────────────────────────────────────────────── */
function PersonEntryPopup({ title, entries, onClose, onSave }) {
  const [rows, setRows] = useState(
    entries.length > 0 ? entries : [{ name: "", amount: "" }],
  );
  const addRow = () => setRows((p) => [...p, { name: "", amount: "" }]);
  const upd = (i, k, v) =>
    setRows((p) => p.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const del = (i) => setRows((p) => p.filter((_, j) => j !== i));
  const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="rounded-2xl w-full max-w-md border"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--border-sub)" }}
        >
          <h4
            className="font-bold text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h4>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}>
            ✕
          </button>
        </div>
        <div className="p-5 space-y-3">
          {rows.map((r, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                placeholder="Name"
                value={r.name}
                onChange={(e) => upd(i, "name", e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              />
              <input
                placeholder="₹ Amount"
                type="number"
                value={r.amount}
                onChange={(e) => upd(i, "amount", e.target.value)}
                className="w-28 px-3 py-2 rounded-lg border text-sm outline-none"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              />
              {rows.length > 1 && (
                <button
                  onClick={() => del(i)}
                  className="text-xs px-2 py-2 rounded-md border"
                  style={{
                    borderColor: "var(--danger-border)",
                    color: "var(--danger-text)",
                    background: "var(--danger-soft)",
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addRow}
            className="text-xs px-3 py-1.5 rounded-lg border w-full"
            style={{
              borderColor: "var(--border)",
              color: "var(--accent-text)",
              background: "var(--accent-soft)",
            }}
          >
            + Add Row
          </button>
          <div
            className="flex items-center justify-between pt-2 border-t"
            style={{ borderColor: "var(--border-sub)" }}
          >
            <span
              className="text-sm font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Total: ₹{fmt(total)}
            </span>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-xs border"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text-sec)",
                  background: "var(--bg-elevated)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => onSave(rows.filter((r) => r.name || r.amount))}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                style={{ background: "var(--accent)" }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── ExpensePopup ────────────────────────────────────────────────────────── */
function ExpensePopup({ expenses, onClose, onSave }) {
  const [cats, setCats] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("expenseCats") || "null") ||
        DEFAULT_EXPENSE_CATS
      );
    } catch {
      return DEFAULT_EXPENSE_CATS;
    }
  });
  const [vals, setVals] = useState(() => normalizeExpenses(expenses));
  const [newCat, setNewCat] = useState("");

  const addCat = () => {
    const c = newCat.trim();
    if (!c || cats.includes(c)) return;
    const updated = [...cats, c];
    setCats(updated);
    localStorage.setItem("expenseCats", JSON.stringify(updated));
    setNewCat("");
  };
  const delCat = (c) => {
    const updated = cats.filter((x) => x !== c);
    setCats(updated);
    localStorage.setItem("expenseCats", JSON.stringify(updated));
    setVals((p) => {
      const n = { ...p };
      delete n[c];
      return n;
    });
  };
  const total = sumExpenses(vals);

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col border"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{ borderColor: "var(--border-sub)" }}
        >
          <h4
            className="font-bold text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            Cash Expenses Breakdown
          </h4>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}>
            ✕
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">
          <div className="grid grid-cols-2 gap-3">
            {cats.map((c) => (
              <div key={c} className="flex items-center gap-1.5">
                <div className="flex-1 min-w-0">
                  <label
                    className="block text-xs mb-1 truncate"
                    style={{ color: "var(--text-sec)" }}
                  >
                    {c}
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={vals[c] || ""}
                    onChange={(e) =>
                      setVals((p) => ({ ...p, [c]: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 rounded-lg border text-sm outline-none"
                    style={{
                      background: "var(--bg-elevated)",
                      borderColor: "var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
                <button
                  onClick={() => delCat(c)}
                  className="text-xs mt-5 px-1.5 py-1.5 rounded border shrink-0"
                  style={{
                    borderColor: "var(--danger-border)",
                    color: "var(--danger-text)",
                    background: "var(--danger-soft)",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div
            className="flex gap-2 mt-4 pt-4 border-t"
            style={{ borderColor: "var(--border-sub)" }}
          >
            <input
              placeholder="New category name…"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCat()}
              className="flex-1 px-3 py-1.5 rounded-lg border text-sm outline-none"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
            <button
              onClick={addCat}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              + Add
            </button>
          </div>
        </div>
        <div
          className="px-5 py-4 border-t shrink-0 flex items-center justify-between"
          style={{ borderColor: "var(--border-sub)" }}
        >
          <span
            className="text-sm font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Total: ₹{fmt(total)}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs border"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-sec)",
                background: "var(--bg-elevated)",
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(vals, total)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
              style={{ background: "var(--accent)" }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── DetailModal ─────────────────────────────────────────────────────────── */
function DetailModal({ entry, onClose }) {
  if (!entry) return null;
  const personalEntries = entry.personalCrEntries || [];
  const coffeeEntries = entry.coffeeShopEntries || [];
  const expenses = normalizeExpenses(entry.expenseEntries);
  const expenseItems = Object.entries(expenses).filter(([, v]) => v > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow)",
        }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--border-sub)" }}
        >
          <div>
            <h3
              className="font-bold text-base"
              style={{ color: "var(--text-primary)" }}
            >
              Entry Details
            </h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {fmtDate(entry.date)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-lg leading-none"
            style={{ color: "var(--text-muted)" }}
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Opening Cash
              </p>
              <p className="font-semibold">₹{fmt(entry.openingCash)}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Cash to Office
              </p>
              <p className="font-semibold">₹{fmt(entry.cashToOffice)}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Total Cash
              </p>
              <p className="font-semibold">₹{fmt(entry.totalCash)}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Closing Cash
              </p>
              <p className="font-semibold">₹{fmt(entry.closingCash)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Sales Breakdown
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Kitchen Sale</span>
                  <span>₹{fmt(entry.kitchenSale)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Official Cr.</span>
                  <span>₹{fmt(entry.officialCr)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Personal Cr.</span>
                  <span>
                    ₹
                    {fmt(entry.personalCr ?? sumPersonEntries(personalEntries))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Coffee Shop</span>
                  <span>₹{fmt(entry.coffeeShop ?? entry.coffeeShopSale)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Café Sale</span>
                  <span>₹{fmt(entry.cafeSale)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Café Night</span>
                  <span>₹{fmt(entry.cafeNight)}</span>
                </div>
                <div className="flex justify-between">
                  <span>UPI Received</span>
                  <span>₹{fmt(entry.upiReceived)}</span>
                </div>
              </div>
            </div>
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Expense Breakdown
              </p>
              {expenseItems.length > 0 ? (
                <div className="mt-3 space-y-2 text-sm">
                  {expenseItems.map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span>{key}</span>
                      <span>₹{fmt(value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  className="mt-3 text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  No expenses recorded.
                </p>
              )}
            </div>
          </div>

          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Personal Credit Entries
            </p>
            {personalEntries.length > 0 ? (
              <div className="mt-3 grid gap-2 text-sm">
                {personalEntries.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.name}</span>
                    <span>₹{fmt(item.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p
                className="mt-3 text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                No personal credit entries.
              </p>
            )}
          </div>

          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Coffee Shop Entries
            </p>
            {coffeeEntries.length > 0 ? (
              <div className="mt-3 grid gap-2 text-sm">
                {coffeeEntries.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.name}</span>
                    <span>₹{fmt(item.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p
                className="mt-3 text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                No coffee shop entries.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── EntryModal ──────────────────────────────────────────────────────────── */
function EntryModal({
  entry,
  lastClosingCash,
  existingDates,
  onSave,
  onClose,
}) {
  const initForm = (e) => {
    if (e)
      return {
        date: e.date?.split("T")[0] ?? e.date,
        openingCash: e.openingCash ?? 0,
        kitchenSale: e.kitchenSale ?? 0,
        officialCr: e.officialCr ?? 0,
        personalCrEntries: e.personalCrEntries || [],
        coffeeShopEntries: e.coffeeShopEntries || [],
        cafeSale: e.cafeSale ?? 0,
        cafeNight: e.cafeNight ?? 0,
        upiReceived: e.upiReceived ?? 0,
        cashToOffice: e.cashToOffice ?? 0,
        expenseEntries: normalizeExpenses(e.expenseEntries),
      };
    return {
      date: todayStr(),
      openingCash: lastClosingCash ?? 0,
      cashToOffice: "",
      kitchenSale: "",
      officialCr: "",
      personalCrEntries: [],
      coffeeShopEntries: [],
      cafeSale: "",
      cafeNight: "",
      upiReceived: "",
      expenseEntries: {},
    };
  };

  const [form, setForm] = useState(() => initForm(entry));
  const [personalPopup, setPersonalPopup] = useState(false);
  const [coffeePopup, setCoffeePopup] = useState(false);
  const [expensePopup, setExpensePopup] = useState(false);
  const [dateError, setDateError] = useState("");

  const personalCrTotal = sumPersonEntries(form.personalCrEntries);
  const coffeeTotal = sumPersonEntries(form.coffeeShopEntries);
  const totalSale =
    (Number(form.kitchenSale) || 0) +
    (Number(form.officialCr) || 0) +
    personalCrTotal +
    coffeeTotal +
    (Number(form.cafeSale) || 0) +
    (Number(form.cafeNight) || 0) +
    (Number(form.upiReceived) || 0);
  const totalCash = (Number(form.openingCash) || 0) + totalSale;
  const cashExpenses = sumExpenses(form.expenseEntries);
  const closingCash =
    totalCash - cashExpenses - (Number(form.cashToOffice) || 0);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleDateChange = (v) => {
    if (!entry && existingDates.includes(v))
      setDateError("Entry already exists for this date.");
    else if (new Date(v) > new Date(todayStr()))
      setDateError("Cannot enter a future date.");
    else setDateError("");
    set("date", v);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (dateError) return;
    // Send expenseEntries as plain object — backend handles Map conversion
    const expObj = {};
    Object.entries(form.expenseEntries).forEach(([k, v]) => {
      if (Number(v) > 0) expObj[k] = Number(v);
    });
    onSave({
      date: form.date,
      openingCash: Number(form.openingCash) || 0,
      kitchenSale: Number(form.kitchenSale) || 0,
      officialCr: Number(form.officialCr) || 0,
      personalCrEntries: form.personalCrEntries,
      personalCr: personalCrTotal,
      coffeeShopEntries: form.coffeeShopEntries,
      coffeeShop: coffeeTotal,
      coffeeShopSale: coffeeTotal,
      cafeSale: Number(form.cafeSale) || 0,
      cafeNight: Number(form.cafeNight) || 0,
      upiReceived: Number(form.upiReceived) || 0,
      cashToOffice: Number(form.cashToOffice) || 0,
      totalSale,
      totalCash,
      expenseEntries: expObj,
      cashExpenses,
      closingCash,
    });
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border text-sm outline-none";
  const inputStyle = {
    background: "var(--bg-elevated)",
    borderColor: "var(--border)",
    color: "var(--text-primary)",
  };
  const labelStyle = { color: "var(--text-sec)" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto border"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border-sub)",
          }}
        >
          <h3
            className="font-bold text-base"
            style={{ color: "var(--text-primary)" }}
          >
            {entry ? "Edit Entry" : "New Entry"}
          </h3>
          <button
            onClick={onClose}
            className="text-lg leading-none"
            style={{ color: "var(--text-muted)" }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date + Opening Cash */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label
                className="block text-xs font-semibold mb-1.5"
                style={labelStyle}
              >
                Date
              </label>
              <input
                type="date"
                value={form.date}
                max={todayStr()}
                onChange={(e) => handleDateChange(e.target.value)}
                required
                className={inputCls}
                style={{
                  ...inputStyle,
                  borderColor: dateError
                    ? "var(--danger-text)"
                    : "var(--border)",
                }}
              />
              {dateError && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--danger-text)" }}
                >
                  {dateError}
                </p>
              )}
            </div>
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={labelStyle}
              >
                Opening Cash
              </label>
              <input
                type="number"
                value={form.openingCash}
                onChange={(e) => set("openingCash", e.target.value)}
                className={inputCls}
                style={inputStyle}
              />
              {lastClosingCash !== null && !entry && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Auto: last closing ₹{fmt(lastClosingCash)}
                </p>
              )}
            </div>
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={labelStyle}
              >
                Cash to Office
              </label>
              <input
                type="number"
                placeholder="0"
                value={form.cashToOffice}
                onChange={(e) => set("cashToOffice", e.target.value)}
                className={inputCls}
                style={inputStyle}
              />
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                Amount remitted to office; excluded from closing/opening cash.
              </p>
            </div>
          </div>

          {/* Sales */}
          <div>
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: "var(--text-muted)" }}
            >
              Sales
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={labelStyle}
                >
                  Kitchen Sale
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.kitchenSale}
                  onChange={(e) => set("kitchenSale", e.target.value)}
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={labelStyle}
                >
                  Official Cr.
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.officialCr}
                  onChange={(e) => set("officialCr", e.target.value)}
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              {/* Personal Cr popup */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={labelStyle}
                >
                  Personal Cr.
                </label>
                <button
                  type="button"
                  onClick={() => setPersonalPopup(true)}
                  className="w-full px-3 py-2 rounded-lg border text-sm text-left flex items-center justify-between"
                  style={{ ...inputStyle, borderColor: "var(--border)" }}
                >
                  <span
                    style={{
                      color:
                        personalCrTotal > 0
                          ? "var(--text-primary)"
                          : "var(--text-muted)",
                    }}
                  >
                    {personalCrTotal > 0
                      ? `₹${fmt(personalCrTotal)} (${form.personalCrEntries.length} entries)`
                      : "Enter by person…"}
                  </span>
                  <span style={{ color: "var(--accent-text)" }}>✎</span>
                </button>
              </div>
              {/* Coffee Shop popup */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={labelStyle}
                >
                  Coffee Shop
                </label>
                <button
                  type="button"
                  onClick={() => setCoffeePopup(true)}
                  className="w-full px-3 py-2 rounded-lg border text-sm text-left flex items-center justify-between"
                  style={{ ...inputStyle, borderColor: "var(--border)" }}
                >
                  <span
                    style={{
                      color:
                        coffeeTotal > 0
                          ? "var(--text-primary)"
                          : "var(--text-muted)",
                    }}
                  >
                    {coffeeTotal > 0
                      ? `₹${fmt(coffeeTotal)} (${form.coffeeShopEntries.length} entries)`
                      : "Enter by person…"}
                  </span>
                  <span style={{ color: "var(--accent-text)" }}>✎</span>
                </button>
              </div>
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={labelStyle}
                >
                  Café Sale
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.cafeSale}
                  onChange={(e) => set("cafeSale", e.target.value)}
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={labelStyle}
                >
                  Café Night
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.cafeNight}
                  onChange={(e) => set("cafeNight", e.target.value)}
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={labelStyle}
                >
                  UPI Received
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.upiReceived}
                  onChange={(e) => set("upiReceived", e.target.value)}
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Auto-calc preview */}
          <div
            className="grid grid-cols-3 gap-3 rounded-xl p-4"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-sub)",
            }}
          >
            {[
              { label: "Total Sale", value: totalSale, accent: true },
              { label: "Total Cash", value: totalCash },
              {
                label: "Closing Cash",
                value: closingCash,
                accent: closingCash >= 0,
                danger: closingCash < 0,
              },
            ].map((c) => (
              <div key={c.label} className="text-center">
                <p
                  className="text-xs mb-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  {c.label}
                </p>
                <p
                  className="text-base font-bold tabular-nums"
                  style={{
                    color: c.danger
                      ? "var(--danger-text)"
                      : c.accent
                        ? "var(--accent-text)"
                        : "var(--text-primary)",
                  }}
                >
                  ₹{fmt(c.value)}
                </p>
              </div>
            ))}
          </div>

          {/* Expenses */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                Cash Expenses
              </p>
              {cashExpenses > 0 && (
                <span
                  className="text-xs font-semibold"
                  style={{ color: "var(--danger-text)" }}
                >
                  Total: ₹{fmt(cashExpenses)}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setExpensePopup(true)}
              className="w-full px-4 py-3 rounded-xl border text-sm flex items-center justify-between"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
                color:
                  cashExpenses > 0
                    ? "var(--text-primary)"
                    : "var(--text-muted)",
              }}
            >
              <span>
                {cashExpenses > 0
                  ? `₹${fmt(cashExpenses)} across ${Object.entries(form.expenseEntries).filter(([, v]) => Number(v) > 0).length} categories`
                  : "Click to enter expense breakdown…"}
              </span>
              <span style={{ color: "var(--accent-text)" }}>✎ Edit</span>
            </button>
            {cashExpenses > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {Object.entries(form.expenseEntries)
                  .filter(([, v]) => Number(v) > 0)
                  .map(([k, v]) => (
                    <span
                      key={k}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: "var(--bg-elevated)",
                        color: "var(--text-sec)",
                        border: "1px solid var(--border-sub)",
                      }}
                    >
                      {k}: ₹{fmt(Number(v))}
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div
            className="flex justify-end gap-2 pt-2 border-t"
            style={{ borderColor: "var(--border-sub)" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm border font-medium"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-sec)",
                background: "var(--bg-elevated)",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!!dateError}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              {entry ? "Save Changes" : "Add Entry"}
            </button>
          </div>
        </form>
      </div>

      {personalPopup && (
        <PersonEntryPopup
          title="Personal Credit Entries"
          entries={form.personalCrEntries}
          onClose={() => setPersonalPopup(false)}
          onSave={(rows) => {
            set("personalCrEntries", rows);
            setPersonalPopup(false);
          }}
        />
      )}
      {coffeePopup && (
        <PersonEntryPopup
          title="Coffee Shop Entries"
          entries={form.coffeeShopEntries}
          onClose={() => setCoffeePopup(false)}
          onSave={(rows) => {
            set("coffeeShopEntries", rows);
            setCoffeePopup(false);
          }}
        />
      )}
      {expensePopup && (
        <ExpensePopup
          expenses={form.expenseEntries}
          onClose={() => setExpensePopup(false)}
          onSave={(vals) => {
            set("expenseEntries", vals);
            setExpensePopup(false);
          }}
        />
      )}
    </div>
  );
}

/* ─── BreakdownModal ──────────────────────────────────────────────────────────── */
function BreakdownModal({ title, items, onClose }) {
  const total = items.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0,
  );

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.55)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl border"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b-2"
          style={{ borderColor: "var(--border)" }}
        >
          <h3 className="font-bold">{title}</h3>

          <button onClick={onClose}>✕</button>
        </div>

        <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex justify-between rounded-lg px-3 py-2"
              style={{ background: "var(--bg-elevated)" }}
            >
              <span>{item.name}</span>
              <span className="font-semibold">₹{fmt(item.amount)}</span>
            </div>
          ))}
        </div>

        <div
          className="flex justify-between px-5 py-4 border-t font-bold"
          style={{ borderColor: "var(--border-sub)" }}
        >
          <span>Total</span>
          <span>₹{fmt(total)}</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const today = new Date();
  const currentMonthKey = toMonthKey(today.getFullYear(), today.getMonth() + 1);
  const TAB_MONTHS = lastNMonths(currentMonthKey, 6);
  const OVERVIEW_YEARS = yearsFrom(2024, currentMonthKey);

  const [allData, setAllData] = useState({});
  const [loadingMap, setLoadingMap] = useState({});
  const [activeTab, setActiveTab] = useState("overview");
  const [viewMonth, setViewMonth] = useState(currentMonthKey);
  const [overviewYear, setOverviewYear] = useState(today.getFullYear());
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [viewEntry, setViewEntry] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [breakdownModal, setBreakdownModal] = useState(null);
  const PAGE_SIZE = 10;

  /* ── fetch one month ── */
  const fetchMonth = useCallback(async (mk) => {
    // skip if already loaded and not forced
    setLoadingMap((p) => ({ ...p, [mk]: true }));
    try {
      const { data } = await API.get("/daybook", { params: { month: mk } });
      setAllData((p) => ({ ...p, [mk]: data.success ? data.data || [] : [] }));
    } catch {
      setAllData((p) => ({ ...p, [mk]: [] }));
    } finally {
      setLoadingMap((p) => ({ ...p, [mk]: false }));
    }
  }, []);

  /* on mount: fetch the 6 tab months in parallel (not ALL months from 2024) */
  useEffect(() => {
    TAB_MONTHS.forEach((mk) => fetchMonth(mk));
  }, []); // eslint-disable-line

  /* when switching viewMonth, fetch if not yet loaded */
  useEffect(() => {
    if (!(viewMonth in allData) && !loadingMap[viewMonth])
      fetchMonth(viewMonth);
  }, [viewMonth]); // eslint-disable-line

  /* when overviewYear changes, fetch all months for that year that aren't loaded */
  useEffect(() => {
    monthsForYear(overviewYear, currentMonthKey).forEach((mk) => {
      if (!(mk in allData) && !loadingMap[mk]) fetchMonth(mk);
    });
  }, [overviewYear]); // eslint-disable-line

  /* ── derived ── */
  const entries = allData[viewMonth] || [];
  const overviewMks = monthsForYear(overviewYear, currentMonthKey);

  const existingDates = entries.map((e) => (e.date || "").split("T")[0]);
  const lastClosingCash = (() => {
    if (editEntry) return null;
    const s = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
    return s.length > 0 ? (s[0].closingCash ?? null) : null;
  })();

  const withDeficit = entries.map((e) => ({
    ...e,
    coffeeShop: e.coffeeShop ?? e.coffeeShopSale ?? 0,
    expenseEntries: normalizeExpenses(e.expenseEntries),
    deficit: (e.totalCash || 0) - (e.cashExpenses || 0),
  }));

  const filtered = withDeficit.filter((e) =>
    fmtDate(e.date).toLowerCase().includes(search.toLowerCase()),
  );
  const sorted2 = [...filtered].sort((a, b) => {
    const av = a[sortKey],
      bv = b[sortKey];
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });
  const totalPages = Math.ceil(sorted2.length / PAGE_SIZE);
  const pageData = sorted2.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totals = entries.reduce(
    (a, e) => ({
      kitchenSale: a.kitchenSale + (e.kitchenSale || 0),
      officialCr: a.officialCr + (e.officialCr || 0),
      personalCr: a.personalCr + (e.personalCr || 0),
      coffeeShop: a.coffeeShop + (e.coffeeShop ?? e.coffeeShopSale ?? 0),
      cafeSale: a.cafeSale + (e.cafeSale || 0),
      cafeNight: a.cafeNight + (e.cafeNight || 0),
      upiReceived: a.upiReceived + (e.upiReceived || 0),
      totalSale: a.totalSale + (e.totalSale || 0),
      totalCash: a.totalCash + (e.totalCash || 0),
      cashToOffice: a.cashToOffice + (e.cashToOffice || 0),
      cashExpenses: a.cashExpenses + (e.cashExpenses || 0),
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
      cashToOffice: 0,
      cashExpenses: 0,
    },
  );
  const monthDeficit =
    totals.totalCash - totals.cashExpenses - totals.cashToOffice;

  /* ── handlers ── */
  const handleSort = (k) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("asc");
    }
    setPage(1);
  };

  const goToMonth = (mk) => {
    setViewMonth(mk);
    setActiveTab(mk);
    setPage(1);
    setSearch("");
  };

  const handleSave = async (formData) => {
    try {
      const isEdit = !!editEntry?._id;
      const { data } = isEdit
        ? await API.put(`/daybook/${editEntry._id}`, formData)
        : await API.post("/daybook", formData);
      if (!data.success) {
        console.error("Save error:", data.message);
        return;
      }
      const mk = data.data.date.slice(0, 7);
      setAllData((p) => {
        const list = p[mk] || [];
        return {
          ...p,
          [mk]: isEdit
            ? list.map((e) => (e._id === editEntry._id ? data.data : e))
            : [...list, data.data].sort(
                (a, b) => new Date(a.date) - new Date(b.date),
              ),
        };
      });
    } catch (err) {
      const msg = err?.response?.data?.message || err.message;
      alert("Save failed: " + msg);
    }
    setShowModal(false);
    setEditEntry(null);
  };

  const handleDelete = async (entry) => {
    if (!confirm(`Delete entry for ${fmtDate(entry.date)}?`)) return;
    try {
      await API.delete(`/daybook/${entry._id}`);
    } catch {}
    const mk = entry.date.slice(0, 7);
    setAllData((p) => ({
      ...p,
      [mk]: (p[mk] || []).filter((e) => e._id !== entry._id),
    }));
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();
  const isDetailLoading = !!loadingMap[viewMonth];

  /* ════════════════════════ RENDER ════════════════════════ */
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      {/* Topbar */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b"
        style={{
          background: "var(--topbar-bg)",
          borderColor: "var(--topbar-border)",
          boxShadow: "var(--shadow)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm"
            style={{ background: "var(--accent)" }}
          >
            D
          </div>
          <div>
            <p
              className="text-sm font-bold leading-none"
              style={{ color: "var(--text-primary)" }}
            >
              Day Book
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Anand Trauma Centre
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="hidden sm:block text-sm"
            style={{ color: "var(--text-sec)" }}
          >
            {user?.name}
          </span>
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center border transition-colors"
            style={{
              borderColor: "var(--border)",
              background: "var(--bg-elevated)",
              color: "var(--text-sec)",
            }}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <button
            onClick={logout}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border"
            style={{
              borderColor: "var(--danger-border)",
              background: "var(--danger-soft)",
              color: "var(--danger-text)",
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Tab bar */}
        <div
          className="flex items-center gap-0 border-b overflow-x-auto"
          style={{ borderColor: "var(--border)" }}
        >
          <button
            onClick={() => setActiveTab("overview")}
            className="px-4 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap"
            style={{
              color:
                activeTab === "overview"
                  ? "var(--accent-text)"
                  : "var(--text-muted)",
              borderBottom:
                activeTab === "overview"
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
            }}
          >
            📅 Overview
          </button>
          <div
            className="w-px h-5 mx-1 self-center"
            style={{ background: "var(--border)" }}
          />
          <span
            className="flex items-center gap-1.5 px-2 text-xs select-none"
            style={{ color: "var(--text-muted)" }}
          >
            Recent →
          </span>
          {TAB_MONTHS.map((mk) => (
            <MonthTab
              key={mk}
              mk={mk}
              active={activeTab === mk}
              hasData={(allData[mk] || []).length > 0}
              onClick={() => goToMonth(mk)}
            />
          ))}
        </div>

        {/* ══ OVERVIEW ══ */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2
                className="font-bold text-base"
                style={{ color: "var(--text-primary)" }}
              >
                Monthly Summary
              </h2>
              <div className="flex items-center gap-2">
                <select
                  value={overviewYear}
                  onChange={(e) => setOverviewYear(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border outline-none"
                  style={{
                    background: "var(--bg-elevated)",
                    borderColor: "var(--border)",
                    color: "var(--text-sec)",
                  }}
                >
                  {OVERVIEW_YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setEditEntry(null);
                    setShowModal(true);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  + Add Entry
                </button>
              </div>
            </div>
            <div
              className="rounded-2xl border overflow-hidden"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border)",
                boxShadow: "var(--shadow)",
              }}
            >
              <div className="overflow-x-auto">
                <table
                  className="w-full text-sm border-collapse"
                  style={{ minWidth: "680px" }}
                >
                  <thead>
                    <tr style={{ background: "var(--bg-elevated)" }}>
                      {[
                        "Month",
                        "Total Sale",
                        "Total Cash",
                        "Cash Exp.",
                        "Surplus / Deficit",
                        "Days",
                        "",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b text-left"
                          style={{
                            borderColor: "var(--border-sub)",
                            color: "var(--text-muted)",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {overviewMks.map((mk) => (
                      <MonthRow
                        key={mk}
                        mk={mk}
                        data={allData[mk]}
                        loading={loadingMap[mk] === true && !(mk in allData)}
                        onClick={() => goToMonth(mk)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ MONTH DETAIL ══ */}
        {activeTab !== "overview" && (
          <div className="space-y-5">
            {/* Navigator */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const pm = prevMonth(viewMonth);
                    setViewMonth(pm);
                    setActiveTab(pm);
                    setPage(1);
                    setSearch("");
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border text-sm font-bold"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--bg-elevated)",
                    color: "var(--text-sec)",
                  }}
                >
                  ‹
                </button>
                <h2
                  className="text-lg font-bold px-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {displayMonth(viewMonth)}
                </h2>
                <button
                  onClick={() => {
                    if (!isAfterToday(nextMonth(viewMonth))) {
                      const nm = nextMonth(viewMonth);
                      setViewMonth(nm);
                      setActiveTab(nm);
                      setPage(1);
                      setSearch("");
                    }
                  }}
                  disabled={isAfterToday(nextMonth(viewMonth))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border text-sm font-bold disabled:opacity-30"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--bg-elevated)",
                    color: "var(--text-sec)",
                  }}
                >
                  ›
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("overview")}
                  className="px-3 py-1.5 rounded-lg text-xs border font-medium"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text-sec)",
                    background: "var(--bg-elevated)",
                  }}
                >
                  ← Overview
                </button>
                <button
                  onClick={() => fetchMonth(viewMonth)}
                  className="px-3 py-1.5 rounded-lg text-xs border font-medium"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text-sec)",
                    background: "var(--bg-elevated)",
                  }}
                >
                  ↻ Refresh
                </button>
                <button
                  onClick={() => {
                    setEditEntry(null);
                    setShowModal(true);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  + Add Entry
                </button>
              </div>
            </div>

            {/* Stat cards */}
            {isDetailLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl px-5 py-4 border animate-pulse"
                    style={{
                      background: "var(--bg-surface)",
                      borderColor: "var(--border)",
                      height: "84px",
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard
                  label="Total Sales"
                  value={totals.totalSale}
                  sub="All channels"
                  accent
                />
                <StatCard
                  label="Kitchen"
                  value={totals.kitchenSale}
                  sub={`${entries.length} days`}
                />
                <StatCard
                  label="Coffee Shop"
                  value={totals.coffeeShopSale}
                  sub="C/Shop revenue"
                />
                <StatCard
                  label="Surplus / Deficit"
                  value={monthDeficit}
                  sub="Total Cash − Cash Exp."
                  accent={monthDeficit >= 0}
                  danger={monthDeficit < 0}
                />
              </div>
            )}

            {/* Table */}
            <div
              className="rounded-2xl border overflow-hidden"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border)",
                boxShadow: "var(--shadow)",
              }}
            >
              <div
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b"
                style={{ borderColor: "var(--border-sub)" }}
              >
                <div>
                  <h3
                    className="font-bold text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Daily Ledger — {displayMonth(viewMonth)}
                  </h3>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {isDetailLoading
                      ? "Loading…"
                      : `${filtered.length} entries · click headers to sort`}
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="Search date…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="text-sm px-3 py-1.5 rounded-lg border outline-none w-full sm:w-40"
                  style={{
                    background: "var(--bg-elevated)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div className="overflow-x-auto">
                <table
                  className="w-full text-sm border-collapse"
                  style={{ minWidth: "1300px" }}
                >
                  <thead>
                    <tr style={{ background: "var(--bg-elevated)" }}>
                      {COLUMNS.map((col) => (
                        <th
                          key={col.key}
                          onClick={() => handleSort(col.key)}
                          className={`px-3 py-3 font-semibold text-xs uppercase tracking-wider cursor-pointer select-none border-b hover:opacity-80 ${col.align === "right" ? "text-right" : "text-left"}`}
                          style={{
                            borderColor: "var(--border-sub)",
                            color: "var(--text-muted)",
                          }}
                        >
                          {col.label}
                          {sortKey === col.key && (
                            <span className="ml-1 opacity-60">
                              {sortDir === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </th>
                      ))}
                      <th
                        className="px-3 py-3 text-right text-xs uppercase tracking-wider font-semibold border-b"
                        style={{
                          borderColor: "var(--border-sub)",
                          color: "var(--text-muted)",
                        }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isDetailLoading &&
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr
                          key={i}
                          className="border-b animate-pulse"
                          style={{ borderColor: "var(--border-sub)" }}
                        >
                          {Array.from({ length: COLUMNS.length + 1 }).map(
                            (_, j) => (
                              <td key={j} className="px-3 py-3">
                                <span
                                  className="inline-block w-full h-3 rounded"
                                  style={{ background: "var(--border)" }}
                                />
                              </td>
                            ),
                          )}
                        </tr>
                      ))}
                    {!isDetailLoading && pageData.length === 0 && (
                      <tr>
                        <td
                          colSpan={COLUMNS.length + 1}
                          className="text-center py-16"
                          style={{ color: "var(--text-muted)" }}
                        >
                          No entries for {displayMonth(viewMonth)}.
                        </td>
                      </tr>
                    )}
                    {!isDetailLoading &&
                      pageData.map((row, idx) => {
                        const negClose = row.closingCash < 0,
                          negDef = row.deficit < 0;
                        const highExp = row.cashExpenses > row.totalSale * 1.5;
                        return (
                          <tr
                            key={row._id || row.date}
                            className="border-b transition-colors"
                            style={{
                              borderColor: "var(--border-sub)",
                              background:
                                idx % 2 === 0
                                  ? "transparent"
                                  : "var(--bg-elevated)",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background =
                                "var(--bg-hover)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background =
                                idx % 2 === 0
                                  ? "transparent"
                                  : "var(--bg-elevated)")
                            }
                          >
                            <td
                              className="px-3 py-3 font-medium whitespace-nowrap"
                              style={{ color: "var(--accent-text)" }}
                            >
                              {fmtDate(row.date)}
                            </td>
                            <td
                              className="px-3 py-3 text-right tabular-nums"
                              style={{
                                color:
                                  row.openingCash < 0
                                    ? "var(--danger-text)"
                                    : "var(--text-primary)",
                              }}
                            >
                              {fmt(row.openingCash)}
                            </td>
                            <td
                              className="px-3 py-3 text-right tabular-nums"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {fmt(row.kitchenSale)}
                            </td>
                            <td
                              className="px-3 py-3 text-right tabular-nums"
                              style={{ color: "var(--text-sec)" }}
                            >
                              {fmt(row.officialCr)}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums">
                              {(row.personalCrEntries || []).length > 0 ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setBreakdownModal({
                                      title: "Personal Credit Breakdown",
                                      items: row.personalCrEntries,
                                    })
                                  }
                                  className="group transition-all duration-200"
                                  style={{
                                    color: "var(--text-primary)",
                                    background: "transparent",
                                    border: "none",
                                    padding: 0,
                                    cursor: "pointer",
                                  }}
                                >
                                  <span className="tabular-nums font-medium border-b border-dotted border-transparent group-hover:border-current">
                                    {fmt(
                                      row.personalCr ??
                                        sumPersonEntries(row.personalCrEntries),
                                    )}
                                  </span>
                                </button>
                              ) : (
                                <span style={{ color: "var(--text-muted)" }}>
                                  —
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums">
                              {(row.coffeeShopEntries || []).length > 0 ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setBreakdownModal({
                                      title: "Coffee Shop Breakdown",
                                      items: row.coffeeShopEntries,
                                    })
                                  }
                                  className="group transition-all duration-200"
                                  style={{
                                    color: "var(--text-primary)",
                                    background: "transparent",
                                    border: "none",
                                    padding: 0,
                                    cursor: "pointer",
                                  }}
                                >
                                  <span className="tabular-nums font-medium border-b border-dotted border-transparent group-hover:border-current">
                                    {fmt(row.coffeeShop)}
                                  </span>
                                </button>
                              ) : (
                                <span style={{ color: "var(--text-primary)" }}>
                                  {fmt(row.coffeeShop)}
                                </span>
                              )}
                            </td>
                            <td
                              className="px-3 py-3 text-right tabular-nums"
                              style={{ color: "var(--text-sec)" }}
                            >
                              {fmt(row.cafeSale)}
                            </td>
                            <td
                              className="px-3 py-3 text-right tabular-nums"
                              style={{ color: "var(--text-sec)" }}
                            >
                              {fmt(row.cafeNight)}
                            </td>
                            <td
                              className="px-3 py-3 text-right tabular-nums"
                              style={{ color: "var(--text-sec)" }}
                            >
                              {fmt(row.upiReceived)}
                            </td>
                            <td
                              className="px-3 py-3 text-right tabular-nums font-semibold"
                              style={{ color: "var(--accent-text)" }}
                            >
                              {fmt(row.totalSale)}
                            </td>
                            <td
                              className="px-3 py-3 text-right tabular-nums"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {fmt(row.totalCash)}
                            </td>
                            <td
                              className="px-3 py-3 text-right tabular-nums"
                              style={{ color: "var(--text-sec)" }}
                            >
                              {fmt(row.cashToOffice)}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums">
                              {Object.keys(row.expenseEntries || {}).length > 0 ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setBreakdownModal({
                                      title: "Cash Expenses Breakdown",
                                      items: Object.entries(
                                        normalizeExpenses(row.expenseEntries || {}),
                                      ).map(([name, amount]) => ({ name, amount })),
                                    })
                                  }
                                  className="group transition-all duration-200"
                                  style={{
                                    color: highExp
                                      ? "var(--danger-text)"
                                      : "var(--text-primary)",
                                    background: "transparent",
                                    border: "none",
                                    padding: 0,
                                    cursor: "pointer",
                                  }}
                                >
                                  <span className="border-b border-dotted font-bold border-transparent group-hover:border-current">
                                    {fmt(row.cashExpenses)}
                                  </span>
                                </button>
                              ) : highExp ? (
                                <Badge variant="negative">
                                  ₹{fmt(row.cashExpenses)}
                                </Badge>
                              ) : (
                                <span style={{ color: "var(--danger-text)" }}>
                                  {fmt(row.cashExpenses)}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums font-semibold">
                              <Badge variant={negDef ? "negative" : "positive"}>
                                ₹{fmt(row.deficit)}
                              </Badge>
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums font-bold">
                              <Badge
                                variant={negClose ? "negative" : "positive"}
                              >
                                ₹{fmt(row.closingCash)}
                              </Badge>
                            </td>
                            <td className="px-3 py-3 text-right whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setViewEntry(row);
                                  setShowViewModal(true);
                                }}
                                className="text-xs px-2 py-1 rounded-md border mr-1"
                                style={{
                                  borderColor: "var(--border)",
                                  color: "var(--text-primary)",
                                  background: "var(--bg-elevated)",
                                }}
                              >
                                View
                              </button>
                              <button
                                onClick={() => {
                                  setEditEntry(row);
                                  setShowModal(true);
                                }}
                                className="text-xs px-2 py-1 rounded-md border mr-1"
                                style={{
                                  borderColor: "var(--accent-border)",
                                  color: "var(--accent-text)",
                                  background: "var(--accent-soft)",
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(row)}
                                className="text-xs px-2 py-1 rounded-md border"
                                style={{
                                  borderColor: "var(--danger-border)",
                                  color: "var(--danger-text)",
                                  background: "var(--danger-soft)",
                                }}
                              >
                                Del
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                  <tfoot>
                    <tr
                      className="border-t-2 font-bold text-sm"
                      style={{
                        borderColor: "rgba(0,0,0,0.15)",
                        background: "var(--bg-elevated)",
                      }}
                    >
                      <td
                        className="px-3 py-3"
                        style={{ color: "var(--text-muted)" }}
                      >
                        TOTAL
                      </td>
                      <td
                        className="px-3 py-3 text-right"
                        style={{ color: "var(--text-muted)" }}
                      >
                        —
                      </td>
                      <td
                        className="px-3 py-3 text-right tabular-nums"
                        style={{ color: "var(--accent-text)" }}
                      >
                        {fmt(totals.kitchenSale)}
                      </td>
                      <td className="px-3 py-3" />
                      <td className="px-3 py-3" />
                      <td
                        className="px-3 py-3 text-right tabular-nums"
                        style={{ color: "var(--accent-text)" }}
                      >
                        {fmt(totals.coffeeShopSale)}
                      </td>
                      <td className="px-3 py-3" />
                      <td className="px-3 py-3" />
                      <td className="px-3 py-3" />
                      <td
                        className="px-3 py-3 text-right tabular-nums"
                        style={{ color: "var(--accent-text)" }}
                      >
                        {fmt(totals.totalSale)}
                      </td>
                      <td
                        className="px-3 py-3 text-right tabular-nums"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {fmt(totals.totalCash)}
                      </td>
                      <td
                        className="px-3 py-3 text-right tabular-nums"
                        style={{ color: "var(--text-sec)" }}
                      >
                        {fmt(totals.cashToOffice)}
                      </td>
                      <td
                        className="px-3 py-3 text-right tabular-nums"
                        style={{ color: "var(--danger-text)" }}
                      >
                        {fmt(totals.cashExpenses)}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums font-bold">
                        <Badge
                          variant={monthDeficit >= 0 ? "positive" : "negative"}
                        >
                          ₹{fmt(monthDeficit)}
                        </Badge>
                      </td>
                      <td className="px-3 py-3" />
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>

              {totalPages > 1 && (
                <div
                  className="flex items-center justify-between px-5 py-3 border-t"
                  style={{ borderColor: "var(--border-sub)" }}
                >
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className="w-7 h-7 rounded text-xs font-semibold"
                          style={{
                            background:
                              p === page
                                ? "var(--accent)"
                                : "var(--bg-elevated)",
                            color: p === page ? "#fff" : "var(--text-sec)",
                            border: `1px solid ${p === page ? "var(--accent)" : "var(--border)"}`,
                          }}
                        >
                          {p}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {showModal && (
        <EntryModal
          entry={editEntry}
          lastClosingCash={lastClosingCash}
          existingDates={existingDates}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditEntry(null);
          }}
        />
      )}
      {showViewModal && viewEntry && (
        <DetailModal
          entry={viewEntry}
          onClose={() => setShowViewModal(false)}
        />
      )}
      {breakdownModal && (
        <BreakdownModal
          title={breakdownModal.title}
          items={breakdownModal.items}
          onClose={() => setBreakdownModal(null)}
        />
      )}
    </div>
  );
}
