import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../api/axios";
import { useTheme } from "../context/ThemeContext";
import Partners from "./Partners";
import LedgerTab from "./LedgerTab";
import ProfitLossView from "./ProfitLossView";

const fmt = (n) =>
  n === undefined || n === null || isNaN(n)
    ? "—"
    : new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      })
    : "—";

const EMPTY_FORM = {
  name: "",
  address: "",
  contact: "",
  adminEmail: "",
  adminPassword: "",
};

const TABS = [
  { key: "shops", label: "Shops" },
  { key: "partners", label: "Partners" },
  { key: "salary", label: "Salary" },
  { key: "adminExpense", label: "Admin Expense" },
  { key: "patientBill", label: "Patient Bill" },
  { key: "pnl", label: "Profit & Loss" },
];

/* ─── Create / Edit shop modal ────────────────────────────────────────────── */
function ShopFormModal({ initial, onClose, onSubmit, saving }) {
  const isEdit = !!initial?._id;
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

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
            {isEdit ? "Edit Shop" : "Add New Shop"}
          </h3>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}>
            ✕
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(form);
          }}
          className="p-6 space-y-3"
        >
          <div>
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: "var(--text-sec)" }}
            >
              Shop Name
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Anand Trauma Centre"
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
              Address
            </label>
            <input
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Optional"
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
              Contact
            </label>
            <input
              value={form.contact}
              onChange={(e) => set("contact", e.target.value)}
              placeholder="Optional"
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {!isEdit && (
            <div
              className="pt-2 mt-2 border-t space-y-3"
              style={{ borderColor: "var(--border-sub)" }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                Assign Shop Admin (optional)
              </p>
              <input
                value={form.adminEmail}
                onChange={(e) => set("adminEmail", e.target.value)}
                placeholder="Admin email"
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              />
              <input
                value={form.adminPassword}
                onChange={(e) => set("adminPassword", e.target.value)}
                placeholder="Admin password"
                type="password"
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          )}

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
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Shop"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Delete confirmation ─────────────────────────────────────────────────── */
function DeleteShopModal({ shop, onCancel, onConfirm }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.6)" }}
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
          Delete {shop.name}?
        </h3>
        <p className="text-sm mb-5" style={{ color: "var(--text-sec)" }}>
          This permanently deletes the shop, unassigns its admins, and erases
          every daybook entry logged for it. This can't be undone.
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

/* ─── Shop card ───────────────────────────────────────────────────────────── */
function ShopCard({ shop, onView, onEdit, onDelete }) {
  const positive = (shop.netProfit || 0) >= 0;
  return (
    <div
      onClick={onView}
      className="rounded-2xl border p-5 flex flex-col gap-4 cursor-pointer transition-transform hover:-translate-y-0.5"
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow)",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3
            className="font-bold text-base truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {shop.name}
          </h3>
          <p
            className="text-xs mt-0.5 truncate"
            style={{ color: "var(--text-muted)" }}
          >
            {shop.address || "No address on file"}
          </p>
        </div>
        <span
          className="shrink-0 text-xs font-semibold px-2 py-1 rounded-full"
          style={{
            background: positive ? "rgba(34,197,94,0.1)" : "var(--danger-soft)",
            color: positive ? "#22c55e" : "var(--danger-text)",
            border: `1px solid ${positive ? "rgba(34,197,94,0.2)" : "var(--danger-border)"}`,
          }}
        >
          {positive ? "▲" : "▼"} ₹{fmt(Math.abs(shop.netProfit || 0))}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div
          className="rounded-xl px-3 py-2"
          style={{ background: "var(--bg-elevated)" }}
        >
          <p
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: "var(--text-muted)" }}
          >
            Cash In Hand
          </p>
          <p
            className="text-sm font-bold mt-0.5 tabular-nums"
            style={{ color: "var(--text-primary)" }}
          >
            ₹{fmt(shop.cashInHand)}
          </p>
        </div>
        <div
          className="rounded-xl px-3 py-2"
          style={{ background: "var(--bg-elevated)" }}
        >
          <p
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: "var(--text-muted)" }}
          >
            Total Sale
          </p>
          <p
            className="text-sm font-bold mt-0.5 tabular-nums"
            style={{ color: "var(--accent-text)" }}
          >
            ₹{fmt(shop.totalSale)}
          </p>
        </div>
        <div
          className="rounded-xl px-3 py-2"
          style={{ background: "var(--bg-elevated)" }}
        >
          <p
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: "var(--text-muted)" }}
          >
            Entries
          </p>
          <p
            className="text-sm font-bold mt-0.5 tabular-nums"
            style={{ color: "var(--text-primary)" }}
          >
            {shop.entryCount}
          </p>
        </div>
      </div>

      <div
        className="flex items-center justify-between text-xs"
        style={{ color: "var(--text-muted)" }}
      >
        <span>
          {shop.adminCount} admin{shop.adminCount === 1 ? "" : "s"} · last entry{" "}
          {fmtDate(shop.lastEntryDate)}
        </span>
      </div>

      <div
        className="flex gap-2 pt-2 border-t"
        style={{ borderColor: "var(--border-sub)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onView}
          className="flex-1 text-xs px-3 py-2 rounded-lg font-semibold text-white"
          style={{ background: "var(--accent)" }}
        >
          View Details →
        </button>
        <button
          onClick={onEdit}
          className="text-xs px-3 py-2 rounded-lg border font-medium"
          style={{
            borderColor: "var(--border)",
            color: "var(--text-sec)",
            background: "var(--bg-elevated)",
          }}
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="text-xs px-3 py-2 rounded-lg border font-medium"
          style={{
            borderColor: "var(--danger-border)",
            color: "var(--danger-text)",
            background: "var(--danger-soft)",
          }}
        >
          Del
        </button>
      </div>
    </div>
  );
}

