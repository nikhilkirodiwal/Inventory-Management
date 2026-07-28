import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import API from "../api/axios";

/* ─── helpers ─────────────────────────────────────────────────────────────── */
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
const currentMonthKey = toMonthKey(
  new Date().getFullYear(),
  new Date().getMonth() + 1,
);
const currentYear = new Date().getFullYear();

const fmt = (n) =>
  n === undefined || n === null || isNaN(n)
    ? "—"
    : new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
const fmtDateShort = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

const normalizeExpenses = (raw) => {
  if (!raw || typeof raw !== "object") return {};
  return Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, Number(v) || 0]),
  );
};
const sumPersonEntries = (arr = []) =>
  arr.reduce((s, x) => s + (Number(x.amount) || 0), 0);
const subTabTotal = (t) =>
  t.entries?.length > 0
    ? sumPersonEntries(t.entries)
    : Number(t.directAmount) || 0;
const flattenSubTabs = (tabs = []) =>
  tabs.flatMap((t) =>
    t.entries?.length > 0
      ? t.entries.map((e) => ({
          name: `[${t.name}] ${e.name}`,
          amount: e.amount,
        }))
      : [{ name: t.name, amount: t.directAmount }],
  );

/* ─── small UI atoms ──────────────────────────────────────────────────────── */
function Badge({ children, variant = "neutral" }) {
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
      style={s[variant]}
    >
      {children}
    </span>
  );
}

function StatCard({ label, value, sub, accent, danger, prefix = "₹" }) {
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
      className="rounded-2xl px-5 py-4 flex flex-col gap-1 border"
      style={{ background: bg, borderColor: bc, boxShadow: "var(--shadow)" }}
    >
      <span
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </span>
      <span className="text-2xl font-black tabular-nums" style={{ color }}>
        {prefix}
        {fmt(value)}
      </span>
      {sub && (
        <span className="text-xs" style={{ color: "var(--text-sec)" }}>
          {sub}
        </span>
      )}
    </div>
  );
}

/* ─── Cash-flow pulse — signature element: an SVG line tracing cashInHand
     across the shop's full daybook history, gradient-filled underneath. ── */
