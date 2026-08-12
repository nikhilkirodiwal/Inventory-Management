import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import { toast } from "react-toastify";
import {
  toMonthKey,
  parseKey,
  displayMonth,
  todayStr,
  fmt,
  fmtDate as fmtDateShort,
  sumPersonEntries as sumEntries,
} from "../utils/daybook";

/* Salary & Patient Bill belong to a specific site — you pick one before
   seeing any data. Admin Expense stays business-wide (no site picker). */
const SITE_SCOPED_KINDS = ["salary", "patientBill"];

/* ─── Entry modal — a date + either a single amount or a person/category breakdown ── */
function EntryModal({ entry, onClose, onSave, entryLabel }) {
  const [date, setDate] = useState(entry?.date?.split("T")[0] || todayStr());
  const [note, setNote] = useState(entry?.note || "");
  const [rows, setRows] = useState(
    entry?.entries?.length > 0 ? entry.entries : [{ name: "", amount: "" }],
  );
  const [useBreakdown, setUseBreakdown] = useState(
    entry?.entries?.length > 0 || !entry,
  );
  const [directAmount, setDirectAmount] = useState(entry?.directAmount || "");

  const addRow = () => setRows((p) => [...p, { name: "", amount: "" }]);
  const updRow = (i, k, v) =>
    setRows((p) => p.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const delRow = (i) => setRows((p) => p.filter((_, j) => j !== i));

  const total = useBreakdown ? sumEntries(rows) : Number(directAmount) || 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      date,
      note,
      entries: useBreakdown ? rows.filter((r) => r.name || r.amount) : [],
      directAmount: useBreakdown ? 0 : Number(directAmount) || 0,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="rounded-2xl w-full max-w-md border max-h-[88vh] overflow-y-auto"
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
            {entry ? "Edit" : "New"} {entryLabel} Entry
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

          <div
            className="flex rounded-lg overflow-hidden border"
            style={{ borderColor: "var(--border)" }}
          >
            <button
              type="button"
              onClick={() => setUseBreakdown(true)}
              className="flex-1 px-3 py-1.5 text-xs font-semibold"
              style={{
                background: useBreakdown
                  ? "var(--accent)"
                  : "var(--bg-elevated)",
                color: useBreakdown ? "#fff" : "var(--text-sec)",
              }}
            >
              By breakdown
            </button>
            <button
              type="button"
              onClick={() => setUseBreakdown(false)}
              className="flex-1 px-3 py-1.5 text-xs font-semibold"
              style={{
                background: !useBreakdown
                  ? "var(--accent)"
                  : "var(--bg-elevated)",
                color: !useBreakdown ? "#fff" : "var(--text-sec)",
              }}
            >
              Direct amount
            </button>
          </div>

          {useBreakdown ? (
            <div className="space-y-2">
              {rows.map((r, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    placeholder="Name / category"
                    value={r.name}
                    onChange={(e) => updRow(i, "name", e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{
                      background: "var(--bg-elevated)",
                      borderColor: "var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <input
                    placeholder="₹"
                    type="number"
                    value={r.amount}
                    onChange={(e) => updRow(i, "amount", e.target.value)}
                    className="w-28 px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{
                      background: "var(--bg-elevated)",
                      borderColor: "var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => delRow(i)}
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
                type="button"
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
            </div>
          ) : (
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: "var(--text-sec)" }}
              >
                Amount
              </label>
              <input
                type="number"
                value={directAmount}
                onChange={(e) => setDirectAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          )}

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
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirm({ onCancel, onConfirm }) {
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
          Delete this entry?
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

/* ─── ShopPicker — level 0 for site-scoped kinds (salary / patientBill) ───── */
function ShopPicker({ kind, title, onPick }) {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await API.get(`/ledger/${kind}/shops`);
        setShops(data.success ? data.data : []);
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to load sites");
      } finally {
        setLoading(false);
      }
    })();
  }, [kind]);

  return (
    <div className="space-y-5">
      <div>
        <h2
          className="font-bold text-lg"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          Site-wise · choose a site to see its monthly detail
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl border animate-pulse"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
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
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No sites yet — add a shop first.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {shops.map((s) => (
            <button
              key={s._id}
              onClick={() => onPick(s)}
              className="text-left rounded-2xl border p-4 transition hover:-translate-y-0.5"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border)",
                boxShadow: "var(--shadow)",
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-sm font-bold"
                  style={{ color: "var(--accent-text)" }}
                >
                  {s.name}
                </span>
                <span style={{ color: "var(--text-muted)" }}>→</span>
              </div>
              {s.address && (
                <p
                  className="text-xs mb-3 truncate"
                  style={{ color: "var(--text-muted)" }}
                >
                  {s.address}
                </p>
              )}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    This month
                  </p>
                  <p
                    className="text-lg font-bold tabular-nums"
                    style={{ color: "var(--text-primary)" }}
                  >
                    ₹{fmt(s.thisMonthTotal)}
                  </p>
                </div>
                <p
                  className="text-xs tabular-nums"
                  style={{ color: "var(--text-sec)" }}
                >
                  ₹{fmt(s.allTimeTotal)} all-time
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   LedgerTab — parameterized by `kind` ('salary' | 'adminExpense' | 'patientBill')
   For 'salary' / 'patientBill' a site must be picked first (ShopPicker);
   'adminExpense' stays a single business-wide ledger, no site picker.
══════════════════════════════════════════════════════════════════════════ */
export default function LedgerTab({ kind, title, accentLabel }) {
  const siteScoped = SITE_SCOPED_KINDS.includes(kind);
  const today = new Date();
  const currentMonthKey = toMonthKey(today.getFullYear(), today.getMonth() + 1);

  const [selectedShop, setSelectedShop] = useState(null);
  const [month, setMonth] = useState(currentMonthKey);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Reset the site selection whenever the ledger kind itself changes (e.g.
  // switching tabs from Salary to Patient Bill).
  useEffect(() => {
    setSelectedShop(null);
  }, [kind]);

  const fetchEntries = async (mk) => {
    try {
      setLoading(true);
      const params = { month: mk };
      if (siteScoped) params.shop = selectedShop._id;
      const { data } = await API.get(`/ledger/${kind}`, { params });
      setEntries(data.success ? data.data : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load entries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (siteScoped && !selectedShop) return; // wait for a site to be picked
    fetchEntries(month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, kind, selectedShop]);

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

  const total = entries.reduce((s, e) => s + (e.amount || 0), 0);

  const handleSave = async (form) => {
    try {
      const payload = siteScoped ? { ...form, shop: selectedShop._id } : form;
      if (editEntry) {
        await API.put(`/ledger/${kind}/${editEntry._id}`, payload);
        toast.success("Entry updated");
      } else {
        await API.post(`/ledger/${kind}`, payload);
        toast.success("Entry added");
      }
      setShowModal(false);
      setEditEntry(null);
      fetchEntries(month);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save entry");
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/ledger/${kind}/${deleteTarget._id}`);
      toast.success("Entry deleted");
      fetchEntries(month);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete entry");
    } finally {
      setDeleteTarget(null);
    }
  };

  // Level 0: pick a site (salary / patientBill only)
  if (siteScoped && !selectedShop) {
    return <ShopPicker kind={kind} title={title} onPick={setSelectedShop} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          {siteScoped && (
            <button
              onClick={() => setSelectedShop(null)}
              className="text-xs font-semibold mb-1.5 flex items-center gap-1"
              style={{ color: "var(--accent-text)" }}
            >
              ← All sites
            </button>
          )}
          <h2
            className="font-bold text-lg"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
            {siteScoped && (
              <span style={{ color: "var(--text-muted)" }}>
                {" "}
                — {selectedShop.name}
              </span>
            )}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {siteScoped
              ? `${accentLabel} · site-wise`
              : `${accentLabel} · business-wide, not tied to a shop`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border outline-none"
            style={{
              background: "var(--bg-elevated)",
              borderColor: "var(--border)",
              color: "var(--text-sec)",
            }}
          >
            {monthOptions.map((mk) => (
              <option key={mk} value={mk}>
                {displayMonth(mk)}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setEditEntry(null);
              setShowModal(true);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: "var(--accent)" }}
          >
            + Add Entry
          </button>
        </div>
      </div>

      <div
        className="rounded-2xl px-5 py-4 border inline-block"
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
          {displayMonth(month)} Total
        </p>
        <p
          className="text-2xl font-black mt-1 tabular-nums"
          style={{ color: "var(--accent-text)" }}
        >
          ₹{fmt(total)}
        </p>
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
                  Breakdown
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
              {loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-10"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && entries.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-10"
                    style={{ color: "var(--text-muted)" }}
                  >
                    No entries for {displayMonth(month)}.
                  </td>
                </tr>
              )}
              {!loading &&
                entries.map((e, idx) => (
                  <tr
                    key={e._id}
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
                      {fmtDateShort(e.date)}
                    </td>
                    <td
                      className="px-4 py-3 text-xs"
                      style={{ color: "var(--text-sec)" }}
                    >
                      {e.entries?.length > 0
                        ? e.entries
                            .map((x) => `${x.name}: ₹${fmt(x.amount)}`)
                            .join(", ")
                        : "Direct amount"}
                    </td>
                    <td
                      className="px-4 py-3 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {e.note || "—"}
                    </td>
                    <td
                      className="px-4 py-3 text-right font-semibold tabular-nums"
                      style={{ color: "var(--text-primary)" }}
                    >
                      ₹{fmt(e.amount)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setEditEntry(e);
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
                        onClick={() => setDeleteTarget(e)}
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

      {showModal && (
        <EntryModal
          entry={editEntry}
          entryLabel={title}
          onClose={() => {
            setShowModal(false);
            setEditEntry(null);
          }}
          onSave={handleSave}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

