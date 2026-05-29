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

/* last N months ending at (and including) baseKey, newest first */
const lastNMonths = (baseKey, n) => {
  const result = [];
  let cur = baseKey;
  for (let i = 0; i < n; i++) {
    result.push(cur);
    cur = prevMonth(cur);
  }
  return result;
};

const monthsFromYearToCurrent = (startYear, endKey) => {
  const { year: endYear, month: endMonth } = parseKey(endKey);
  const result = [];

  for (let year = endYear; year >= startYear; year--) {
    const monthStart = year === endYear ? endMonth : 12;

    for (let month = monthStart; month >= 1; month--) {
      result.push(toMonthKey(year, month));
    }
  }

  return result;
};

const yearsFromToCurrent = (startYear, endKey) => {
  const { year: endYear } = parseKey(endKey);
  const result = [];

  for (let year = endYear; year >= startYear; year--) {
    result.push(year);
  }

  return result;
};

const todayInputValue = () => {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
};

/* ─── Formatters ─────────────────────────────────────────────────────────── */
const fmt = (n) =>
  n === undefined || n === null || isNaN(n)
    ? "—"
    : new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

const COLUMNS = [
  { key: "date", label: "Date", align: "left" },
  { key: "openingCash", label: "Op. Cash", align: "right" },
  { key: "kitchenSale", label: "Kitchen", align: "right" },
  { key: "coffeeShopSale", label: "Coffee Shop", align: "right" },
  { key: "cafeSale", label: "Café Sale", align: "right" },
  { key: "cafeNight", label: "Café Night", align: "right" },
  { key: "totalSale", label: "Total Sale", align: "right" },
  { key: "totalCash", label: "Total Cash", align: "right" },
  { key: "cashExpenses", label: "Cash Exp.", align: "right" },
  { key: "deficit", label: "Surplus/Def", align: "right" },
  { key: "closingCash", label: "Closing", align: "right" },
];

/* ─── Sub-components ─────────────────────────────────────────────────────── */
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