function CashFlowPulse({ points }) {
  const [hovered, setHovered] = useState(null);

  if (!points.length) return null;
  const W = 900,
    H = 160,
    PAD = 12;
  const vals = points.map((p) => p.v);
  const min = Math.min(...vals),
    max = Math.max(...vals);
  const range = max - min || 1;
  const stepX = points.length > 1 ? (W - PAD * 2) / (points.length - 1) : 0;

  const xy = points.map((p, i) => {
    const x = PAD + i * stepX;
    const y = H - PAD - ((p.v - min) / range) * (H - PAD * 2);
    return [x, y];
  });

  const linePath = xy
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${xy[xy.length - 1][0].toFixed(1)},${H - PAD} L${xy[0][0].toFixed(1)},${H - PAD} Z`;
  const lastUp =
    points.length > 1 &&
    points[points.length - 1].v >= points[points.length - 2].v;

  return (
    <div
      className="rounded-2xl border p-5 relative"
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3
            className="font-bold text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            Cash Flow Pulse
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Cash-in-hand across every logged day
          </p>
        </div>
        <Badge variant={lastUp ? "positive" : "negative"}>
          {lastUp ? "▲ trending up" : "▼ trending down"}
        </Badge>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full overflow-visible"
          style={{ height: "160px" }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="pulseFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#pulseFill)" />
          <path
            d={linePath}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 2000,
              strokeDashoffset: 2000,
              animation: "pulse-draw 1.1s ease-out forwards",
            }}
          />
          {xy.map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={hovered?.index === i ? 6 : points.length > 60 ? 0 : 3.5}
              fill="var(--accent)"
              stroke="#fff"
              strokeWidth={hovered?.index === i ? 2 : 0}
              style={{ cursor: "pointer", transition: "r 0.15s ease" }}
              onMouseEnter={() =>
                setHovered({
                  index: i,
                  xPct: (x / W) * 100,
                  yPct: (y / H) * 100,
                  data: points[i],
                })
              }
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>

        {/* Hovered Tooltip Component - Positioned directly above dot */}
        {hovered && (
          <div
            className="absolute z-20 pointer-events-none transition-all duration-75 ease-out"
            style={{
              left: `${hovered.xPct}%`,
              top: `${hovered.yPct}%`,
              transform: "translate(-50%, -100%) translateY(-12px)",
            }}
          >
            <div
              className="rounded-xl border p-3.5 shadow-2xl text-xs space-y-2 min-w-50"
              style={{
                background: "rgba(15, 23, 42, 0.92)",
                backdropFilter: "blur(12px)",
                borderColor: "rgba(255, 255, 255, 0.15)",
                color: "#f8fafc",
                boxShadow:
                  "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5 font-bold">
                <span className="text-slate-300">
                  {fmtDateShort(hovered.data.date)}
                </span>
                <span className="text-emerald-400 font-extrabold text-sm">
                  ₹{fmt(hovered.data.v)}
                </span>
              </div>

              {/* Grid Breakdown */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                {hovered.data.totalSale !== undefined && (
                  <div className="flex justify-between col-span-2">
                    <span className="text-slate-400">Total Sale:</span>
                    <span className="font-semibold text-slate-100">
                      ₹{fmt(hovered.data.totalSale)}
                    </span>
                  </div>
                )}
                {hovered.data.totalCash !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Cash:</span>
                    <span className="font-semibold text-slate-200">
                      ₹{fmt(hovered.data.totalCash)}
                    </span>
                  </div>
                )}
                {hovered.data.cashExpenses !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Expenses:</span>
                    <span className="font-semibold text-rose-400">
                      ₹{fmt(hovered.data.cashExpenses)}
                    </span>
                  </div>
                )}
                {hovered.data.cashToOffice !== undefined && (
                  <div className="flex justify-between col-span-2">
                    <span className="text-slate-400">To Office:</span>
                    <span className="font-semibold text-amber-300">
                      ₹{fmt(hovered.data.cashToOffice)}
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Indicator Arrow */}
              <div
                className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-8"
                style={{ borderTopColor: "rgba(15, 23, 42, 0.92)" }}
              />
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes pulse-draw { to { stroke-dashoffset: 0; } } @media (prefers-reduced-motion: reduce) { svg path[stroke] { animation: none !important; stroke-dashoffset: 0 !important; } }`}</style>
    </div>
  );
}

/* ─── BreakdownModal ──────────────────────────────────────────────────────── */
function BreakdownModal({ title, items, onClose }) {
  const total = items.reduce((s, x) => s + (Number(x.amount) || 0), 0);
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
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>
            {title}
          </h3>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}>
            ✕
          </button>
        </div>
        <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
          {items.length === 0 && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No entries.
            </p>
          )}
          {items.map((item, i) => (
            <div
              key={i}
              className="flex justify-between rounded-lg px-3 py-2"
              style={{ background: "var(--bg-elevated)" }}
            >
              <span style={{ color: "var(--text-primary)" }}>{item.name}</span>
              <span
                className="font-semibold"
                style={{ color: "var(--accent-text)" }}
              >
                ₹{fmt(item.amount)}
              </span>
            </div>
          ))}
        </div>
        <div
          className="flex justify-between px-5 py-4 border-t font-bold"
          style={{ borderColor: "var(--border-sub)" }}
        >
          <span style={{ color: "var(--text-primary)" }}>Total</span>
          <span style={{ color: "var(--accent-text)" }}>₹{fmt(total)}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── ClickCell ───────────────────────────────────────────────────────────── */
