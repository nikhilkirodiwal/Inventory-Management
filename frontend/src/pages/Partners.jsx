import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
const displayMonth = (mk) => {
  if (!mk) return "";
  const [y, m] = mk.split("-");
  return `${MONTH_NAMES[+m - 1]} ${y}`;
};

/* ─── Create / Edit partner modal ─────────────────────────────────────────── */
function PartnerFormModal({ initial, onClose, onSubmit, saving }) {
  const isEdit = !!initial?._id;
  const [name, setName] = useState(initial?.name || "");
  const [note, setNote] = useState(initial?.note || "");

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
            {isEdit ? "Edit Partner" : "Add New Partner"}
          </h3>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}>
            ✕
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ name, note });
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
              placeholder="e.g. Ramesh Gupta"
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
              placeholder="Optional"
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
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Partner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Delete confirmation ─────────────────────────────────────────────────── */
function DeletePartnerModal({ partner, onCancel, onConfirm }) {
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

export default function Partners() {
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [month, setMonth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/partners");
      setPartners(data.data || []);
      setMonth(data.month || null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load partners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleSubmit = async (form) => {
    try {
      setSaving(true);
      if (editingPartner) {
        await API.put(`/partners/${editingPartner._id}`, form);
        toast.success("Partner updated");
      } else {
        await API.post("/partners", form);
        toast.success("Partner added");
      }
      setShowForm(false);
      setEditingPartner(null);
      fetchPartners();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save partner");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/partners/${deleteTarget._id}`);
      toast.success("Partner deleted");
      fetchPartners();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete partner");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2
            className="font-bold text-lg"
            style={{ color: "var(--text-primary)" }}
          >
            Partners
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {month
              ? `${displayMonth(month)} activity`
              : "Payment transferred to and received from each business partner"}{" "}
            · tap a partner to see site-wise breakdown
          </p>
        </div>
        <button
          onClick={() => {
            setEditingPartner(null);
            setShowForm(true);
          }}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white whitespace-nowrap"
          style={{ background: "var(--accent)" }}
        >
          + Add Partner
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
                height: "200px",
              }}
            />
          ))}
        </div>
      ) : partners.length === 0 ? (
        <div
          className="rounded-2xl border p-10 text-center"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
          }}
        >
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
            No partners yet
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Add your first partner to start tracking money transfers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map((p) => {
            const mo = p.monthly || {
              received: 0,
              transferred: 0,
              netBalance: 0,
            };
            const positive = (mo.netBalance || 0) >= 0;
            return (
              <div
                key={p._id}
                onClick={() => navigate(`/superadmin/partners/${p._id}`)}
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
                      {p.name}
                    </h3>
                    {p.note && (
                      <p
                        className="text-xs mt-0.5 truncate"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {p.note}
                      </p>
                    )}
                  </div>
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
                    {positive ? "▲" : "▼"} ₹{fmt(Math.abs(mo.netBalance || 0))}
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
                      Received{" "}
                      {month ? `· ${displayMonth(month)}` : "this month"}
                    </p>
                    <p
                      className="text-sm font-bold mt-0.5 tabular-nums"
                      style={{ color: "#22c55e" }}
                    >
                      ₹{fmt(mo.received)}
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
                      Payment{" "}
                      {month ? `· ${displayMonth(month)}` : "this month"}
                    </p>
                    <p
                      className="text-sm font-bold mt-0.5 tabular-nums"
                      style={{ color: "var(--danger-text)" }}
                    >
                      ₹{fmt(mo.transferred)}
                    </p>
                  </div>
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  All-time net ₹{fmt(p.netBalance)} · {p.transactionCount} txns
                  · last {fmtDate(p.lastTransactionDate)}
                </p>

                <div
                  className="flex gap-2 pt-2 border-t"
                  style={{ borderColor: "var(--border-sub)" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => navigate(`/superadmin/partners/${p._id}`)}
                    className="flex-1 text-xs px-3 py-2 rounded-lg font-semibold text-white"
                    style={{ background: "var(--accent)" }}
                  >
                    View Sites →
                  </button>
                  <button
                    onClick={() => {
                      setEditingPartner(p);
                      setShowForm(true);
                    }}
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
                    onClick={() => setDeleteTarget(p)}
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
          })}
        </div>
      )}

      {showForm && (
        <PartnerFormModal
          initial={editingPartner}
          saving={saving}
          onClose={() => {
            setShowForm(false);
            setEditingPartner(null);
          }}
          onSubmit={handleSubmit}
        />
      )}
      {deleteTarget && (
        <DeletePartnerModal
          partner={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