/* ─── Shops tab content ───────────────────────────────────────────────────── */
function ShopsTab({ navigate }) {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/shops");
      setShops(data.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load shops");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const filtered = useMemo(
    () =>
      shops.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())),
    [shops, search],
  );

  const overview = useMemo(
    () =>
      shops.reduce(
        (a, s) => ({
          totalShops: a.totalShops + 1,
          totalAdmins: a.totalAdmins + (s.adminCount || 0),
          totalSale: a.totalSale + (s.totalSale || 0),
          totalCashInHand: a.totalCashInHand + (s.cashInHand || 0),
        }),
        { totalShops: 0, totalAdmins: 0, totalSale: 0, totalCashInHand: 0 },
      ),
    [shops],
  );

  const handleSubmit = async (form) => {
    try {
      setSaving(true);
      if (editingShop) {
        await API.put(`/shops/${editingShop._id}`, {
          name: form.name,
          address: form.address,
          contact: form.contact,
        });
        toast.success("Shop updated");
      } else {
        await API.post("/shops", form);
        toast.success("Shop created");
      }
      setShowForm(false);
      setEditingShop(null);
      fetchShops();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save shop");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/shops/${deleteTarget._id}`);
      toast.success("Shop deleted");
      fetchShops();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete shop");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="rounded-2xl px-5 py-4 border"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow)",
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Shops
          </p>
          <p
            className="text-2xl font-black mt-1"
            style={{ color: "var(--text-primary)" }}
          >
            {overview.totalShops}
          </p>
        </div>
        <div
          className="rounded-2xl px-5 py-4 border"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow)",
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Total Admins
          </p>
          <p
            className="text-2xl font-black mt-1"
            style={{ color: "var(--text-primary)" }}
          >
            {overview.totalAdmins}
          </p>
        </div>
        <div
          className="rounded-2xl px-5 py-4 border"
          style={{
            background: "var(--accent-soft)",
            borderColor: "var(--accent-border)",
            boxShadow: "var(--shadow)",
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--accent-text)" }}
          >
            Combined Lifetime Sales
          </p>
          <p
            className="text-2xl font-black mt-1 tabular-nums"
            style={{ color: "var(--accent-text)" }}
          >
            ₹{fmt(overview.totalSale)}
          </p>
        </div>
        <div
          className="rounded-2xl px-5 py-4 border"
          style={{
            background:
              overview.totalCashInHand >= 0
                ? "rgba(34,197,94,0.05)"
                : "var(--danger-soft)",
            borderColor:
              overview.totalCashInHand >= 0
                ? "rgba(34,197,94,0.3)"
                : "var(--danger-border)",
            boxShadow: "var(--shadow)",
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{
              color:
                overview.totalCashInHand >= 0
                  ? "#22c55e"
                  : "var(--danger-text)",
            }}
          >
            Combined Cash In Hand
          </p>
          <p
            className="text-2xl font-black mt-1 tabular-nums"
            style={{
              color:
                overview.totalCashInHand >= 0
                  ? "#22c55e"
                  : "var(--danger-text)",
            }}
          >
            ₹{fmt(overview.totalCashInHand)}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <input
          type="text"
          placeholder="Search shops…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-sm px-4 py-2.5 rounded-xl border outline-none w-full sm:w-64"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
        />
        <button
          onClick={() => {
            setEditingShop(null);
            setShowForm(true);
          }}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white whitespace-nowrap"
          style={{ background: "var(--accent)" }}
        >
          + Add Shop
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border p-5 animate-pulse"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border)",
                height: "220px",
              }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-2xl border p-10 text-center"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
          }}
        >
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
            {shops.length === 0 ? "No shops yet" : "No shops match your search"}
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {shops.length === 0
              ? "Add your first shop to get started."
              : "Try a different search term."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((shop) => (
            <ShopCard
              key={shop._id}
              shop={shop}
              onView={() => navigate(`/superadmin/shops/${shop._id}`)}
              onEdit={() => {
                setEditingShop(shop);
                setShowForm(true);
              }}
              onDelete={() => setDeleteTarget(shop)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <ShopFormModal
          initial={editingShop}
          saving={saving}
          onClose={() => {
            setShowForm(false);
            setEditingShop(null);
          }}
          onSubmit={handleSubmit}
        />
      )}
      {deleteTarget && (
        <DeleteShopModal
          shop={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN — SuperAdminDashboard
══════════════════════════════════════════════════════════════════════════ */
export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("shops");

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
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
              Super Admin
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Every shop, every detail
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

      {/* Section tab bar */}
      <div
        className="sticky top-[57px] z-20 border-b overflow-x-auto"
        style={{ background: "var(--bg-base)", borderColor: "var(--border)" }}
      >
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 flex items-center gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="px-4 py-2.5 text-sm font-semibold whitespace-nowrap"
              style={{
                color:
                  activeTab === t.key
                    ? "var(--accent-text)"
                    : "var(--text-muted)",
                borderBottom:
                  activeTab === t.key
                    ? "2px solid var(--accent)"
                    : "2px solid transparent",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === "shops" && <ShopsTab navigate={navigate} />}
        {activeTab === "partners" && <Partners />}
        {activeTab === "salary" && (
          <LedgerTab
            kind="salary"
            title="Salary"
            accentLabel="Staff salary payouts"
          />
        )}
        {activeTab === "adminExpense" && (
          <LedgerTab
            kind="adminExpense"
            title="Admin Expense"
            accentLabel="Business overhead expenses"
          />
        )}
        {activeTab === "patientBill" && (
          <LedgerTab
            kind="patientBill"
            title="Patient Bill"
            accentLabel="Patient billing income"
          />
        )}
        {activeTab === "pnl" && <ProfitLossView />}
      </main>
    </div>
  );
}
