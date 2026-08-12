import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import API from "../api/axios";
import { toast } from "react-toastify";

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
const todayStr = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
};
const fmt = (n) =>
  n === undefined || n === null || isNaN(n)
    ? "—"
    : new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
const fmtDateShort = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

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

function TransactionModal({ onClose, onSave }) {
  const [date, setDate] = useState(todayStr());
  const [type, setType] = useState("receive");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    onSave({ date, type, amount: Number(amount), note });
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
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: "var(--accent)" }}
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PartnerDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const today = new Date();
  const currentMonthKey = toMonthKey(today.getFullYear(), today.getMonth() + 1);

  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [activeMonth, setActiveMonth] = useState(currentMonthKey);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showEditPartner, setShowEditPartner] = useState(false);
  const [showDeletePartner, setShowDeletePartner] = useState(false);
  const [savingPartner, setSavingPartner] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/partners/${id}`);
      setPartner(data.data.partner);
      setTransactions(data.data.transactions || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load partner");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]); // eslint-disable-line

  const months = useMemo(() => {
    const set = new Set(
      transactions.map((t) => {
        const d = new Date(t.date);
        return toMonthKey(d.getFullYear(), d.getMonth() + 1);
      }),
    );
    set.add(currentMonthKey); // always show current month even with no data yet
    return Array.from(set).sort().reverse();
  }, [transactions, currentMonthKey]);

  const totals = transactions.reduce(
    (a, t) => ({
      received: a.received + (t.type === "receive" ? t.amount : 0),
      transferred: a.transferred + (t.type === "transfer" ? t.amount : 0),
    }),
    { received: 0, transferred: 0 },
  );
  const netBalance = totals.received - totals.transferred;

  const monthTxns = transactions
    .filter((t) => {
      const d = new Date(t.date);
      return toMonthKey(d.getFullYear(), d.getMonth() + 1) === activeMonth;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const monthTotals = monthTxns.reduce(
    (a, t) => ({
      received: a.received + (t.type === "receive" ? t.amount : 0),
      transferred: a.transferred + (t.type === "transfer" ? t.amount : 0),
    }),
    { received: 0, transferred: 0 },
  );

  const handleAdd = async (form) => {
    try {
      await API.post(`/partners/${id}/transactions`, form);
      toast.success("Transaction added");
      setShowModal(false);
      fetchDetail();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add transaction");
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/partners/${id}/transactions/${deleteTarget._id}`);
      toast.success("Transaction deleted");
      fetchDetail();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to delete transaction",
      );
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSavePartner = async (form) => {
    try {
      setSavingPartner(true);
      await API.put(`/partners/${id}`, form);
      toast.success("Partner updated");
      setShowEditPartner(false);
      fetchDetail();
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

  if (loading) {
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

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1
            className="text-xl font-black"
            style={{ color: "var(--text-primary)" }}
          >
            {partner.name}
          </h1>
          <div className="flex gap-2">
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
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: "var(--accent)" }}
            >
              + New Transaction
            </button>
          </div>
        </div>

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
              ₹{fmt(totals.received)}
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
              ₹{fmt(totals.transferred)}
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
              Net Balance
            </p>
            <p
              className="text-2xl font-black mt-1 tabular-nums"
              style={{ color: "var(--accent-text)" }}
            >
              ₹{fmt(netBalance)}
            </p>
          </div>
        </div>

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

        <div className="grid grid-cols-2 gap-4">
          <div
            className="rounded-xl px-4 py-3 border"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              {displayMonth(activeMonth)} Received
            </p>
            <p
              className="text-lg font-bold mt-1 tabular-nums"
              style={{ color: "#22c55e" }}
            >
              ₹{fmt(monthTotals.received)}
            </p>
          </div>
          <div
            className="rounded-xl px-4 py-3 border"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              {displayMonth(activeMonth)} Transferred
            </p>
            <p
              className="text-lg font-bold mt-1 tabular-nums"
              style={{ color: "var(--danger-text)" }}
            >
              ₹{fmt(monthTotals.transferred)}
            </p>
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
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ background: "var(--bg-elevated)" }}>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider border-b"
                    style={{
                      borderColor: "var(--border-sub)",
                      color: "var(--text-muted)",
                    }}
                  >
                    Date
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider border-b"
                    style={{
                      borderColor: "var(--border-sub)",
                      color: "var(--text-muted)",
                    }}
                  >
                    Type
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider border-b"
                    style={{
                      borderColor: "var(--border-sub)",
                      color: "var(--text-muted)",
                    }}
                  >
                    Note
                  </th>
                  <th
                    className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider border-b"
                    style={{
                      borderColor: "var(--border-sub)",
                      color: "var(--text-muted)",
                    }}
                  >
                    Amount
                  </th>
                  <th
                    className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider border-b"
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
                {monthTxns.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-10"
                      style={{ color: "var(--text-muted)" }}
                    >
                      No transactions for {displayMonth(activeMonth)}.
                    </td>
                  </tr>
                )}
                {monthTxns.map((t, idx) => (
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
                      className="px-4 py-3 font-medium"
                      style={{ color: "var(--accent-text)" }}
                    >
                      {fmtDateShort(t.date)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={t.type === "receive" ? "positive" : "negative"}
                      >
                        {t.type === "receive"
                          ? "Received (in)"
                          : "Transferred (out)"}
                      </Badge>
                    </td>
                    <td
                      className="px-4 py-3 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {t.note || "—"}
                    </td>
                    <td
                      className="px-4 py-3 text-right font-semibold tabular-nums"
                      style={{
                        color:
                          t.type === "receive"
                            ? "#22c55e"
                            : "var(--danger-text)",
                      }}
                    >
                      ₹{fmt(t.amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setDeleteTarget(t)}
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
        </div>
      </main>

      {showModal && (
        <TransactionModal
          onClose={() => setShowModal(false)}
          onSave={handleAdd}
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
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,.6)" }}
          onClick={(e) => e.target === e.currentTarget && setDeleteTarget(null)}
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
                onClick={() => setDeleteTarget(null)}
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
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: "var(--danger-text)" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
