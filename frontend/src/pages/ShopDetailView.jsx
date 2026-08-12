import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { toast } from "react-toastify";
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

const fmt = (n) =>
  n === undefined || n === null || isNaN(n)
    ? "—"
    : new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
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

function StatCard({
  label,
  value,
  sub,
  accent,
  danger,
  prefix = "₹",
  loading,
}) {
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
      {loading ? (
        <span
          className="h-7 w-20 rounded-md animate-pulse block"
          style={{ background: "var(--bg-elevated)" }}
        />
      ) : (
        <span className="text-2xl font-black tabular-nums" style={{ color }}>
          {prefix}
          {fmt(value)}
        </span>
      )}
      {sub && !loading && (
        <span className="text-xs" style={{ color: "var(--text-sec)" }}>
          {sub}
        </span>
      )}
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

/* ─── AdminEditModal — change a site admin's name / email / password ──────── */
function AdminEditModal({ shopId, admin, onClose, onSaved }) {
  const [name, setName] = useState(admin.name || "");
  const [email, setEmail] = useState(admin.email || "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = { name, email };
      if (password) payload.password = password;
      const { data } = await API.put(
        `/shops/${shopId}/admin/${admin._id}`,
        payload,
      );
      if (data.success) {
        toast.success("Admin details updated");
        onSaved(data.data.user);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update admin");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl border"
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
            Edit Admin — {admin.name}
          </h3>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-3">
          <div>
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: "var(--text-sec)" }}
            >
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: "var(--text-sec)" }}
            >
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: "var(--text-sec)" }}
            >
              New Password{" "}
              <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                (leave blank to keep current)
              </span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
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
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
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
  const [editingAdmin, setEditingAdmin] = useState(null);

  // P&L stats keyed by month ("YYYY-MM"), so switching tabs doesn't
  // re-fetch a month you've already looked at.
  const [monthStatsCache, setMonthStatsCache] = useState({});
  const [monthStatsLoading, setMonthStatsLoading] = useState(false);

  const [activeMonth, setActiveMonth] = useState(currentMonthKey);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [breakdownModal, setBreakdownModal] = useState(null);

  const fetchShop = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await API.get(`/shops/${id}`);
      if (!data.success) throw new Error(data.message || "Failed to load shop");
      setShop(data.data.shop);
      setAdmins(data.data.admins || []);
      const books = (data.data.daybooks || [])
        .map((e) => ({
          ...e,
          coffeeShop: e.coffeeShop ?? e.coffeeShopSale ?? 0,
          cashInHand:
            e.cashInHand ??
            (e.totalCash || 0) - (e.cashExpenses || 0) - (e.cashToOffice || 0),
          expenseEntries: normalizeExpenses(e.expenseEntries),
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      setDaybooks(books);

      // getShop already computes the real current month's stats — seed the
      // cache with it so the default view doesn't need a second round trip.
      if (data.data.currentMonthStats) {
        setMonthStatsCache((p) => ({
          ...p,
          [currentMonthKey]: data.data.currentMonthStats,
        }));
      }
      setActiveMonth(currentMonthKey);
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Failed to load shop",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Whenever the selected month tab changes, fetch that month's P&L stats
  // unless we already have them cached.
  useEffect(() => {
    if (!activeMonth || loading) return;
    if (monthStatsCache[activeMonth]) return;
    let cancelled = false;
    (async () => {
      try {
        setMonthStatsLoading(true);
        const { data } = await API.get(`/shops/${id}/pnl`, {
          params: { month: activeMonth },
        });
        if (!cancelled && data.success) {
          setMonthStatsCache((p) => ({ ...p, [activeMonth]: data.data }));
        }
      } catch {
        // stats panel just falls back to zeros for this month
      } finally {
        if (!cancelled) setMonthStatsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMonth, loading, id]);

  const months = useMemo(() => {
    const set = new Set(
      daybooks.map((e) => {
        const d = new Date(e.date);
        return toMonthKey(d.getFullYear(), d.getMonth() + 1);
      }),
    );
    // Always offer the real current month, even with zero entries logged yet.
    set.add(currentMonthKey);
    return Array.from(set).sort().reverse();
  }, [daybooks]);

  const monthEntries = useMemo(
    () =>
      daybooks.filter((e) => {
        const d = new Date(e.date);
        return toMonthKey(d.getFullYear(), d.getMonth() + 1) === activeMonth;
      }),
    [daybooks, activeMonth],
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

  const selectedStats = monthStatsCache[activeMonth];
  const statsLoading = !selectedStats || monthStatsLoading;
  const plPositive = (selectedStats?.profitLoss || 0) >= 0;
  const isCurrentMonth = activeMonth === currentMonthKey;

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
        {/* Shop identity + admins (click an admin to edit email/password) */}
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
              <button
                key={a._id}
                onClick={() => setEditingAdmin(a)}
                className="text-xs px-3 py-1.5 rounded-full border font-medium hover:opacity-80"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--bg-elevated)",
                  color: "var(--text-sec)",
                }}
                title="Click to edit email / password"
              >
                {a.name} · {a.email} ·{" "}
                <span style={{ color: "var(--accent-text)" }}>{a.role}</span>{" "}
                <span style={{ color: "var(--text-muted)" }}>✎</span>
              </button>
            ))}
          </div>
        </div>

        {/* Month tabs — pick a month, everything below (P&L + ledger) follows it */}
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
              {mk === currentMonthKey ? " · Current" : ""}
            </button>
          ))}
        </div>

        {/* P&L snapshot for the selected month */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3
              className="font-bold text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              {isCurrentMonth ? "This Month" : "Selected Month"} (
              {displayMonth(activeMonth)})
            </h3>
            {!statsLoading && (
              <Badge variant={plPositive ? "positive" : "negative"}>
                P&amp;L: ₹{fmt(selectedStats?.profitLoss)}
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <StatCard
              label="Profit & Loss"
              value={selectedStats?.profitLoss}
              accent={plPositive}
              danger={!plPositive}
              sub="Sale + Bill + UPI − Cr − Salary − Exp."
              loading={statsLoading}
            />
            <StatCard
              label="Total Sale"
              value={selectedStats?.totalSale}
              accent
              loading={statsLoading}
            />
            <StatCard
              label="Patient Bill"
              value={selectedStats?.patientBill}
              accent
              loading={statsLoading}
            />
            <StatCard
              label="Salary"
              value={selectedStats?.salary}
              danger
              loading={statsLoading}
            />
            <StatCard
              label="Expense"
              value={selectedStats?.cashExpenses}
              danger
              loading={statsLoading}
            />
            <StatCard
              label="Cash to Office"
              value={selectedStats?.cashToOffice}
              loading={statsLoading}
            />
          </div>
        </div>

        {/* Month stat cards (from the daybook itself) */}
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

        {/* Ledger table — complete day-wise detail for the selected month */}
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
                      {search
                        ? "No entries match your search."
                        : `No entries logged for ${displayMonth(activeMonth)} yet.`}
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
                          idx % 2 === 0 ? "transparent" : "var(--bg-elevated)",
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
                              items: flattenSubTabs(row.kitchenSubTabs || []),
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
                              items: flattenSubTabs(row.coffeeSubTabs || []),
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
                          items={Object.entries(row.expenseEntries || {}).map(
                            ([k, v]) => ({ name: k, amount: v }),
                          )}
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
                      variant={monthCashInHand >= 0 ? "positive" : "negative"}
                    >
                      ₹{fmt(monthCashInHand)}
                    </Badge>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </main>

      {breakdownModal && (
        <BreakdownModal
          title={breakdownModal.title}
          items={breakdownModal.items}
          onClose={() => setBreakdownModal(null)}
        />
      )}

      {editingAdmin && (
        <AdminEditModal
          shopId={shop._id}
          admin={editingAdmin}
          onClose={() => setEditingAdmin(null)}
          onSaved={(updated) => {
            setAdmins((p) =>
              p.map((a) => (a._id === updated._id ? { ...a, ...updated } : a)),
            );
            setEditingAdmin(null);
          }}
        />
      )}
    </div>
  );
}
