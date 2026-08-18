import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import API from "../api/axios";
import { toast } from "react-toastify";

const fmt = (n) =>
  n === undefined || n === null || isNaN(n)
    ? "—"
    : new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
const fmtDateShort = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      })
    : "—";
const fmtDateFull = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

function Badge({ children, variant }) {
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

function EditPartnerModal({ partner, onClose, onSave, saving }) {
  const [name, setName] = useState(partner.name);
  const [note, setNote] = useState(partner.note || "");
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-2xl border"
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
            Edit Partner
          </h3>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}>
            ✕
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ name, note });
          }}
          className="p-6 space-y-3"
        >
          <div>
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: "var(--text-sec)" }}
            >
              Partner Name
            </label>
            <input
              required
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
              Note (optional)
            </label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
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

function DeletePartnerConfirm({ partner, onCancel, onConfirm }) {
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
          Delete {partner.name}?
        </h3>
        <p className="text-sm mb-5" style={{ color: "var(--text-sec)" }}>
          This permanently deletes the partner and every transaction logged
          against them. This can't be undone.
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

const todayStr = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
};

/* New-transaction modal with a site picker — lets you log an entry for any
   site (or Unassigned) right from this page, no need to drill into a
   site's own detail page first. */
function NewTransactionModal({
  shops,
  defaultShopId,
  onClose,
  onSave,
  saving,
}) {
  const [shopId, setShopId] = useState(
    defaultShopId || shops[0]?.shopId || "unassigned",
  );
  const [date, setDate] = useState(todayStr());
  const [type, setType] = useState("receive");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    onSave({ shop: shopId, date, type, amount: Number(amount), note });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="rounded-2xl w-full max-w-sm border"
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
            New Transaction
          </h3>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: "var(--text-sec)" }}
            >
              Site
            </label>
            <select
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            >
              {shops.map((s) => (
                <option key={s.shopId} value={s.shopId}>
                  {s.shopName}
                </option>
              ))}
            </select>
          </div>
          <div
            className="flex rounded-lg overflow-hidden border"
            style={{ borderColor: "var(--border)" }}
          >
            <button
              type="button"
              onClick={() => setType("receive")}
              className="flex-1 px-3 py-2 text-xs font-semibold"
              style={{
                background:
                  type === "receive" ? "#22c55e" : "var(--bg-elevated)",
                color: type === "receive" ? "#fff" : "var(--text-sec)",
              }}
            >
              Receive (in)
            </button>
            <button
              type="button"
              onClick={() => setType("transfer")}
              className="flex-1 px-3 py-2 text-xs font-semibold"
              style={{
                background:
                  type === "transfer"
                    ? "var(--danger-text)"
                    : "var(--bg-elevated)",
                color: type === "transfer" ? "#fff" : "var(--text-sec)",
              }}
            >
              Transfer (out)
            </button>
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: "var(--text-sec)" }}
            >
              Date
            </label>
            <input
              type="date"
              required
              max={todayStr()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
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
              Amount
            </label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
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
              Note (optional)
            </label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
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
              {saving ? "Saving…" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteTxnConfirm({ onCancel, onConfirm }) {
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
          Delete this transaction?
        </h3>
        <p className="text-sm mb-5" style={{ color: "var(--text-sec)" }}>
          This can't be undone.
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

/* One site's full transaction history — a heading strip + a table */
function SiteTransactionBlock({ site, onDeleteTxn }) {
  const positive = (site.netBalance || 0) >= 0;
  const isUnassigned = site.shopId === "unassigned";

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow)",
        opacity: isUnassigned ? 0.9 : 1,
      }}
    >
      <div
        className="flex items-center justify-between flex-wrap gap-2 px-5 py-3 border-b"
        style={{
          borderColor: "var(--border-sub)",
          background: "var(--bg-elevated)",
        }}
      >
        <div className="flex items-center gap-2">
          <h4
            className="font-bold text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            {site.shopName}
          </h4>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {site.transactionCount} txns · last{" "}
            {fmtDateShort(site.lastTransactionDate)}
          </span>
        </div>
        <span
          className="text-xs font-semibold px-2 py-1 rounded-full"
          style={{
            background: positive ? "rgba(34,197,94,0.1)" : "var(--danger-soft)",
            color: positive ? "#22c55e" : "var(--danger-text)",
            border: `1px solid ${positive ? "rgba(34,197,94,0.2)" : "var(--danger-border)"}`,
          }}
        >
          Net {positive ? "▲" : "▼"} ₹{fmt(Math.abs(site.netBalance || 0))} ·
          Received ₹{fmt(site.received)} · Payment ₹{fmt(site.transferred)}
        </span>
      </div>

      {site.transactions.length === 0 ? (
        <p
          className="text-center py-6 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          No transactions yet for this site.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: "var(--bg-elevated)" }}>
                <th
                  className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider border-b"
                  style={{
                    borderColor: "var(--border-sub)",
                    color: "var(--text-muted)",
                  }}
                >
                  Date
                </th>
                <th
                  className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider border-b"
                  style={{
                    borderColor: "var(--border-sub)",
                    color: "var(--text-muted)",
                  }}
                >
                  Type
                </th>
                <th
                  className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider border-b"
                  style={{
                    borderColor: "var(--border-sub)",
                    color: "var(--text-muted)",
                  }}
                >
                  Note
                </th>
                <th
                  className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider border-b"
                  style={{
                    borderColor: "var(--border-sub)",
                    color: "var(--text-muted)",
                  }}
                >
                  Amount
                </th>
                <th
                  className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider border-b"
                  style={{
                    borderColor: "var(--border-sub)",
                    color: "var(--text-muted)",
                  }}
                ></th>
              </tr>
            </thead>
            <tbody>
              {site.transactions.map((t, idx) => (
                <tr
                  key={t._id}
                  className="border-b"
                  style={{
                    borderColor: "var(--border-sub)",
                    background:
                      idx % 2 === 0 ? "transparent" : "var(--bg-elevated)",
                  }}
                >
                  <td
                    className="px-4 py-2.5 font-medium"
                    style={{ color: "var(--accent-text)" }}
                  >
                    {fmtDateFull(t.date)}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge
                      variant={t.type === "receive" ? "positive" : "negative"}
                    >
                      {t.type === "receive" ? "Received" : "Transferred"}
                    </Badge>
                  </td>
                  <td
                    className="px-4 py-2.5 text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {t.note || "—"}
                  </td>
                  <td
                    className="px-4 py-2.5 text-right font-semibold tabular-nums"
                    style={{
                      color:
                        t.type === "receive" ? "#22c55e" : "var(--danger-text)",
                    }}
                  >
                    ₹{fmt(t.amount)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => onDeleteTxn(t)}
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function PartnerShopsView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState(null);
  const [shops, setShops] = useState([]);
  const [allTimeTotals, setAllTimeTotals] = useState({
    received: 0,
    transferred: 0,
    netBalance: 0,
  });
  const [showEditPartner, setShowEditPartner] = useState(false);
  const [showDeletePartner, setShowDeletePartner] = useState(false);
  const [savingPartner, setSavingPartner] = useState(false);
  const [deleteTxnTarget, setDeleteTxnTarget] = useState(null);
  const [siteFilter, setSiteFilter] = useState("all");
  const [showNewTxn, setShowNewTxn] = useState(false);
  const [newTxnDefaultShop, setNewTxnDefaultShop] = useState(null);
  const [savingTxn, setSavingTxn] = useState(false);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/partners/${id}/overview`);
      setPartner(data.data.partner);
      setShops(data.data.shops || []);
      setAllTimeTotals(
        data.data.allTimeTotals || {
          received: 0,
          transferred: 0,
          netBalance: 0,
        },
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load partner");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [id]); // eslint-disable-line

  const handleSavePartner = async (form) => {
    try {
      setSavingPartner(true);
      await API.put(`/partners/${id}`, form);
      toast.success("Partner updated");
      setShowEditPartner(false);
      fetchOverview();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update partner");
    } finally {
      setSavingPartner(false);
    }
  };

  const handleDeletePartner = async () => {
    try {
      await API.delete(`/partners/${id}`);
      toast.success("Partner deleted");
      navigate("/superadmin?tab=partners");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete partner");
      setShowDeletePartner(false);
    }
  };

  const handleSaveTxn = async (form) => {
    try {
      setSavingTxn(true);
      await API.post(`/partners/${id}/transactions`, form);
      toast.success("Transaction added");
      setShowNewTxn(false);
      fetchOverview();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add transaction");
    } finally {
      setSavingTxn(false);
    }
  };

  const handleDeleteTxn = async () => {
    try {
      await API.delete(`/partners/${id}/transactions/${deleteTxnTarget._id}`);
      toast.success("Transaction deleted");
      fetchOverview();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to delete transaction",
      );
    } finally {
      setDeleteTxnTarget(null);
    }
  };

  if (loading && !partner) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-base)" }}
      >
        <p style={{ color: "var(--text-muted)" }}>Loading…</p>
      </div>
    );
  }
  if (!partner) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3"
        style={{ background: "var(--bg-base)" }}
      >
        <p style={{ color: "var(--danger-text)" }}>Partner not found</p>
        <button
          onClick={() => navigate("/superadmin?tab=partners")}
          className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          ← Back
        </button>
      </div>
    );
  }

  const positiveTotal = (allTimeTotals.netBalance || 0) >= 0;
  const visibleShops =
    siteFilter === "all" ? shops : shops.filter((s) => s.shopId === siteFilter);

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
          <button
            onClick={() => navigate("/superadmin?tab=partners")}
            className="w-8 h-8 rounded-lg flex items-center justify-center border text-lg font-bold"
            style={{
              borderColor: "var(--border)",
              background: "var(--bg-elevated)",
              color: "var(--text-sec)",
            }}
          >
            ←
          </button>
          <p
            className="text-sm font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {partner.name}
          </p>
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

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1
              className="text-xl font-black"
              style={{ color: "var(--text-primary)" }}
            >
              {partner.name}
            </h1>
            {partner.note && (
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                {partner.note}
              </p>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => {
                setNewTxnDefaultShop(null);
                setShowNewTxn(true);
              }}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: "var(--accent)" }}
            >
              + New Transaction
            </button>
            <button
              onClick={() => setShowEditPartner(true)}
              className="px-3 py-2 rounded-xl text-sm font-medium border"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-sec)",
                background: "var(--bg-elevated)",
              }}
            >
              Edit
            </button>
            <button
              onClick={() => setShowDeletePartner(true)}
              className="px-3 py-2 rounded-xl text-sm font-medium border"
              style={{
                borderColor: "var(--danger-border)",
                color: "var(--danger-text)",
                background: "var(--danger-soft)",
              }}
            >
              Delete Partner
            </button>
          </div>
        </div>

        {/* All-time totals across every site */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            className="rounded-2xl px-5 py-4 border"
            style={{
              background: "rgba(34,197,94,0.05)",
              borderColor: "rgba(34,197,94,0.3)",
              boxShadow: "var(--shadow)",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#22c55e" }}
            >
              Total Received
            </p>
            <p
              className="text-2xl font-black mt-1 tabular-nums"
              style={{ color: "#22c55e" }}
            >
              ₹{fmt(allTimeTotals.received)}
            </p>
          </div>
          <div
            className="rounded-2xl px-5 py-4 border"
            style={{
              background: "var(--danger-soft)",
              borderColor: "var(--danger-border)",
              boxShadow: "var(--shadow)",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--danger-text)" }}
            >
              Total Transferred
            </p>
            <p
              className="text-2xl font-black mt-1 tabular-nums"
              style={{ color: "var(--danger-text)" }}
            >
              ₹{fmt(allTimeTotals.transferred)}
            </p>
          </div>
          <div
            className="rounded-2xl px-5 py-4 border"
            style={{
              background: positiveTotal
                ? "rgba(34,197,94,0.05)"
                : "var(--danger-soft)",
              borderColor: positiveTotal
                ? "rgba(34,197,94,0.3)"
                : "var(--danger-border)",
              boxShadow: "var(--shadow)",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{
                color: positiveTotal ? "#22c55e" : "var(--danger-text)",
              }}
            >
              Net Balance
            </p>
            <p
              className="text-2xl font-black mt-1 tabular-nums"
              style={{
                color: positiveTotal ? "#22c55e" : "var(--danger-text)",
              }}
            >
              ₹{fmt(allTimeTotals.netBalance)}
            </p>
          </div>
        </div>

        {/* Every shop/site as a card — including ones with zero activity */}
        <div>
          <h3
            className="font-bold text-sm mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            All Sites
          </h3>
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            Every site in the system. Tap a card to jump to its day-wise ledger
            below, or open its dedicated month-filterable page.
          </p>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border p-5 animate-pulse"
                  style={{
                    background: "var(--bg-surface)",
                    borderColor: "var(--border)",
                    height: "150px",
                  }}
                />
              ))}
            </div>
          ) : shops.length === 0 ? (
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
                No sites found
              </p>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                Add a shop/site first.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shops.map((s) => {
                const positive = (s.netBalance || 0) >= 0;
                const isUnassigned = s.shopId === "unassigned";
                return (
                  <div
                    key={s.shopId}
                    className="rounded-2xl border p-5 flex flex-col gap-3"
                    style={{
                      background: "var(--bg-surface)",
                      borderColor: isUnassigned
                        ? "var(--border-sub)"
                        : "var(--border)",
                      boxShadow: "var(--shadow)",
                      opacity: isUnassigned ? 0.85 : 1,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className="font-bold text-base truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {s.shopName}
                      </h3>
                      <span
                        className="shrink-0 text-xs font-semibold px-2 py-1 rounded-full"
                        style={{
                          background: positive
                            ? "rgba(34,197,94,0.1)"
                            : "var(--danger-soft)",
                          color: positive ? "#22c55e" : "var(--danger-text)",
                          border: `1px solid ${positive ? "rgba(34,197,94,0.2)" : "var(--danger-border)"}`,
                        }}
                      >
                        {positive ? "▲" : "▼"} ₹
                        {fmt(Math.abs(s.netBalance || 0))}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div
                        className="rounded-xl px-3 py-2"
                        style={{ background: "var(--bg-elevated)" }}
                      >
                        <p
                          className="text-[10px] uppercase tracking-wider font-semibold"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Received
                        </p>
                        <p
                          className="text-sm font-bold mt-0.5 tabular-nums"
                          style={{ color: "#22c55e" }}
                        >
                          ₹{fmt(s.received)}
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
                          Payment
                        </p>
                        <p
                          className="text-sm font-bold mt-0.5 tabular-nums"
                          style={{ color: "var(--danger-text)" }}
                        >
                          ₹{fmt(s.transferred)}
                        </p>
                      </div>
                    </div>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {s.transactionCount} txns · last{" "}
                      {fmtDateShort(s.lastTransactionDate)}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSiteFilter(s.shopId)}
                        className="flex-1 text-xs px-3 py-2 rounded-lg font-semibold text-white"
                        style={{ background: "var(--accent)" }}
                      >
                        Jump to Ledger ↓
                      </button>
                      <button
                        onClick={() => {
                          setNewTxnDefaultShop(s.shopId);
                          setShowNewTxn(true);
                        }}
                        className="text-xs px-3 py-2 rounded-lg border font-medium"
                        style={{
                          borderColor: "var(--border)",
                          color: "var(--text-sec)",
                          background: "var(--bg-elevated)",
                        }}
                      >
                        + Add Here
                      </button>
                      <button
                        onClick={() =>
                          navigate(
                            `/superadmin/partners/${id}/shops/${s.shopId}`,
                          )
                        }
                        className="text-xs px-3 py-2 rounded-lg border font-medium"
                        style={{
                          borderColor: "var(--border)",
                          color: "var(--text-sec)",
                          background: "var(--bg-elevated)",
                        }}
                      >
                        Month View →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Full transaction history, grouped per site */}
        <div>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div>
              <h3
                className="font-bold text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                Transactions — By Site
              </h3>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                Complete history, every site, oldest activity first.
              </p>
            </div>
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border outline-none"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
                color: "var(--text-sec)",
              }}
            >
              <option value="all">All Sites</option>
              {shops.map((s) => (
                <option key={s.shopId} value={s.shopId}>
                  {s.shopName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            {visibleShops.map((s) => (
              <SiteTransactionBlock
                key={s.shopId}
                site={s}
                onDeleteTxn={setDeleteTxnTarget}
              />
            ))}
          </div>
        </div>
      </main>

      {showNewTxn && (
        <NewTransactionModal
          shops={shops}
          defaultShopId={newTxnDefaultShop}
          saving={savingTxn}
          onClose={() => setShowNewTxn(false)}
          onSave={handleSaveTxn}
        />
      )}
      {showEditPartner && (
        <EditPartnerModal
          partner={partner}
          saving={savingPartner}
          onClose={() => setShowEditPartner(false)}
          onSave={handleSavePartner}
        />
      )}
      {showDeletePartner && (
        <DeletePartnerConfirm
          partner={partner}
          onCancel={() => setShowDeletePartner(false)}
          onConfirm={handleDeletePartner}
        />
      )}
      {deleteTxnTarget && (
        <DeleteTxnConfirm
          onCancel={() => setDeleteTxnTarget(null)}
          onConfirm={handleDeleteTxn}
        />
      )}
    </div>
  );
}
