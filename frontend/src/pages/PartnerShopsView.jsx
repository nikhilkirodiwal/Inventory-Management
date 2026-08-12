import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import API from "../api/axios";
import { toast } from "react-toastify";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const toMonthKey = (y, m) => `${y}-${String(m).padStart(2, "0")}`;
const parseKey = (k) => { const [y, m] = k.split("-"); return { year: +y, month: +m }; };
const displayMonth = (k) => { const { year, month } = parseKey(k); return `${MONTH_NAMES[month - 1]} ${year}`; };
const fmt = (n) =>
  n === undefined || n === null || isNaN(n) ? "—" : new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—");

function EditPartnerModal({ partner, onClose, onSave, saving }) {
  const [name, setName] = useState(partner.name);
  const [note, setNote] = useState(partner.note || "");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-2xl border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "var(--shadow)" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border-sub)" }}>
          <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Edit Partner</h3>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}>✕</button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ name, note }); }} className="p-6 space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-sec)" }}>Partner Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-sec)" }}>Note (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm border font-medium" style={{ borderColor: "var(--border)", color: "var(--text-sec)", background: "var(--bg-elevated)" }}>Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: "var(--accent)" }}>{saving ? "Saving…" : "Save Changes"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeletePartnerConfirm({ partner, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.6)" }} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="w-full max-w-sm rounded-2xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "var(--shadow)" }}>
        <h3 className="font-bold text-base mb-1" style={{ color: "var(--text-primary)" }}>Delete {partner.name}?</h3>
        <p className="text-sm mb-5" style={{ color: "var(--text-sec)" }}>This permanently deletes the partner and every transaction logged against them. This can't be undone.</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm border font-medium" style={{ borderColor: "var(--border)", color: "var(--text-sec)", background: "var(--bg-elevated)" }}>Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--danger-text)" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function PartnerShopsView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const today = new Date();
  const currentMonthKey = toMonthKey(today.getFullYear(), today.getMonth() + 1);

  const [month, setMonth] = useState(currentMonthKey);
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState(null);
  const [shops, setShops] = useState([]);
  const [monthTotals, setMonthTotals] = useState({ received: 0, transferred: 0, netBalance: 0 });
  const [showEditPartner, setShowEditPartner] = useState(false);
  const [showDeletePartner, setShowDeletePartner] = useState(false);
  const [savingPartner, setSavingPartner] = useState(false);

  const fetchShops = async (mk) => {
    try {
      setLoading(true);
      const { data } = await API.get(`/partners/${id}/shops`, { params: { month: mk } });
      setPartner(data.data.partner);
      setShops(data.data.shops || []);
      setMonthTotals(data.data.monthTotals || { received: 0, transferred: 0, netBalance: 0 });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load partner");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShops(month); }, [id, month]); // eslint-disable-line

  const monthOptions = useMemo(() => {
    const opts = [];
    let c = currentMonthKey;
    for (let i = 0; i < 12; i++) {
      opts.push(c);
      const { year, month: m } = parseKey(c);
      c = m === 1 ? toMonthKey(year - 1, 12) : toMonthKey(year, m - 1);
    }
    return opts;
  }, [currentMonthKey]);

  const handleSavePartner = async (form) => {
    try {
      setSavingPartner(true);
      await API.put(`/partners/${id}`, form);
      toast.success("Partner updated");
      setShowEditPartner(false);
      fetchShops(month);
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

  if (loading && !partner) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading…</p>
      </div>
    );
  }
  if (!partner) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: "var(--bg-base)" }}>
        <p style={{ color: "var(--danger-text)" }}>Partner not found</p>
        <button onClick={() => navigate("/superadmin?tab=partners")} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "var(--accent)", color: "#fff" }}>← Back</button>
      </div>
    );
  }

  const positiveTotal = (monthTotals.netBalance || 0) >= 0;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b" style={{ background: "var(--topbar-bg)", borderColor: "var(--topbar-border)", boxShadow: "var(--shadow)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/superadmin?tab=partners")} className="w-8 h-8 rounded-lg flex items-center justify-center border text-lg font-bold" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)", color: "var(--text-sec)" }}>←</button>
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{partner.name}</p>
        </div>
        <button onClick={toggleTheme} className="w-8 h-8 rounded-lg flex items-center justify-center border" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)", color: "var(--text-sec)" }}>
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>{partner.name}</h1>
            {partner.note && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{partner.note}</p>}
          </div>
          <div className="flex gap-2 items-center">
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-2 rounded-xl text-xs font-semibold border outline-none" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-sec)" }}>
              {monthOptions.map((mk) => <option key={mk} value={mk}>{displayMonth(mk)}</option>)}
            </select>
            <button onClick={() => setShowEditPartner(true)} className="px-3 py-2 rounded-xl text-sm font-medium border" style={{ borderColor: "var(--border)", color: "var(--text-sec)", background: "var(--bg-elevated)" }}>Edit</button>
            <button onClick={() => setShowDeletePartner(true)} className="px-3 py-2 rounded-xl text-sm font-medium border" style={{ borderColor: "var(--danger-border)", color: "var(--danger-text)", background: "var(--danger-soft)" }}>Delete Partner</button>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)" }}>Site-wise — {displayMonth(month)}</h3>
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>Tap a site to see day-wise transactions and filter by any month.</p>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            <div className="rounded-2xl px-5 py-4 border" style={{ background: "rgba(34,197,94,0.05)", borderColor: "rgba(34,197,94,0.3)", boxShadow: "var(--shadow)" }}>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#22c55e" }}>Received</p>
              <p className="text-2xl font-black mt-1 tabular-nums" style={{ color: "#22c55e" }}>₹{fmt(monthTotals.received)}</p>
            </div>
            <div className="rounded-2xl px-5 py-4 border" style={{ background: "var(--danger-soft)", borderColor: "var(--danger-border)", boxShadow: "var(--shadow)" }}>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--danger-text)" }}>Transferred</p>
              <p className="text-2xl font-black mt-1 tabular-nums" style={{ color: "var(--danger-text)" }}>₹{fmt(monthTotals.transferred)}</p>
            </div>
            <div
              className="rounded-2xl px-5 py-4 border"
              style={{
                background: positiveTotal ? "rgba(34,197,94,0.05)" : "var(--danger-soft)",
                borderColor: positiveTotal ? "rgba(34,197,94,0.3)" : "var(--danger-border)",
                boxShadow: "var(--shadow)",
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: positiveTotal ? "#22c55e" : "var(--danger-text)" }}>Net Balance</p>
              <p className="text-2xl font-black mt-1 tabular-nums" style={{ color: positiveTotal ? "#22c55e" : "var(--danger-text)" }}>₹{fmt(monthTotals.netBalance)}</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <div key={i} className="rounded-2xl border p-5 animate-pulse" style={{ background: "var(--bg-surface)", borderColor: "var(--border)", height: "150px" }} />)}
            </div>
          ) : shops.length === 0 ? (
            <div className="rounded-2xl border p-10 text-center" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>No transactions for {displayMonth(month)}</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Pick a different month, or log a transaction from a site's detail page.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shops.map((s) => {
                const positive = (s.netBalance || 0) >= 0;
                return (
                  <div
                    key={s.shopId}
                    onClick={() => navigate(`/superadmin/partners/${id}/shops/${s.shopId}`)}
                    className="rounded-2xl border p-5 flex flex-col gap-3 cursor-pointer transition-transform hover:-translate-y-0.5"
                    style={{
                      background: "var(--bg-surface)",
                      borderColor: s.shopId === "unassigned" ? "var(--border-sub)" : "var(--border)",
                      boxShadow: "var(--shadow)",
                      opacity: s.shopId === "unassigned" ? 0.85 : 1,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-base truncate" style={{ color: "var(--text-primary)" }}>{s.shopName}</h3>
                      <span
                        className="shrink-0 text-xs font-semibold px-2 py-1 rounded-full"
                        style={{
                          background: positive ? "rgba(34,197,94,0.1)" : "var(--danger-soft)",
                          color: positive ? "#22c55e" : "var(--danger-text)",
                          border: `1px solid ${positive ? "rgba(34,197,94,0.2)" : "var(--danger-border)"}`,
                        }}
                      >
                        {positive ? "▲" : "▼"} ₹{fmt(Math.abs(s.netBalance || 0))}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl px-3 py-2" style={{ background: "var(--bg-elevated)" }}>
                        <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>Received</p>
                        <p className="text-sm font-bold mt-0.5 tabular-nums" style={{ color: "#22c55e" }}>₹{fmt(s.received)}</p>
                      </div>
                      <div className="rounded-xl px-3 py-2" style={{ background: "var(--bg-elevated)" }}>
                        <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>Payment</p>
                        <p className="text-sm font-bold mt-0.5 tabular-nums" style={{ color: "var(--danger-text)" }}>₹{fmt(s.transferred)}</p>
                      </div>
                    </div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.transactionCount} txns · last {fmtDate(s.lastTransactionDate)}</p>
                    <button className="w-full text-xs px-3 py-2 rounded-lg font-semibold text-white" style={{ background: "var(--accent)" }}>View Day-wise →</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {showEditPartner && (
        <EditPartnerModal partner={partner} saving={savingPartner} onClose={() => setShowEditPartner(false)} onSave={handleSavePartner} />
      )}
      {showDeletePartner && (
        <DeletePartnerConfirm partner={partner} onCancel={() => setShowDeletePartner(false)} onConfirm={handleDeletePartner} />
      )}
    </div>
  );
}