function MonthTab({ mk, active, hasData, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2.5 text-sm font-semibold transition-colors relative whitespace-nowrap flex items-center gap-1.5"
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
  if (loading) {
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
  }
  if (!data || data.length === 0) {
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
  }
  const totals = data.reduce(
    (a, e) => ({
      totalSale: a.totalSale + (e.totalSale || 0),
      totalCash: a.totalCash + (e.totalCash || 0),
      cashExpenses: a.cashExpenses + (e.cashExpenses || 0),
    }),
    { totalSale: 0, totalCash: 0, cashExpenses: 0 },
  );
  const deficit = totals.totalCash - totals.cashExpenses;
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
        {fmt(totals.totalSale)}
      </td>
      <td
        className="px-4 py-3 tabular-nums"
        style={{ color: "var(--text-primary)" }}
      >
        {fmt(totals.totalCash)}
      </td>
      <td
        className="px-4 py-3 tabular-nums"
        style={{ color: "var(--danger-text)" }}
      >
        {fmt(totals.cashExpenses)}
      </td>
      <td className="px-4 py-3 tabular-nums font-bold">
        <Badge variant={deficit >= 0 ? "positive" : "negative"}>
          ₹{fmt(deficit)}
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

/* ─── Main Dashboard ─────────────────────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const today = new Date();
  const currentMonthKey = toMonthKey(today.getFullYear(), today.getMonth() + 1);
  // 6 tabs: current month + 5 previous, newest first
  const TAB_MONTHS = lastNMonths(currentMonthKey, 6);
  const OVERVIEW_MONTHS = monthsFromYearToCurrent(2024, currentMonthKey);
  const OVERVIEW_YEARS = yearsFromToCurrent(2024, currentMonthKey);

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
  const PAGE_SIZE = 10;

  /* ── fetch one month from API ── */
  const fetchMonth = useCallback(async (mk) => {
    setLoadingMap((prev) => ({ ...prev, [mk]: true }));
    try {
      const { data } = await API.get("/daybook", {
        params: { month: mk },
      });

      setAllData((prev) => ({
        ...prev,
        [mk]: data.success ? data.data || [] : [],
      }));
    } catch (error) {
      console.error(`Failed to fetch daybook for ${mk}:`, error);
      setAllData((prev) => ({ ...prev, [mk]: [] }));
    } finally {
      setLoadingMap((prev) => ({ ...prev, [mk]: false }));
    }
  }, []);

  /* on mount: fetch every overview month; tabs still show only the latest 6 */
  useEffect(() => {
    OVERVIEW_MONTHS.forEach((mk) => fetchMonth(mk));
  }, []); // eslint-disable-line

  /* when navigating to a month not already fetched, fetch it */
  useEffect(() => {
    if (!(viewMonth in allData) && !loadingMap[viewMonth]) {
      fetchMonth(viewMonth);
    }
  }, [viewMonth]); // eslint-disable-line

  /* ── derived data ── */
  const entries = allData[viewMonth] || [];
  const overviewMonths = OVERVIEW_MONTHS.filter(
    (mk) => parseKey(mk).year === Number(overviewYear),
  );

  const withDeficit = entries.map((e) => ({
    ...e,
    deficit: (e.totalCash || 0) - (e.cashExpenses || 0),
  }));

  const filtered = withDeficit.filter((e) =>
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
      coffeeShopSale: a.coffeeShopSale + (e.coffeeShopSale || 0),
      totalSale: a.totalSale + (e.totalSale || 0),
      totalCash: a.totalCash + (e.totalCash || 0),
      cashExpenses: a.cashExpenses + (e.cashExpenses || 0),
    }),
    {
      kitchenSale: 0,
      coffeeShopSale: 0,
      totalSale: 0,
      totalCash: 0,
      cashExpenses: 0,
    },
  );
  const monthDeficit = totals.totalCash - totals.cashExpenses;

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

      const mk = data.data.date.slice(0, 7);
      setAllData((prev) => {
        const list = prev[mk] || [];
        return {
          ...prev,
          [mk]: isEdit
            ? list.map((e) => (e._id === editEntry._id ? data.data : e))
            : [...list, data.data],
        };
      });
    } catch (err) {
      console.error("Save failed:", err);
    }
    setShowModal(false);
    setEditEntry(null);
  };

  const handleDelete = async (entry) => {
    if (!confirm(`Delete entry for ${fmtDate(entry.date)}?`)) return;
    try {
      await API.delete(`/daybook/${entry._id}`);
    } catch (error) {
      console.error("Delete failed:", error);
    }
    const mk = entry.date.slice(0, 7);
    setAllData((prev) => ({
      ...prev,
      [mk]: (prev[mk] || []).filter((e) => e._id !== entry._id),
    }));
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();
  const isDetailLoading = loadingMap[viewMonth] || false;

  /* ════════════════════════════════════════════════════════════
      RENDER
  ════════════════════════════════════════════════════════════ */
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      {/* ── Topbar ── */}
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

      <main className="max-w-8xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* ── Tab bar: Overview + 6 month tabs ── */}
        <div
          className="flex items-center gap-0 border-b overflow-x-auto"
          style={{ borderColor: "var(--border)" }}
        >
          {/* Overview tab */}
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
          {/* Divider */}
          <div
            className="w-px h-5 mx-1 self-center"
            style={{ background: "var(--border)" }}
          />
          <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
            <span className="cursor-default select-none">Last 6 months</span>
            <span className="text-xs text-slate-400 font-normal select-none">
              →
            </span>
          </div>

          {/* 6 month tabs, newest first */}
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

        {/* ══════════ OVERVIEW TAB ══════════ */}
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
                  aria-label="Select summary year"
                >
                  {OVERVIEW_YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
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
                    {overviewMonths.map((mk, index) => {
                      const { year } = parseKey(mk);
                      const previousYear =
                        index > 0
                          ? parseKey(overviewMonths[index - 1]).year
                          : null;
                      const showYearHeader = year !== previousYear;

                      return (
                        <Fragment key={mk}>
                          {showYearHeader && (
                            <tr style={{ background: "var(--bg-elevated)" }}>
                              <td
                                colSpan={7}
                                className="px-4 py-2 text-xs font-bold uppercase tracking-wider border-b"
                                style={{
                                  borderColor: "var(--border-sub)",
                                  color: "var(--text-muted)",
                                }}
                              >
                                {year}
                              </td>
                            </tr>
                          )}
                          <MonthRow
                            mk={mk}
                            data={allData[mk]}
                            loading={
                              loadingMap[mk] === true && !(mk in allData)
                            }
                            onClick={() => goToMonth(mk)}
                          />
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ MONTH DETAIL TAB ══════════ */}
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
                  sub="Kitchen + Café"
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
                  style={{ minWidth: "1060px" }}
                >
                  <thead>
                    <tr style={{ background: "var(--bg-elevated)" }}>
                      {COLUMNS.map((col) => (
                        <th
                          key={col.key}
                          onClick={() => handleSort(col.key)}
                          className={`px-4 py-3 font-semibold text-xs uppercase tracking-wider cursor-pointer select-none border-b transition-colors hover:opacity-80 ${col.align === "right" ? "text-right" : "text-left"}`}
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
                        className="px-4 py-3 text-right text-xs uppercase tracking-wider font-semibold border-b"
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
                              <td key={j} className="px-4 py-3">
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
                        const negClose = row.closingCash < 0;
                        const negDeficit = row.deficit < 0;
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
                              className="px-4 py-3 font-medium whitespace-nowrap"
                              style={{ color: "var(--accent-text)" }}
                            >
                              {fmtDate(row.date)}
                            </td>
                            <td
                              className="px-4 py-3 text-right tabular-nums"
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
                              className="px-4 py-3 text-right tabular-nums"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {fmt(row.kitchenSale)}
                            </td>
                            <td
                              className="px-4 py-3 text-right tabular-nums"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {fmt(row.coffeeShopSale)}
                            </td>
                            <td
                              className="px-4 py-3 text-right tabular-nums"
                              style={{ color: "var(--text-sec)" }}
                            >
                              {fmt(row.cafeSale)}
                            </td>
                            <td
                              className="px-4 py-3 text-right tabular-nums"
                              style={{ color: "var(--text-sec)" }}
                            >
                              {fmt(row.cafeNight)}
                            </td>
                            <td
                              className="px-4 py-3 text-right tabular-nums font-semibold"
                              style={{ color: "var(--accent-text)" }}
                            >
                              {fmt(row.totalSale)}
                            </td>
                            <td
                              className="px-4 py-3 text-right tabular-nums"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {fmt(row.totalCash)}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums">
                              {highExp ? (
                                <Badge variant="negative">
                                  ₹{fmt(row.cashExpenses)}
                                </Badge>
                              ) : (
                                <span style={{ color: "var(--danger-text)" }}>
                                  {fmt(row.cashExpenses)}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums font-semibold">
                              <Badge
                                variant={negDeficit ? "negative" : "positive"}
                              >
                                ₹{fmt(row.deficit)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums font-bold">
                              <Badge
                                variant={negClose ? "negative" : "positive"}
                              >
                                ₹{fmt(row.closingCash)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
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
                        borderColor: "rgba(0, 0, 0, 0.3)",
                        background: "var(--bg-elevated)",
                      }}
                    >
                      <td
                        className="px-4 py-3"
                        style={{ color: "var(--text-muted)" }}
                      >
                        TOTAL
                      </td>
                      <td
                        className="px-4 py-3 text-right"
                        style={{ color: "var(--text-muted)" }}
                      >
                        —
                      </td>
                      <td
                        className="px-4 py-3 text-right tabular-nums"
                        style={{ color: "var(--accent-text)" }}
                      >
                        {fmt(totals.kitchenSale)}
                      </td>
                      <td
                        className="px-4 py-3 text-right tabular-nums"
                        style={{ color: "var(--accent-text)" }}
                      >
                        {fmt(totals.coffeeShopSale)}
                      </td>
                      <td className="px-4 py-3" colSpan={2} />
                      <td
                        className="px-4 py-3 text-right tabular-nums"
                        style={{ color: "var(--accent-text)" }}
                      >
                        {fmt(totals.totalSale)}
                      </td>
                      <td
                        className="px-4 py-3 text-right tabular-nums"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {fmt(totals.totalCash)}
                      </td>
                      <td
                        className="px-4 py-3 text-right tabular-nums"
                        style={{ color: "var(--danger-text)" }}
                      >
                        {fmt(totals.cashExpenses)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-bold">
                        <Badge
                          variant={monthDeficit >= 0 ? "positive" : "negative"}
                        >
                          ₹{fmt(monthDeficit)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3" />
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
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditEntry(null);
          }}
        />
      )}
    </div>
  );
}

/* ─── Entry Modal ─────────────────────────────────────────────────────────── */
function EntryModal({ entry, onSave, onClose }) {
  const fields = [
    { key: "date", label: "Date", type: "date" },
    { key: "openingCash", label: "Opening Cash", type: "number" },
    { key: "kitchenSale", label: "Kitchen Sale", type: "number" },
    { key: "coffeeShopSale", label: "Coffee Shop", type: "number" },
    { key: "cafeSale", label: "Café Sale", type: "number" },
    { key: "cafeNight", label: "Café Night", type: "number" },
    { key: "totalSale", label: "Total Sale", type: "number" },
    { key: "totalCash", label: "Total Cash", type: "number" },
    { key: "cashExpenses", label: "Cash Expenses", type: "number" },
    { key: "closingCash", label: "Closing Cash", type: "number" },
  ];
  const [form, setForm] = useState(
    entry
      ? { ...entry, date: entry.date?.split("T")[0] ?? entry.date }
      : fields.reduce(
          (a, f) => ({
            ...a,
            [f.key]: f.key === "date" ? todayInputValue() : "",
          }),
          {},
        ),
  );
  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    fields.forEach((f) => {
      if (f.type === "number") payload[f.key] = Number(payload[f.key]) || 0;
    });
    onSave(payload);
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border"
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
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.key} className={f.key === "date" ? "col-span-2" : ""}>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: "var(--text-sec)" }}
              >
                {f.label}
              </label>
              <input
                type={f.type}
                value={form[f.key]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [f.key]: e.target.value }))
                }
                required={f.key === "date"}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          ))}
          <div className="col-span-2 flex justify-end gap-2 pt-2">
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
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: "var(--accent)" }}
            >
              {entry ? "Save Changes" : "Add Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
