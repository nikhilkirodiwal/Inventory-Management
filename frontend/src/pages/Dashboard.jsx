import { Fragment, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import useMonthlyDaybook from "../hooks/useMonthlyDaybook";
import { Badge, BreakdownModal } from "../components/DaybookUI";
import {
  toMonthKey,
  displayMonth,
  prevMonth,
  nextMonth,
  lastNMonths,
  yearsFrom,
  monthsForYear,
  todayStr,
  isAfterToday,
  DEFAULT_EXPENSE_CATS,
  fmt,
  fmtDate,
  normalizeExpenses,
  sumExpenses,
  sumPersonEntries,
  subTabTotal,
  flattenSubTabs,
  creditStatus,
  creditLeft,
} from "../utils/daybook";

/* ─── COLUMN DEFINITIONS (order per spec) ─────────────────────────────────── */
// date, openingCash, kitchenSale, coffeeShop, totalSale, officialCr, personalCr,
// upiReceived, totalCash, cashToOffice, cashExpenses, cashInHand
const ALL_COLS = [
  { key: "date", label: "Date", align: "left" },
  { key: "openingCash", label: "Op. Cash", align: "right" },
  { key: "kitchenSale", label: "Kitchen", align: "right" },
  { key: "coffeeShop", label: "Coffee Shop", align: "right" },
  { key: "totalSale", label: "Total Sale", align: "right" },
  { key: "officialCr", label: "Off. Cr", align: "right" },
  { key: "personalCr", label: "Per. Cr", align: "right" },
  { key: "upiReceived", label: "UPI Recv.", align: "right" },
  { key: "totalCash", label: "Total Cash", align: "right" },
  { key: "cashToOffice", label: "Cash Office", align: "right" },
  { key: "cashExpenses", label: "Cash Exp.", align: "right" },
  { key: "cashInHand", label: "Cash In Hand", align: "right" },
];

/* ─── Shared UI ───────────────────────────────────────────────────────────── */
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
      cashToOffice: a.cashToOffice + (e.cashToOffice || 0),
    }),
    { totalSale: 0, totalCash: 0, cashExpenses: 0, cashToOffice: 0 },
  );
  const cashInHand = t.totalCash - t.cashExpenses - t.cashToOffice;
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
        <Badge variant={cashInHand >= 0 ? "positive" : "negative"}>
          ₹{fmt(cashInHand)}
        </Badge>
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
function PersonEntryPopup({
  title,
  entries,
  onClose,
  onSave,
  showCredited = false,
}) {
  const [rows, setRows] = useState(
    entries.length > 0
      ? entries.map((r) =>
          showCredited
            ? { ...r, creditedAmount: Number(r.creditedAmount) || 0 }
            : r,
        )
      : [
          showCredited
            ? { name: "", amount: "", creditedAmount: 0 }
            : { name: "", amount: "" },
        ],
  );
  const addRow = () =>
    setRows((p) => [
      ...p,
      showCredited
        ? { name: "", amount: "", creditedAmount: 0 }
        : { name: "", amount: "" },
    ]);
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
          {rows.map((r, i) => {
            const amt = Number(r.amount) || 0;
            const credited = Math.min(Number(r.creditedAmount) || 0, amt);
            const left = Math.max(0, amt - credited);
            return (
              <div
                key={i}
                className="rounded-xl border p-2.5"
                style={{
                  borderColor: "var(--border-sub)",
                  background: showCredited
                    ? "var(--bg-elevated)"
                    : "transparent",
                }}
              >
                <div className="flex gap-2 items-center">
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
                      className="text-xs px-2 py-2 rounded-md border shrink-0"
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
                {showCredited && (
                  <div className="flex items-center gap-2 mt-2 pl-0.5">
                    <label
                      className="text-xs shrink-0"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Credited so far
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={amt || undefined}
                      value={r.creditedAmount}
                      onChange={(e) => upd(i, "creditedAmount", e.target.value)}
                      className="w-24 px-2.5 py-1.5 rounded-lg border text-xs outline-none"
                      style={{
                        background: "var(--bg-surface)",
                        borderColor: "var(--border)",
                        color: "var(--text-primary)",
                      }}
                    />
                    <span
                      className="text-xs font-semibold ml-auto"
                      style={{
                        color: left > 0 ? "#eab308" : "#22c55e",
                      }}
                    >
                      {left > 0 ? `Left: ₹${fmt(left)}` : "Fully credited"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
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

/* ─── SaleSubTabPopup — for kitchen / coffee shop sub-tabs ───────────────── */
/**
 * Shows existing named sub-tabs (e.g. "Café Sale", "Café Night", or any custom name)
 * with amounts, lets user add custom tabs, and gives the total.
 */
function SaleSubTabPopup({ title, subTabs, onClose, onSave }) {
  const [tabs, setTabs] = useState(
    subTabs.length > 0
      ? subTabs
      : [{ name: title, entries: [], directAmount: "" }],
  );
  const [newTabName, setNewTabName] = useState("");
  const [openEntryIdx, setOpenEntryIdx] = useState(null);

  const addTab = () => {
    const n = newTabName.trim();
    if (!n) return;
    setTabs((p) => [...p, { name: n, entries: [], directAmount: "" }]);
    setNewTabName("");
  };
  const delTab = (i) => setTabs((p) => p.filter((_, j) => j !== i));
  const updTabName = (i, v) =>
    setTabs((p) => p.map((t, j) => (j === i ? { ...t, name: v } : t)));
  const updDirect = (i, v) =>
    setTabs((p) =>
      p.map((t, j) => (j === i ? { ...t, directAmount: v, entries: [] } : t)),
    );
  const saveEntries = (i, rows) => {
    setTabs((p) =>
      p.map((t, j) =>
        j === i ? { ...t, entries: rows, directAmount: "" } : t,
      ),
    );
    setOpenEntryIdx(null);
  };

  const grandTotal = tabs.reduce((s, t) => s + subTabTotal(t), 0);

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="rounded-2xl w-full max-w-lg max-h-[88vh] flex flex-col border"
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
            {title} — Sub-Tabs
          </h4>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}>
            ✕
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Add as many tabs as you need — e.g. "Café Sale", "Café Night", or
            any custom name.
          </p>
          {tabs.map((tab, i) => (
            <div
              key={i}
              className="rounded-xl border p-3 space-y-2"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border-sub)",
              }}
            >
              <div className="flex gap-2 items-center">
                <input
                  placeholder="Tab name (e.g. Café Sale)"
                  value={tab.name}
                  onChange={(e) => updTabName(i, e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none font-semibold"
                  style={{
                    background: "var(--bg-surface)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
                <span
                  className="text-xs font-bold px-2"
                  style={{ color: "var(--accent-text)" }}
                >
                  ₹{fmt(subTabTotal(tab))}
                </span>
                {tabs.length > 1 && (
                  <button
                    onClick={() => delTab(i)}
                    className="text-xs px-2 py-1.5 rounded border"
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
              <div className="flex gap-2">
                {tab.entries?.length > 0 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setOpenEntryIdx(i)}
                      className="flex-1 px-3 py-1.5 rounded-lg text-xs border font-medium text-left"
                      style={{
                        borderColor: "var(--accent-border)",
                        color: "var(--accent-text)",
                        background: "var(--accent-soft)",
                      }}
                    >
                      {tab.entries.length} entries ✎
                    </button>
                    <button
                      type="button"
                      onClick={() => updDirect(i, "")}
                      className="px-2 py-1.5 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      ↺ Direct
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      type="number"
                      placeholder="Direct amount"
                      value={tab.directAmount}
                      onChange={(e) => updDirect(i, e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border text-sm outline-none"
                      style={{
                        background: "var(--bg-surface)",
                        borderColor: "var(--border)",
                        color: "var(--text-primary)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setOpenEntryIdx(i)}
                      className="px-3 py-1.5 rounded-lg text-xs border font-medium"
                      style={{
                        borderColor: "var(--accent-border)",
                        color: "var(--accent-text)",
                        background: "var(--accent-soft)",
                      }}
                    >
                      By person ✎
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <input
              placeholder="New tab name…"
              value={newTabName}
              onChange={(e) => setNewTabName(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), addTab())
              }
              className="flex-1 px-3 py-1.5 rounded-lg border text-sm outline-none"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
            <button
              type="button"
              onClick={addTab}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              + Add Tab
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
            Total: ₹{fmt(grandTotal)}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
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
              type="button"
              onClick={() => onSave(tabs.filter((t) => t.name))}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
              style={{ background: "var(--accent)" }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
      {openEntryIdx !== null && (
        <PersonEntryPopup
          title={`${tabs[openEntryIdx]?.name || "Tab"} — Person Entries`}
          entries={tabs[openEntryIdx]?.entries || []}
          onClose={() => setOpenEntryIdx(null)}
          onSave={(rows) => saveEntries(openEntryIdx, rows)}
        />
      )}
    </div>
  );
}

/* ─── ExpensePopup ────────────────────────────────────────────────────────── */
function ExpensePopup({ expenses, onClose, onSave }) {
  const stripLegacy = (list) =>
    list.filter((c) => !/^salary$/i.test(c) && !/^advance$/i.test(c));
  const [cats, setCats] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("expenseCats") || "null");
      return stripLegacy(stored || DEFAULT_EXPENSE_CATS);
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

/* ─── Live clock — shop header ────────────────────────────────────────────── */
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return (
    <div className="text-right">
      <p className="text-sm font-semibold" style={{ color: "var(--text-sec)" }}>
        {dateStr}
      </p>
      <p
        className="text-xs tabular-nums mt-0.5"
        style={{ color: "var(--text-muted)" }}
      >
        {timeStr}
      </p>
    </div>
  );
}

/* ─── Quick-stat tile — Personal Cr / Patient Bill / Stock ───────────────────── */
function QuickStatCard({ label, hint, onClick, comingSoon }) {
  return (
    <button
      type="button"
      onClick={comingSoon ? undefined : onClick}
      className="text-left rounded-2xl border p-5 flex items-center justify-between gap-3 transition-transform hover:-translate-y-0.5"
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow)",
        cursor: comingSoon ? "default" : "pointer",
        opacity: comingSoon ? 0.65 : 1,
      }}
    >
      <div>
        <p
          className="text-sm font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {label}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          {comingSoon ? "Coming soon" : hint}
        </p>
      </div>
      <span
        className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap"
        style={{
          background: comingSoon ? "var(--bg-elevated)" : "var(--accent-soft)",
          color: comingSoon ? "var(--text-muted)" : "var(--accent-text)",
          border: `1px solid ${comingSoon ? "var(--border)" : "var(--accent-border)"}`,
        }}
      >
        {comingSoon ? "Soon" : "View →"}
      </span>
    </button>
  );
}

/* ──── DeleteModal ───────────────────────────────────────────────────────── */
function DeleteModal({ entry, onCancel, onConfirm }) {
  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.55)" }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        className="w-full max-w-sm rounded-2xl border p-5"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow)",
        }}
      >
        <h3
          className="font-bold text-base mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          Delete Entry?
        </h3>
        <p className="text-sm mb-5" style={{ color: "var(--text-sec)" }}>
          This will permanently delete the entry for{" "}
          <b>{fmtDate(entry.date)}</b>. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
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
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "var(--danger-text)" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── DetailModal (View) ──────────────────────────────────────────────────── */
function DetailModal({ entry, onClose }) {
  if (!entry) return null;
  const expenses = normalizeExpenses(entry.expenseEntries);
  const expenseItems = Object.entries(expenses).filter(
    ([, v]) => Number(v) > 0,
  );
  const cashInHand =
    entry.cashInHand ??
    (entry.totalCash || 0) -
      (entry.cashExpenses || 0) -
      (entry.cashToOffice || 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.65)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl border"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow)",
        }}
      >
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border-sub)",
          }}
        >
          <div>
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Day Book Details
            </h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {fmtDate(entry.date)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl border flex items-center justify-center"
            style={{
              borderColor: "var(--border)",
              background: "var(--bg-elevated)",
              color: "var(--text-muted)",
            }}
          >
            ✕
          </button>
        </div>
        <div className="p-6 space-y-6">
          {/* Summary row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Opening Cash" value={entry.openingCash} />
            <StatCard label="Total Sale" value={entry.totalSale} accent />
            <StatCard label="Total Cash" value={entry.totalCash} />
            <StatCard
              label="Cash In Hand"
              value={cashInHand}
              accent={cashInHand >= 0}
              danger={cashInHand < 0}
            />
          </div>

          {/* Kitchen sale sub-tabs */}
          {(entry.kitchenSubTabs || []).length > 0 && (
            <div>
              <h3
                className="font-bold text-base mb-3"
                style={{ color: "var(--text-primary)" }}
              >
                Kitchen Sale Breakdown
              </h3>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {entry.kitchenSubTabs.map((tab, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border p-4"
                    style={{
                      background: "var(--bg-elevated)",
                      borderColor: "var(--border-sub)",
                    }}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4
                        className="font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {tab.name}
                      </h4>
                      <span
                        className="font-bold"
                        style={{ color: "var(--accent-text)" }}
                      >
                        ₹{fmt(subTabTotal(tab))}
                      </span>
                    </div>
                    {tab.entries?.length > 0 ? (
                      <div className="space-y-2">
                        {tab.entries.map((e, j) => (
                          <div
                            key={j}
                            className="flex justify-between text-sm rounded-lg px-3 py-2"
                            style={{ background: "var(--bg-surface)" }}
                          >
                            <span>{e.name}</span>
                            <span className="font-medium">
                              ₹{fmt(e.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Direct amount entry
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coffee shop sub-tabs */}
          {(entry.coffeeSubTabs || []).length > 0 && (
            <div>
              <h3
                className="font-bold text-base mb-3"
                style={{ color: "var(--text-primary)" }}
              >
                Coffee Shop Breakdown
              </h3>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {entry.coffeeSubTabs.map((tab, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border p-4"
                    style={{
                      background: "var(--bg-elevated)",
                      borderColor: "var(--border-sub)",
                    }}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4
                        className="font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {tab.name}
                      </h4>
                      <span
                        className="font-bold"
                        style={{ color: "var(--accent-text)" }}
                      >
                        ₹{fmt(subTabTotal(tab))}
                      </span>
                    </div>
                    {tab.entries?.length > 0 ? (
                      <div className="space-y-2">
                        {tab.entries.map((e, j) => (
                          <div
                            key={j}
                            className="flex justify-between text-sm rounded-lg px-3 py-2"
                            style={{ background: "var(--bg-surface)" }}
                          >
                            <span>{e.name}</span>
                            <span className="font-medium">
                              ₹{fmt(e.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Direct amount entry
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Credit entries */}
          <h3
            className="font-bold text-base mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            Credit Entries
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                label: "Official Credit",
                entries: entry.officialCrEntries || [],
                total: entry.officialCr,
              },
              {
                label: "Personal Credit",
                entries: entry.personalCrEntries || [],
                total: entry.personalCr,
                showCredited: true,
              },
              {
                label: "Cash to Office",
                entries: entry.cashToOfficeEntries || [],
                total: entry.cashToOffice,
              },
              {
                label: "Salary",
                entries: entry.salaryEntries || [],
                total: entry.salary,
              },
              {
                label: "Advance",
                entries: entry.advanceEntries || [],
                total: entry.advance,
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border p-4"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border-sub)",
                }}
              >
                <div className="flex justify-between items-center mb-3">
                  <h4
                    className="font-semibold text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {s.label}
                  </h4>
                  <span
                    className="font-bold text-sm"
                    style={{ color: "var(--accent-text)" }}
                  >
                    ₹{fmt(s.total)}
                  </span>
                </div>
                {s.entries.length > 0 ? (
                  <div className="space-y-1">
                    {s.entries.map((e, j) => {
                      const status = s.showCredited ? creditStatus(e) : null;
                      const left = s.showCredited ? creditLeft(e) : 0;
                      return (
                        <div
                          key={j}
                          className="flex justify-between items-center text-xs rounded-lg px-2 py-1.5"
                          style={{ background: "var(--bg-surface)" }}
                        >
                          <span className="flex items-center gap-1.5">
                            {e.name}
                            {s.showCredited && (
                              <Badge
                                variant={
                                  status === "full"
                                    ? "positive"
                                    : status === "partial"
                                      ? "warning"
                                      : "neutral"
                                }
                              >
                                {status === "full"
                                  ? "Fully credited"
                                  : status === "partial"
                                    ? `₹${fmt(left)} left`
                                    : "Pending"}
                              </Badge>
                            )}
                          </span>
                          <span className="font-medium">₹{fmt(e.amount)}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    No entries
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Expenses */}
          <div
            className="rounded-2xl border p-5"
            style={{
              background: "var(--bg-elevated)",
              borderColor: "var(--border-sub)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="font-bold text-base"
                style={{ color: "var(--text-primary)" }}
              >
                Expense Breakdown
              </h3>
              <span
                className="font-bold"
                style={{ color: "var(--danger-text)" }}
              >
                ₹{fmt(entry.cashExpenses)}
              </span>
            </div>
            {expenseItems.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {expenseItems.map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-xl p-3"
                    style={{ background: "var(--bg-surface)" }}
                  >
                    <p
                      className="text-xs mb-1"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {key}
                    </p>
                    <p
                      className="font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      ₹{fmt(value)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No expenses recorded.
              </p>
            )}
          </div>

          {/* Formulas */}
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                label: "Total Sale",
                formula: "Kitchen Sale + Coffee Shop (incl. all sub-tabs)",
              },
              {
                label: "Total Cash",
                formula:
                  "Opening Cash + Total Sale − Off. Cr − Per. Cr − UPI Received",
              },
              {
                label: "Cash In Hand",
                formula: "Total Cash − Cash Expenses − Cash to Office",
              },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-2xl p-4"
                style={{ background: "var(--bg-elevated)" }}
              >
                <p
                  className="text-xs mb-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  {c.label} Formula
                </p>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {c.formula}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── EntryModal ──────────────────────────────────────────────────────────── */
function EntryModal({ entry, lastCashInHand, existingDates, onSave, onClose }) {
  const initForm = (e) => {
    if (e)
      return {
        date: e.date?.split("T")[0] ?? e.date,
        openingCash: e.openingCash ?? 0,
        // Fall back gracefully for legacy entries that only have a flat kitchenSale /
        // kitchenSaleEntries (by-person), so editing an old record never drops data.
        kitchenSubTabs: e.kitchenSubTabs || [
          {
            name: "Kitchen Sale",
            entries: e.kitchenSaleEntries || [],
            directAmount:
              e.kitchenSaleEntries && e.kitchenSaleEntries.length > 0
                ? ""
                : (e.kitchenSale ?? ""),
          },
        ],
        coffeeSubTabs: e.coffeeSubTabs || [
          {
            name: "Coffee Shop",
            entries: e.coffeeShopEntries || [],
            directAmount:
              e.coffeeShopEntries && e.coffeeShopEntries.length > 0
                ? ""
                : (e.coffeeShop ?? e.coffeeShopSale ?? ""),
          },
        ],
        officialCrEntries: e.officialCrEntries || [],
        personalCrEntries: e.personalCrEntries || [],
        upiReceived: e.upiReceived ?? 0,
        cashToOffice: e.cashToOffice ?? 0,
        cashToOfficeEntries: e.cashToOfficeEntries || [],
        salaryEntries: e.salaryEntries || [],
        advanceEntries: e.advanceEntries || [],
        expenseEntries: normalizeExpenses(e.expenseEntries),
      };
    return {
      date: todayStr(),
      openingCash: lastCashInHand ?? 0,
      kitchenSubTabs: [{ name: "Kitchen Sale", entries: [], directAmount: "" }],
      coffeeSubTabs: [{ name: "Coffee Shop", entries: [], directAmount: "" }],
      officialCrEntries: [],
      personalCrEntries: [],
      upiReceived: "",
      cashToOffice: "",
      cashToOfficeEntries: [],
      salaryEntries: [],
      advanceEntries: [],
      expenseEntries: {},
    };
  };

  const [form, setForm] = useState(() => initForm(entry));
  const [kitchenPopup, setKitchenPopup] = useState(false);
  const [coffeePopup, setCoffeePopup] = useState(false);
  const [officialPopup, setOfficialPopup] = useState(false);
  const [personalPopup, setPersonalPopup] = useState(false);
  const [cashOfficePopup, setCashOfficePopup] = useState(false);
  const [salaryPopup, setSalaryPopup] = useState(false);
  const [advancePopup, setAdvancePopup] = useState(false);
  const [expensePopup, setExpensePopup] = useState(false);
  const [dateError, setDateError] = useState("");
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const kitchenSale = form.kitchenSubTabs.reduce(
    (s, t) => s + subTabTotal(t),
    0,
  );
  const coffeeShop = form.coffeeSubTabs.reduce((s, t) => s + subTabTotal(t), 0);
  const officialCr = sumPersonEntries(form.officialCrEntries);
  const personalCr = sumPersonEntries(form.personalCrEntries);
  const upiReceived = Number(form.upiReceived) || 0;
  const cashToOffice =
    form.cashToOfficeEntries.length > 0
      ? sumPersonEntries(form.cashToOfficeEntries)
      : Number(form.cashToOffice) || 0;
  const openingCash = Number(form.openingCash) || 0;
  const salary = sumPersonEntries(form.salaryEntries);
  const advance = sumPersonEntries(form.advanceEntries);
  // Cash Expenses = generic category map + Salary + Advance (Salary/Advance
  // moved out of the generic map into their own by-person breakdowns, but
  // still count toward the same Cash Expenses total, right alongside it).
  const cashExpenses = sumExpenses(form.expenseEntries) + salary + advance;

  // ④ totalSale = sum of all sale tabs (kitchen + coffee + their sub-tabs)
  const totalSale = kitchenSale + coffeeShop;
  // ⑧ totalCash = openingCash + totalSale - officialCr - personalCr - upiReceived
  const totalCash =
    openingCash + totalSale - officialCr - personalCr - upiReceived;
  // ⑪ cashInHand = totalCash - cashExpenses - cashToOffice (becomes next day's opening cash)
  const cashInHand = totalCash - cashExpenses - cashToOffice;

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
    const expObj = {};
    Object.entries(form.expenseEntries).forEach(([k, v]) => {
      if (Number(v) > 0) expObj[k] = Number(v);
    });
    onSave({
      date: form.date,
      openingCash,
      kitchenSubTabs: form.kitchenSubTabs,
      kitchenSale,
      kitchenSaleEntries: flattenSubTabsToEntries(form.kitchenSubTabs),
      coffeeSubTabs: form.coffeeSubTabs,
      coffeeShop,
      coffeeShopSale: coffeeShop,
      coffeeShopEntries: flattenSubTabsToEntries(form.coffeeSubTabs),
      officialCr,
      officialCrEntries: form.officialCrEntries,
      personalCr,
      personalCrEntries: form.personalCrEntries,
      upiReceived,
      cashToOffice,
      cashToOfficeEntries: form.cashToOfficeEntries,
      salary,
      salaryEntries: form.salaryEntries,
      advance,
      advanceEntries: form.advanceEntries,
      totalSale,
      totalCash,
      expenseEntries: expObj,
      cashExpenses,
      cashInHand,
      closingCash: cashInHand,
    });
  };

  const inp = "w-full px-3 py-2 rounded-lg border text-sm outline-none";
  const is = {
    background: "var(--bg-elevated)",
    borderColor: "var(--border)",
    color: "var(--text-primary)",
  };
  const ls = { color: "var(--text-sec)" };

  const BtnField = ({ label, total, count, onClick, hint }) => (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={ls}>
        {label}
      </label>
      <button
        type="button"
        onClick={onClick}
        className="w-full px-3 py-2 rounded-lg border text-sm text-left flex items-center justify-between"
        style={{ ...is, borderColor: "var(--border)" }}
      >
        <span
          style={{
            color: total > 0 ? "var(--text-primary)" : "var(--text-muted)",
          }}
        >
          {total > 0
            ? `₹${fmt(total)}${count ? ` (${count} entries)` : ""}`
            : hint || "Tap to enter…"}
        </span>
        <span style={{ color: "var(--accent-text)" }}>✎</span>
      </button>
    </div>
  );

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
          {/* ① Date + Opening Cash */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={ls}>
                Date
              </label>
              <input
                type="date"
                value={form.date}
                max={todayStr()}
                onChange={(e) => handleDateChange(e.target.value)}
                required
                className={inp}
                style={{
                  ...is,
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
              <label className="block text-xs font-semibold mb-1.5" style={ls}>
                Opening Cash
              </label>
              <input
                type="number"
                value={form.openingCash}
                onChange={(e) => set("openingCash", e.target.value)}
                className={inp}
                style={is}
              />
              {lastCashInHand !== null && !entry && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Auto: last Cash-in-Hand ₹{fmt(lastCashInHand)}
                </p>
              )}
            </div>
          </div>

          {/* ② ③ SALES section */}
          <div>
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: "var(--text-muted)" }}
            >
              Sales (click to manage sub-tabs)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <BtnField
                label=" Kitchen Sale"
                total={kitchenSale}
                count={null}
                onClick={() => setKitchenPopup(true)}
                hint="Manage kitchen sub-tabs…"
              />
              <BtnField
                label="Coffee Shop"
                total={coffeeShop}
                count={null}
                onClick={() => setCoffeePopup(true)}
                hint="Manage coffee sub-tabs…"
              />
            </div>
          </div>

          {/* ④ Total Sale — auto */}
          <div
            className="rounded-xl px-4 py-3 flex items-center justify-between"
            style={{
              background: "var(--accent-soft)",
              border: "1px solid var(--accent-border)",
            }}
          >
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--accent-text)" }}
            >
              Total Sale (auto)
              <p
                className="text-[10px] mt-0.5 font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                summation of all the sales
              </p>
            </span>
            <span
              className="text-lg font-bold tabular-nums"
              style={{ color: "var(--accent-text)" }}
            >
              ₹{fmt(totalSale)}
            </span>
          </div>

          {/* ⑤ ⑥ ⑦ Credit deductions */}
          <div>
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: "var(--text-muted)" }}
            >
              Credits & Deductions
            </p>
            <div className="grid grid-cols-2 gap-4">
              <BtnField
                label="Official Cr."
                total={officialCr}
                count={form.officialCrEntries.length || null}
                onClick={() => setOfficialPopup(true)}
                hint="Enter by person…"
              />
              <BtnField
                label="Personal Cr."
                total={personalCr}
                count={form.personalCrEntries.length || null}
                onClick={() => setPersonalPopup(true)}
                hint="Enter by person…"
              />
              <div className="col-span-2 sm:col-span-1">
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={ls}
                >
                  UPI Received
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.upiReceived}
                  onChange={(e) => set("upiReceived", e.target.value)}
                  className={inp}
                  style={is}
                />
              </div>
            </div>
          </div>

          {/* ⑧ Total Cash — auto */}
          <div
            className="rounded-xl px-4 py-3 flex items-center justify-between"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
            }}
          >
            <div>
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "var(--accent-text)" }}
              >
                Total Cash (auto)
              </span>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                Opening + Total Sale − Off.Cr − Per.Cr − UPI
              </p>
            </div>
            <span
              className="text-lg font-bold tabular-nums"
              style={{ color: "var(--text-primary)" }}
            >
              ₹{fmt(totalCash)}
            </span>
          </div>

          {/* ⑨ Cash to Office */}
          <div>
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: "var(--text-muted)" }}
            >
              Cash to Office
            </p>
            <BtnField
              label="Cash to Office"
              total={cashToOffice}
              count={
                form.cashToOfficeEntries.length > 0
                  ? form.cashToOfficeEntries.length
                  : null
              }
              onClick={() => setCashOfficePopup(true)}
              hint="Enter cash remitted to office…"
            />
          </div>

          {/* ⑩ Cash Expenses — Salary, Advance, and general categories.
              Salary & Advance are their own by-person breakdowns now (not
              generic category keys) but still add up into the same Cash
              Expenses total, shown together right here. */}
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
                  ₹{fmt(cashExpenses)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <BtnField
                label="Salary"
                total={salary}
                count={
                  form.salaryEntries.length > 0
                    ? form.salaryEntries.length
                    : null
                }
                onClick={() => setSalaryPopup(true)}
                hint="Enter salary by person…"
              />
              <BtnField
                label="Advance"
                total={advance}
                count={
                  form.advanceEntries.length > 0
                    ? form.advanceEntries.length
                    : null
                }
                onClick={() => setAdvancePopup(true)}
                hint="Enter advance by person…"
              />
            </div>

            <button
              type="button"
              onClick={() => setExpensePopup(true)}
              className="w-full px-4 py-3 rounded-xl border text-sm flex items-center justify-between"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
                color:
                  sumExpenses(form.expenseEntries) > 0
                    ? "var(--text-primary)"
                    : "var(--text-muted)",
              }}
            >
              <span>
                {sumExpenses(form.expenseEntries) > 0
                  ? `₹${fmt(sumExpenses(form.expenseEntries))} across ${Object.entries(form.expenseEntries).filter(([, v]) => Number(v) > 0).length} other categories`
                  : "Click to enter other expense categories…"}
              </span>
              <span style={{ color: "var(--accent-text)" }}>✎ Edit</span>
            </button>
            {(sumExpenses(form.expenseEntries) > 0 ||
              salary > 0 ||
              advance > 0) && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {salary > 0 && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: "var(--accent-soft)",
                      color: "var(--accent-text)",
                      border: "1px solid var(--accent-border)",
                    }}
                  >
                    Salary: ₹{fmt(salary)}
                  </span>
                )}
                {advance > 0 && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: "var(--accent-soft)",
                      color: "var(--accent-text)",
                      border: "1px solid var(--accent-border)",
                    }}
                  >
                    Advance: ₹{fmt(advance)}
                  </span>
                )}
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

          {/* ⑪ Cash In Hand — auto, becomes next day's opening cash */}
          <div
            className="rounded-xl px-4 py-4 border-2"
            style={{
              borderColor:
                cashInHand >= 0
                  ? "rgba(34,197,94,0.3)"
                  : "var(--danger-border)",
              background:
                cashInHand >= 0 ? "rgba(34,197,94,0.05)" : "var(--danger-soft)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{
                    color: cashInHand >= 0 ? "#22c55e" : "var(--danger-text)",
                  }}
                >
                  Cash In Hand (auto)
                </span>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  Total Cash − Cash Expenses − Cash to Office
                </p>
              </div>
              <span
                className="text-2xl font-black tabular-nums"
                style={{
                  color: cashInHand >= 0 ? "#22c55e" : "var(--danger-text)",
                }}
              >
                ₹{fmt(cashInHand)}
              </span>
            </div>
          </div>

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

      {kitchenPopup && (
        <SaleSubTabPopup
          title="Kitchen Sale"
          subTabs={form.kitchenSubTabs}
          onClose={() => setKitchenPopup(false)}
          onSave={(tabs) => {
            set("kitchenSubTabs", tabs);
            setKitchenPopup(false);
          }}
        />
      )}
      {coffeePopup && (
        <SaleSubTabPopup
          title="Coffee Shop"
          subTabs={form.coffeeSubTabs}
          onClose={() => setCoffeePopup(false)}
          onSave={(tabs) => {
            set("coffeeSubTabs", tabs);
            setCoffeePopup(false);
          }}
        />
      )}
      {officialPopup && (
        <PersonEntryPopup
          title="Official Credit"
          entries={form.officialCrEntries}
          onClose={() => setOfficialPopup(false)}
          onSave={(rows) => {
            set("officialCrEntries", rows);
            setOfficialPopup(false);
          }}
        />
      )}
      {personalPopup && (
        <PersonEntryPopup
          title="Personal Credit"
          entries={form.personalCrEntries}
          showCredited
          onClose={() => setPersonalPopup(false)}
          onSave={(rows) => {
            set("personalCrEntries", rows);
            setPersonalPopup(false);
          }}
        />
      )}
      {cashOfficePopup && (
        <PersonEntryPopup
          title="Cash to Office"
          entries={form.cashToOfficeEntries}
          onClose={() => setCashOfficePopup(false)}
          onSave={(rows) => {
            set("cashToOfficeEntries", rows);
            setCashOfficePopup(false);
          }}
        />
      )}
      {salaryPopup && (
        <PersonEntryPopup
          title="Salary"
          entries={form.salaryEntries}
          onClose={() => setSalaryPopup(false)}
          onSave={(rows) => {
            set("salaryEntries", rows);
            setSalaryPopup(false);
          }}
        />
      )}
      {advancePopup && (
        <PersonEntryPopup
          title="Advance"
          entries={form.advanceEntries}
          onClose={() => setAdvancePopup(false)}
          onSave={(rows) => {
            set("advanceEntries", rows);
            setAdvancePopup(false);
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

/* Flatten sub-tab person-entries into one legacy-compatible flat array (for old "*Entries" fields) */
function flattenSubTabsToEntries(tabs = []) {
  return tabs.flatMap((t) => (t.entries?.length > 0 ? t.entries : []));
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const today = new Date();
  const currentMonthKey = toMonthKey(today.getFullYear(), today.getMonth() + 1);
  const TAB_MONTHS = lastNMonths(currentMonthKey, 6);
  const OVERVIEW_YEARS = yearsFrom(2024, currentMonthKey);

  const [allData, setAllData] = useState({});
  const [loadingMap, setLoadingMap] = useState({});
  const [shopInfo, setShopInfo] = useState(null);
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
  const [breakdownModal, setBreakdownModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });
  const PAGE_SIZE = 10;

  const fetchMonth = useCallback(
    async (mk) => {
      setLoadingMap((p) => ({ ...p, [mk]: true }));
      try {
        const params = { month: mk };
        if (user?.role === "admin" && user?.shop) params.shop = user.shop;
        const { data } = await API.get("/daybook", { params });
        setAllData((p) => ({
          ...p,
          [mk]: data.success ? data.data || [] : [],
        }));
      } catch {
        setAllData((p) => ({ ...p, [mk]: [] }));
      } finally {
        setLoadingMap((p) => ({ ...p, [mk]: false }));
      }
    },
    [user?.role, user?.shop],
  );

  useEffect(() => {
    TAB_MONTHS.forEach((mk) => fetchMonth(mk));
  }, []); // eslint-disable-line
  useEffect(() => {
    if (!(viewMonth in allData) && !loadingMap[viewMonth])
      fetchMonth(viewMonth);
  }, [viewMonth]); // eslint-disable-line
  useEffect(() => {
    monthsForYear(overviewYear, currentMonthKey).forEach((mk) => {
      if (!(mk in allData) && !loadingMap[mk]) fetchMonth(mk);
    });
  }, [overviewYear]); // eslint-disable-line

  useEffect(() => {
    if (user?.role === "admin" && user?.shop) {
      const fetchShop = async () => {
        try {
          const { data } = await API.get("/shops/me");
          if (data.success) setShopInfo(data.data.shop);
        } catch {
          setShopInfo(null);
        }
      };
      fetchShop();
    }
  }, [user?.role, user?.shop]);

  const entries = allData[viewMonth] || [];
  const overviewMks = monthsForYear(overviewYear, currentMonthKey);
  const existingDates = entries.map((e) => (e.date || "").split("T")[0]);

  // Last Cash-in-Hand becomes next day's opening cash
  const lastCashInHand = (() => {
    if (editEntry) return null;
    const s = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (!s.length) return null;
    const last = s[0];
    return last.cashInHand ?? last.closingCash ?? null;
  })();

  const withCalc = entries.map((e) => {
    const coffeeShop = e.coffeeShop ?? e.coffeeShopSale ?? 0;
    const cashInHand =
      e.cashInHand ??
      (e.totalCash || 0) - (e.cashExpenses || 0) - (e.cashToOffice || 0);
    return {
      ...e,
      coffeeShop,
      cashInHand,
      expenseEntries: normalizeExpenses(e.expenseEntries),
    };
  });

  const filtered = withCalc.filter((e) =>
    fmtDate(e.date).toLowerCase().includes(search.toLowerCase()),
  );
  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey],
      bv = b[sortKey];
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageData = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totals = entries.reduce(
    (a, e) => ({
      kitchenSale: a.kitchenSale + (e.kitchenSale || 0),
      coffeeShop: a.coffeeShop + (e.coffeeShop ?? e.coffeeShopSale ?? 0),
      totalSale: a.totalSale + (e.totalSale || 0),
      officialCr: a.officialCr + (e.officialCr || 0),
      personalCr: a.personalCr + (e.personalCr || 0),
      upiReceived: a.upiReceived + (e.upiReceived || 0),
      totalCash: a.totalCash + (e.totalCash || 0),
      cashToOffice: a.cashToOffice + (e.cashToOffice || 0),
      cashExpenses: a.cashExpenses + (e.cashExpenses || 0),
    }),
    {
      kitchenSale: 0,
      coffeeShop: 0,
      totalSale: 0,
      officialCr: 0,
      personalCr: 0,
      upiReceived: 0,
      totalCash: 0,
      cashToOffice: 0,
      cashExpenses: 0,
    },
  );
  const monthCashInHand =
    totals.totalCash - totals.cashExpenses - totals.cashToOffice;

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
      if (user?.role === "admin" && user?.shop) {
        formData.shop = user.shop;
      }
      const { data } = isEdit
        ? await API.put(`/daybook/${editEntry._id}`, formData)
        : await API.post("/daybook", formData);
      if (!data.success) {
        alert("Save failed: " + data.message);
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
      alert("Save failed: " + (err?.response?.data?.message || err.message));
    }
    setShowModal(false);
    setEditEntry(null);
  };

  const handleDelete = async (entry) => {
    try {
      await API.delete(`/daybook/${entry._id}`);
    } catch (err) {
      alert("Delete failed: " + (err?.response?.data?.message || err.message));
    }
    const mk = entry.date.slice(0, 7);
    setAllData((p) => ({
      ...p,
      [mk]: (p[mk] || []).filter((e) => e._id !== entry._id),
    }));
    setDeleteTarget(null);
  };

  const logout = () => {
    authLogout();
    navigate("/login");
  };

  const isDetailLoading = !!loadingMap[viewMonth];

  /* ─── ClickableCell helper — accepts an optional title for the breakdown modal ── */
  const ClickCell = ({ items, value, fallback, title }) => {
    if (!items || items.length === 0)
      return (
        <span style={{ color: "var(--text-muted)" }}>
          {fallback ?? fmt(value)}
        </span>
      );
    return (
      <button
        type="button"
        onClick={() =>
          setBreakdownModal({ title: title || "Breakdown", items })
        }
        style={{
          color: "var(--text-primary)",
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
        className="group"
      >
        <span className="tabular-nums font-medium border-b border-dotted border-transparent group-hover:border-current">
          {fmt(value)}
        </span>
      </button>
    );
  };

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
              {shopInfo?.name || "Loading shop…"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center border"
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
        {/* ── Shop hero: name + live clock ─────────────────────────────────────── */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-black leading-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {shopInfo?.name || "Your Shop"}
            </h1>
            {shopInfo?.address && (
              <p
                className="text-sm mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                {shopInfo.address}
              </p>
            )}
          </div>
          <LiveClock />
        </div>

        {/* ── Quick stats: Personal Cr / Patient Bill / Salary / Stock ─────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickStatCard
            label="Personal Cr."
            hint="By-person credit, credited status — monthly & day-wise"
            onClick={() => navigate("/dashboard/personal-cr")}
          />
          <QuickStatCard
            label="Patient Bill"
            hint="Official Cr. — monthly & day-wise"
            onClick={() => navigate("/dashboard/patient-bill")}
          />
          <QuickStatCard
            label="Salary"
            hint="By-person salary — monthly & day-wise"
            onClick={() => navigate("/dashboard/salary")}
          />
          <QuickStatCard label="Stock" comingSoon />
        </div>

        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          Overview &amp; Monthly Summary
        </p>

        <div
          className="flex items-center border-b overflow-x-auto"
          style={{ borderColor: "var(--border)" }}
        >
          <button
            onClick={() => setActiveTab("overview")}
            className="px-4 py-2.5 text-sm font-semibold whitespace-nowrap"
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
                        "Cash In Hand",
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
                  value={totals.coffeeShop}
                  sub="Coffee Shop revenue"
                />
                <StatCard
                  label="Cash In Hand"
                  value={monthCashInHand}
                  sub="Cash − Exp − Office"
                  accent={monthCashInHand >= 0}
                  danger={monthCashInHand < 0}
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
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setSortKey("date");
                      setSortDir("asc");
                      setPage(1);
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap"
                    style={{
                      borderColor: "var(--border)",
                      color: "var(--text-sec)",
                      background: "var(--bg-elevated)",
                    }}
                  >
                    ↺ Reset
                  </button>
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
              </div>

              <div className="overflow-x-auto">
                <table
                  className="w-full text-sm border-collapse"
                  style={{ minWidth: "1380px" }}
                >
                  <thead>
                    <tr style={{ background: "var(--bg-elevated)" }}>
                      {ALL_COLS.map((col) => (
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
                          {Array.from({ length: ALL_COLS.length + 1 }).map(
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
                          colSpan={ALL_COLS.length + 1}
                          className="text-center py-16"
                          style={{ color: "var(--text-muted)" }}
                        >
                          No entries for {displayMonth(viewMonth)}.
                        </td>
                      </tr>
                    )}
                    {!isDetailLoading &&
                      pageData.map((row, idx) => {
                        const negCash = row.cashInHand < 0;
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
                            {/* ① Opening Cash */}
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
                            {/* ② Kitchen Sale */}
                            <td className="px-3 py-3 text-right tabular-nums">
                              <ClickCell
                                title="Kitchen Sale Breakdown"
                                value={row.kitchenSale}
                                items={flattenSubTabs(row.kitchenSubTabs || [])}
                              />
                            </td>
                            {/* ③ Coffee Shop */}
                            <td className="px-3 py-3 text-right tabular-nums">
                              <ClickCell
                                title="Coffee Shop Breakdown"
                                value={row.coffeeShop}
                                items={flattenSubTabs(row.coffeeSubTabs || [])}
                              />
                            </td>
                            {/* ④ Total Sale */}
                            <td
                              className="px-3 py-3 text-right tabular-nums font-semibold"
                              style={{ color: "var(--accent-text)" }}
                            >
                              {fmt(row.totalSale)}
                            </td>
                            {/* ⑤ Official Cr */}
                            <td className="px-3 py-3 text-right tabular-nums">
                              <ClickCell
                                title="Official Credit Breakdown"
                                value={row.officialCr}
                                items={row.officialCrEntries || []}
                              />
                            </td>
                            {/* ⑥ Personal Cr */}
                            <td className="px-3 py-3 text-right tabular-nums">
                              <ClickCell
                                title="Personal Credit Breakdown"
                                value={row.personalCr}
                                items={row.personalCrEntries || []}
                              />
                            </td>
                            {/* ⑦ UPI */}
                            <td
                              className="px-3 py-3 text-right tabular-nums"
                              style={{ color: "var(--text-sec)" }}
                            >
                              {fmt(row.upiReceived)}
                            </td>
                            {/* ⑧ Total Cash */}
                            <td
                              className="px-3 py-3 text-right tabular-nums"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {fmt(row.totalCash)}
                            </td>
                            {/* ⑨ Cash to Office */}
                            <td className="px-3 py-3 text-right tabular-nums">
                              <ClickCell
                                title="Cash to Office Breakdown"
                                value={row.cashToOffice}
                                items={row.cashToOfficeEntries || []}
                              />
                            </td>
                            {/* ⑩ Cash Exp — generic categories + Salary + Advance, shown together */}
                            <td className="px-3 py-3 text-right tabular-nums">
                              {Object.keys(row.expenseEntries || {}).length >
                                0 ||
                              (row.salaryEntries || []).length > 0 ||
                              (row.advanceEntries || []).length > 0 ||
                              row.salary > 0 ||
                              row.advance > 0 ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setBreakdownModal({
                                      title: "Cash Expenses Breakdown",
                                      items: [
                                        ...((row.salaryEntries || []).length > 0
                                          ? row.salaryEntries.map((e) => ({
                                              name: `[Salary] ${e.name}`,
                                              amount: e.amount,
                                            }))
                                          : row.salary > 0
                                            ? [
                                                {
                                                  name: "Salary",
                                                  amount: row.salary,
                                                },
                                              ]
                                            : []),
                                        ...((row.advanceEntries || []).length >
                                        0
                                          ? row.advanceEntries.map((e) => ({
                                              name: `[Advance] ${e.name}`,
                                              amount: e.amount,
                                            }))
                                          : row.advance > 0
                                            ? [
                                                {
                                                  name: "Advance",
                                                  amount: row.advance,
                                                },
                                              ]
                                            : []),
                                        ...Object.entries(
                                          normalizeExpenses(row.expenseEntries),
                                        )
                                          .filter(([, v]) => Number(v) > 0)
                                          .map(([k, v]) => ({
                                            name: k,
                                            amount: v,
                                          })),
                                      ],
                                    })
                                  }
                                  className="group"
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                    padding: 0,
                                    cursor: "pointer",
                                    color: "var(--danger-text)",
                                  }}
                                >
                                  <span className="tabular-nums font-medium border-b border-dotted border-transparent group-hover:border-current">
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
                            {/* ⑪ Cash In Hand */}
                            <td className="px-3 py-3 text-right tabular-nums font-bold">
                              <Badge
                                variant={negCash ? "negative" : "positive"}
                              >
                                ₹{fmt(row.cashInHand)}
                              </Badge>
                            </td>
                            <td className="px-3 py-3 text-right whitespace-nowrap">
                              <button
                                onClick={() => setViewEntry(row)}
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
                                onClick={() => setDeleteTarget(row)}
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
                      <td
                        className="px-3 py-3 text-right tabular-nums"
                        style={{ color: "var(--accent-text)" }}
                      >
                        {fmt(totals.coffeeShop)}
                      </td>
                      <td
                        className="px-3 py-3 text-right tabular-nums"
                        style={{ color: "var(--accent-text)" }}
                      >
                        {fmt(totals.totalSale)}
                      </td>
                      <td
                        className="px-3 py-3 text-right tabular-nums"
                        style={{ color: "var(--text-sec)" }}
                      >
                        {fmt(totals.officialCr)}
                      </td>
                      <td
                        className="px-3 py-3 text-right tabular-nums"
                        style={{ color: "var(--text-sec)" }}
                      >
                        {fmt(totals.personalCr)}
                      </td>
                      <td
                        className="px-3 py-3 text-right tabular-nums"
                        style={{ color: "var(--text-sec)" }}
                      >
                        {fmt(totals.upiReceived)}
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
                          variant={
                            monthCashInHand >= 0 ? "positive" : "negative"
                          }
                        >
                          ₹{fmt(monthCashInHand)}
                        </Badge>
                      </td>
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
          lastCashInHand={lastCashInHand}
          existingDates={existingDates}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditEntry(null);
          }}
        />
      )}
      {viewEntry && (
        <DetailModal entry={viewEntry} onClose={() => setViewEntry(null)} />
      )}
      {breakdownModal && (
        <BreakdownModal
          title={breakdownModal.title}
          items={breakdownModal.items}
          onClose={() => setBreakdownModal(null)}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          entry={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget)}
        />
      )}
    </div>
  );
}