function ClickCell({ items, value, onOpen }) {
  if (!items || items.length === 0)
    return <span style={{ color: "var(--text-muted)" }}>{fmt(value)}</span>;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group"
      style={{
        color: "var(--text-primary)",
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
      }}
    >
      <span className="tabular-nums font-medium border-b border-dotted border-transparent group-hover:border-current">
        {fmt(value)}
      </span>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN — ShopDetailView
══════════════════════════════════════════════════════════════════════════ */
export default function ShopDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shop, setShop] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [daybooks, setDaybooks] = useState([]);

  const [activeMonth, setActiveMonth] = useState(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [breakdownModal, setBreakdownModal] = useState(null);
  const [pulseHover, setPulseHover] = useState(null);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await API.get(`/shops/${id}`);
        if (!data.success)
          throw new Error(data.message || "Failed to load shop");
        setShop(data.data.shop);
        setAdmins(data.data.admins || []);
        const books = (data.data.daybooks || [])
          .map((e) => ({
            ...e,
            coffeeShop: e.coffeeShop ?? e.coffeeShopSale ?? 0,
            cashInHand:
              e.cashInHand ??
              (e.totalCash || 0) -
                (e.cashExpenses || 0) -
                (e.cashToOffice || 0),
            expenseEntries: normalizeExpenses(e.expenseEntries),
          }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setDaybooks(books);
        if (books.length) {
          const last = books[books.length - 1];
          const d = new Date(last.date);
          setActiveMonth(toMonthKey(d.getFullYear(), d.getMonth() + 1));
        }
      } catch (err) {
        setError(
          err?.response?.data?.message || err.message || "Failed to load shop",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, [id]);

  const months = useMemo(() => {
    const set = new Set(
      daybooks.map((e) => {
        const d = new Date(e.date);
        return toMonthKey(d.getFullYear(), d.getMonth() + 1);
      }),
    );
    return Array.from(set).sort().reverse();
  }, [daybooks]);

  const allTimeTotals = useMemo(() => {
    return daybooks.reduce(
      (a, e) => ({
        totalSale: a.totalSale + (e.totalSale || 0),
        totalCash: a.totalCash + (e.totalCash || 0),
        cashExpenses: a.cashExpenses + (e.cashExpenses || 0),
        cashToOffice: a.cashToOffice + (e.cashToOffice || 0),
      }),
      { totalSale: 0, totalCash: 0, cashExpenses: 0, cashToOffice: 0 },
    );
  }, [daybooks]);

  const netProfit =
    daybooks.length > 0
      ? daybooks[daybooks.length - 1].cashInHand - daybooks[0].openingCash
      : 0;
  const lossDays = daybooks.filter((e) => e.cashInHand < e.openingCash).length;
  const profitDays = daybooks.length - lossDays;
  const latestCashInHand = daybooks.length
    ? daybooks[daybooks.length - 1].cashInHand
    : 0;

  const pulsePoints = daybooks.map((e) => ({
    v: e.cashInHand,
    date: e.date,
    totalSale: e.totalSale,
    totalCash: e.totalCash,
    cashExpenses: e.cashExpenses,
    cashToOffice: e.cashToOffice,
  }));

  const currentMonthEntries = useMemo(
    () =>
      daybooks.filter((e) => {
        const d = new Date(e.date);
        return (
          toMonthKey(d.getFullYear(), d.getMonth() + 1) === currentMonthKey
        );
      }),
    [daybooks],
  );

  const currentYearEntries = useMemo(
    () =>
      daybooks.filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === currentYear;
      }),
    [daybooks],
  );

  const monthEntries = useMemo(
    () =>
      daybooks.filter((e) => {
        const d = new Date(e.date);
        return toMonthKey(d.getFullYear(), d.getMonth() + 1) === activeMonth;
      }),
    [daybooks, activeMonth],
  );

  const currentMonthTotals = useMemo(
    () =>
      currentMonthEntries.reduce(
        (a, e) => ({
          totalSale: a.totalSale + (e.totalSale || 0),
          totalCash: a.totalCash + (e.totalCash || 0),
          cashExpenses: a.cashExpenses + (e.cashExpenses || 0),
          cashToOffice: a.cashToOffice + (e.cashToOffice || 0),
        }),
        { totalSale: 0, totalCash: 0, cashExpenses: 0, cashToOffice: 0 },
      ),
    [currentMonthEntries],
  );

  const currentYearTotals = useMemo(
    () =>
      currentYearEntries.reduce(
        (a, e) => ({
          totalSale: a.totalSale + (e.totalSale || 0),
          totalCash: a.totalCash + (e.totalCash || 0),
          cashExpenses: a.cashExpenses + (e.cashExpenses || 0),
          cashToOffice: a.cashToOffice + (e.cashToOffice || 0),
        }),
        { totalSale: 0, totalCash: 0, cashExpenses: 0, cashToOffice: 0 },
      ),
    [currentYearEntries],
  );

  const filteredSorted = useMemo(() => {
    const filtered = monthEntries.filter((e) =>
      fmtDateShort(e.date).toLowerCase().includes(search.toLowerCase()),
    );
    return [...filtered].sort((a, b) => {
      const av = a[sortKey],
        bv = b[sortKey];
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [monthEntries, search, sortKey, sortDir]);

  const monthTotals = monthEntries.reduce(
    (a, e) => ({
      kitchenSale: a.kitchenSale + (e.kitchenSale || 0),
      coffeeShop: a.coffeeShop + (e.coffeeShop || 0),
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
    monthTotals.totalCash - monthTotals.cashExpenses - monthTotals.cashToOffice;

  const currentMonthCashInHand =
    currentMonthTotals.totalCash -
    currentMonthTotals.cashExpenses -
    currentMonthTotals.cashToOffice;
  const currentYearCashInHand =
    currentYearTotals.totalCash -
    currentYearTotals.cashExpenses -
    currentYearTotals.cashToOffice;

  const handleSort = (k) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  };

  const COLS = [
    { key: "date", label: "Date" },
    { key: "openingCash", label: "Op. Cash" },
    { key: "kitchenSale", label: "Kitchen" },
    { key: "coffeeShop", label: "Coffee" },
    { key: "totalSale", label: "Total Sale" },
    { key: "officialCr", label: "Off. Cr" },
    { key: "personalCr", label: "Per. Cr" },
    { key: "upiReceived", label: "UPI" },
    { key: "totalCash", label: "Total Cash" },
    { key: "cashToOffice", label: "To Office" },
    { key: "cashExpenses", label: "Expenses" },
    { key: "cashInHand", label: "Cash In Hand" },
  ];

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-base)" }}
      >
        <p style={{ color: "var(--text-muted)" }}>Loading shop…</p>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3"
        style={{ background: "var(--bg-base)" }}
      >
        <p style={{ color: "var(--danger-text)" }}>
          {error || "Shop not found"}
        </p>
        <button
          onClick={() => navigate("/superadmin")}
          className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          ← Back to Shops
        </button>
      </div>
    );
  }

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
          <button
            onClick={() => navigate("/superadmin")}
            className="w-8 h-8 rounded-lg flex items-center justify-center border text-lg font-bold"
            style={{
              borderColor: "var(--border)",
              background: "var(--bg-elevated)",
              color: "var(--text-sec)",
            }}
          >
            ←
          </button>
          <div>
            <p
              className="text-sm font-bold leading-none"
              style={{ color: "var(--text-primary)" }}
            >
              {shop.name}
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              {shop.address || "No address on file"}
            </p>
          </div>
        </div>
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
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Shop identity + admins */}
        <div
          className="rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow)",
          }}
        >
          <div>
            <h1
              className="text-xl font-black"
              style={{ color: "var(--text-primary)" }}
            >
              {shop.name}
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-sec)" }}>
              {shop.contact ? `📞 ${shop.contact}` : "No contact on file"} ·{" "}
              {shop.address || "No address on file"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {admins.length === 0 && (
              <Badge variant="negative">No admin assigned</Badge>
            )}
            {admins.map((a) => (
              <span
                key={a._id}
                className="text-xs px-3 py-1.5 rounded-full border font-medium"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--bg-elevated)",
                  color: "var(--text-sec)",
                }}
              >
                {a.name} · {a.email} ·{" "}
                <span style={{ color: "var(--accent-text)" }}>{a.role}</span>
              </span>
            ))}
          </div>
        </div>

        {/* All-time stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Days Logged"
            value={daybooks.length}
            prefix=""
            sub={
              daybooks.length
                ? `${fmtDateShort(daybooks[0].date)} – ${fmtDateShort(daybooks[daybooks.length - 1].date)}`
                : "No entries yet"
            }
          />
          <StatCard
            label="Lifetime Sales"
            value={allTimeTotals.totalSale}
            accent
            sub="Kitchen + Coffee Shop"
          />
          <StatCard
            label="Current Cash In Hand"
            value={latestCashInHand}
            accent={latestCashInHand >= 0}
            danger={latestCashInHand < 0}
            sub="Most recent entry"
          />
          <StatCard
            label="Net Cash In Hand (from start → today)"
            value={netProfit}
            accent={netProfit >= 0}
            danger={netProfit < 0}
            sub={`${profitDays} profit days · ${lossDays} loss days`}
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label={`Current Month (${displayMonth(currentMonthKey)}) Sales`}
            value={currentMonthTotals.totalSale}
            accent
            sub={`${currentMonthEntries.length} days`}
          />
          <StatCard
            label="Current Month Cash In Hand"
            value={currentMonthCashInHand}
            accent={currentMonthCashInHand >= 0}
            danger={currentMonthCashInHand < 0}
            sub="This month"
          />
          <StatCard
            label={`Current Year (${currentYear}) Sales`}
            value={currentYearTotals.totalSale}
            accent
            sub={`${currentYearEntries.length} days`}
          />
          <StatCard
            label="Current Year Cash In Hand"
            value={currentYearCashInHand}
            accent={currentYearCashInHand >= 0}
            danger={currentYearCashInHand < 0}
            sub="Year to date"
          />
        </div>

        {/* Cash flow pulse */}
        {daybooks.length > 1 && <CashFlowPulse points={pulsePoints} />}

        {daybooks.length === 0 ? (
          <div
            className="rounded-2xl border p-10 text-center"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
            }}
          >
            <p
              className="font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              No daybook entries yet
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Once the shop admin starts logging days, they'll show up here.
            </p>
          </div>
        ) : (
          <>
            {/* Month tabs */}
            <div
              className="flex items-center gap-1 border-b overflow-x-auto"
              style={{ borderColor: "var(--border)" }}
            >
              {months.map((mk) => (
                <button
                  key={mk}
                  onClick={() => setActiveMonth(mk)}
                  className="px-4 py-2.5 text-sm font-semibold whitespace-nowrap"
                  style={{
                    color:
                      activeMonth === mk
                        ? "var(--accent-text)"
                        : "var(--text-muted)",
                    borderBottom:
                      activeMonth === mk
                        ? "2px solid var(--accent)"
                        : "2px solid transparent",
                  }}
                >
                  {displayMonth(mk)}
                </button>
              ))}
            </div>

            {/* Month stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                label="Month Sales"
                value={monthTotals.totalSale}
                accent
                sub={`${monthEntries.length} days`}
              />
              <StatCard label="Kitchen" value={monthTotals.kitchenSale} />
              <StatCard label="Coffee Shop" value={monthTotals.coffeeShop} />
              <StatCard
                label="Month Cash In Hand"
                value={monthCashInHand}
                accent={monthCashInHand >= 0}
                danger={monthCashInHand < 0}
              />
            </div>

            {/* Ledger table */}
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
                    Daily Ledger — {displayMonth(activeMonth)}
                  </h3>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {filteredSorted.length} entries · click any figure for its
                    breakdown
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="Search date…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
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
                  style={{ minWidth: "1280px" }}
                >
                  <thead>
                    <tr style={{ background: "var(--bg-elevated)" }}>
                      {COLS.map((col) => (
                        <th
                          key={col.key}
                          onClick={() => handleSort(col.key)}
                          className="px-3 py-3 text-right first:text-left font-semibold text-xs uppercase tracking-wider cursor-pointer select-none border-b hover:opacity-80"
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
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSorted.length === 0 && (
                      <tr>
                        <td
                          colSpan={COLS.length}
                          className="text-center py-14"
                          style={{ color: "var(--text-muted)" }}
                        >
                          No entries for this search.
                        </td>
                      </tr>
                    )}
                    {filteredSorted.map((row, idx) => {
                      const negCash = row.cashInHand < 0;
                      return (
                        <tr
                          key={row._id || row.date}
                          className="border-b"
                          style={{
                            borderColor: "var(--border-sub)",
                            background:
                              idx % 2 === 0
                                ? "transparent"
                                : "var(--bg-elevated)",
                          }}
                        >
                          <td
                            className="px-3 py-3 font-medium whitespace-nowrap"
                            style={{ color: "var(--accent-text)" }}
                          >
                            {fmtDateShort(row.date)}
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
                          <td className="px-3 py-3 text-right">
                            <ClickCell
                              value={row.kitchenSale}
                              items={flattenSubTabs(row.kitchenSubTabs || [])}
                              onOpen={() =>
                                setBreakdownModal({
                                  title: "Kitchen Sale Breakdown",
                                  items: flattenSubTabs(
                                    row.kitchenSubTabs || [],
                                  ),
                                })
                              }
                            />
                          </td>
                          <td className="px-3 py-3 text-right">
                            <ClickCell
                              value={row.coffeeShop}
                              items={flattenSubTabs(row.coffeeSubTabs || [])}
                              onOpen={() =>
                                setBreakdownModal({
                                  title: "Coffee Shop Breakdown",
                                  items: flattenSubTabs(
                                    row.coffeeSubTabs || [],
                                  ),
                                })
                              }
                            />
                          </td>
                          <td
                            className="px-3 py-3 text-right tabular-nums font-semibold"
                            style={{ color: "var(--accent-text)" }}
                          >
                            {fmt(row.totalSale)}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <ClickCell
                              value={row.officialCr}
                              items={row.officialCrEntries || []}
                              onOpen={() =>
                                setBreakdownModal({
                                  title: "Official Credit Breakdown",
                                  items: row.officialCrEntries || [],
                                })
                              }
                            />
                          </td>
                          <td className="px-3 py-3 text-right">
                            <ClickCell
                              value={row.personalCr}
                              items={row.personalCrEntries || []}
                              onOpen={() =>
                                setBreakdownModal({
                                  title: "Personal Credit Breakdown",
                                  items: row.personalCrEntries || [],
                                })
                              }
                            />
                          </td>
                          <td
                            className="px-3 py-3 text-right tabular-nums"
                            style={{ color: "var(--text-sec)" }}
                          >
                            {fmt(row.upiReceived)}
                          </td>
                          <td
                            className="px-3 py-3 text-right tabular-nums"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {fmt(row.totalCash)}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <ClickCell
                              value={row.cashToOffice}
                              items={row.cashToOfficeEntries || []}
                              onOpen={() =>
                                setBreakdownModal({
                                  title: "Cash to Office Breakdown",
                                  items: row.cashToOfficeEntries || [],
                                })
                              }
                            />
                          </td>
                          <td className="px-3 py-3 text-right">
                            <ClickCell
                              value={row.cashExpenses}
                              items={Object.entries(
                                row.expenseEntries || {},
                              ).map(([k, v]) => ({ name: k, amount: v }))}
                              onOpen={() =>
                                setBreakdownModal({
                                  title: "Cash Expenses Breakdown",
                                  items: Object.entries(
                                    row.expenseEntries || {},
                                  ).map(([k, v]) => ({ name: k, amount: v })),
                                })
                              }
                            />
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums font-bold">
                            <Badge variant={negCash ? "negative" : "positive"}>
                              ₹{fmt(row.cashInHand)}
                            </Badge>
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
                        {fmt(monthTotals.kitchenSale)}
                      </td>
                      <td
                        className="px-3 py-3 text-right tabular-nums"
                        style={{ color: "var(--accent-text)" }}
                      >
                        {fmt(monthTotals.coffeeShop)}
                      </td>
                      <td
                        className="px-3 py-3 text-right tabular-nums"
                        style={{ color: "var(--accent-text)" }}
                      >
                        {fmt(monthTotals.totalSale)}
                      </td>
                      <td
                        className="px-3 py-3 text-right tabular-nums"
                        style={{ color: "var(--text-sec)" }}
                      >
                        {fmt(monthTotals.officialCr)}
                      </td>
                      <td
                        className="px-3 py-3 text-right tabular-nums"
                        style={{ color: "var(--text-sec)" }}
                      >
                        {fmt(monthTotals.personalCr)}
                      </td>
                      <td
                        className="px-3 py-3 text-right tabular-nums"
                        style={{ color: "var(--text-sec)" }}
                      >
                        {fmt(monthTotals.upiReceived)}
                      </td>
                      <td
                        className="px-3 py-3 text-right tabular-nums"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {fmt(monthTotals.totalCash)}
                      </td>
                      <td
                        className="px-3 py-3 text-right tabular-nums"
                        style={{ color: "var(--text-sec)" }}
                      >
                        {fmt(monthTotals.cashToOffice)}
                      </td>
                      <td
                        className="px-3 py-3 text-right tabular-nums"
                        style={{ color: "var(--danger-text)" }}
                      >
                        {fmt(monthTotals.cashExpenses)}
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
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

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
