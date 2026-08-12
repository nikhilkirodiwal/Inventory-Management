import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import useMonthlyDaybook from "../hooks/useMonthlyDaybook";
import { Badge, BreakdownModal, ConfirmDialog } from "../components/DaybookUI";
import {
  toMonthKey,
  displayMonth,
  yearsFrom,
  monthsForYear,
  fmt,
  fmtDate,
  creditStatus,
  creditLeft,
  creditPct,
} from "../utils/daybook";

/**
 * Full-page drill-down, used for Personal Cr., Patient Bill (Official Cr.),
 * and Salary. Each has its own route with a back button (was previously a
 * popup). Personal Cr additionally supports tracking a *partial* credited
 * amount per person, rather than a plain done/not-done flag — you can see
 * exactly how much is left, update it, and every change goes through a
 * confirmation step before it's saved.
 *
 * Level 1: monthly totals for the selected year, as a card grid.
 * Level 2: click a month -> day-wise cards for that month.
 */
export default function CrDetailPage({
  title,
  fieldKey,
  entriesKey,
  showCredited = false,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { allData, setAllData, loadingMap, fetchMonth } =
    useMonthlyDaybook(user);

  const today = new Date();
  const currentMonthKey = toMonthKey(today.getFullYear(), today.getMonth() + 1);
  const currentYear = Number(currentMonthKey.slice(0, 4));

  const [year, setYear] = useState(currentYear);
  const [drillMonth, setDrillMonth] = useState(null);
  const [breakdown, setBreakdown] = useState(null); // { title, items } for non-credited fields
  const [editKey, setEditKey] = useState(null); // `${entryId}:${idx}` currently being edited
  const [editValue, setEditValue] = useState("");
  const [confirmState, setConfirmState] = useState(null); // { entry, idx, item, value }
  const [saving, setSaving] = useState(false);

  const yearOptions = yearsFrom(2024, currentMonthKey);
  const monthsInYear = monthsForYear(year, currentMonthKey);

  useEffect(() => {
    monthsInYear.forEach((mk) => {
      if (!(mk in allData) && !loadingMap[mk]) fetchMonth(mk);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const monthlyRows = monthsInYear.map((mk) => {
    const list = allData[mk] || [];
    const total = list.reduce((s, e) => s + (Number(e[fieldKey]) || 0), 0);
    const left = showCredited
      ? list.reduce(
          (s, e) =>
            s +
            (e[entriesKey] || []).reduce((s2, it) => s2 + creditLeft(it), 0),
          0,
        )
      : 0;
    return {
      mk,
      total,
      left,
      days: list.length,
      loading: loadingMap[mk] && !(mk in allData),
    };
  });

  const dayRows = drillMonth
    ? (allData[drillMonth] || [])
        .filter(
          (e) =>
            (Number(e[fieldKey]) || 0) > 0 || (e[entriesKey] || []).length > 0,
        )
        .sort((a, b) => new Date(a.date) - new Date(b.date))
    : [];

  const startEdit = (entry, idx, item) => {
    setEditKey(`${entry._id}:${idx}`);
    setEditValue(String(item.creditedAmount ?? 0));
  };
  const cancelEdit = () => {
    setEditKey(null);
    setEditValue("");
  };

  const askConfirm = (entry, idx, item) => {
    const value = Math.max(0, Math.min(Number(editValue) || 0, item.amount));
    setConfirmState({ entry, idx, item, value });
  };

  const commitConfirm = async () => {
    if (!confirmState) return;
    const { entry, idx, value } = confirmState;
    setSaving(true);
    try {
      const { data } = await API.patch(
        `/daybook/${entry._id}/personal-cr/${idx}`,
        { creditedAmount: value },
      );
      if (data.success) {
        setAllData((p) => ({
          ...p,
          [drillMonth]: (p[drillMonth] || []).map((e) =>
            e._id === entry._id ? data.data : e,
          ),
        }));
      }
      setConfirmState(null);
      cancelEdit();
    } catch (err) {
      alert(
        "Couldn't update: " + (err?.response?.data?.message || err.message),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 border-b"
        style={{
          background: "var(--topbar-bg)",
          borderColor: "var(--topbar-border)",
          boxShadow: "var(--shadow)",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() =>
              drillMonth ? setDrillMonth(null) : navigate("/dashboard")
            }
            className="w-9 h-9 rounded-lg flex items-center justify-center border text-sm font-bold shrink-0"
            style={{
              borderColor: "var(--border)",
              background: "var(--bg-elevated)",
              color: "var(--text-sec)",
            }}
            title={drillMonth ? "Back to months" : "Back to dashboard"}
          >
            ←
          </button>
          <div className="min-w-0">
            <p
              className="text-sm font-bold leading-none truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {title}
              {drillMonth ? ` — ${displayMonth(drillMonth)}` : ""}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {drillMonth ? "Day-wise breakdown" : "Monthly & day-wise"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!drillMonth && (
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border outline-none"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
                color: "var(--text-sec)",
              }}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => navigate("/dashboard")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border hidden sm:block"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-sec)",
              background: "var(--bg-elevated)",
            }}
          >
            Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {!drillMonth ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {monthlyRows.map((r) => (
              <button
                key={r.mk}
                onClick={() => setDrillMonth(r.mk)}
                className="text-left rounded-2xl border p-4 transition hover:-translate-y-0.5"
                style={{
                  background: "var(--bg-surface)",
                  borderColor: "var(--border)",
                  boxShadow: "var(--shadow)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-sm font-bold"
                    style={{ color: "var(--accent-text)" }}
                  >
                    {displayMonth(r.mk)}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {r.days > 0
                      ? `${r.days} day${r.days === 1 ? "" : "s"}`
                      : ""}
                  </span>
                </div>
                {r.loading ? (
                  <div
                    className="h-7 w-24 rounded-md animate-pulse"
                    style={{ background: "var(--bg-elevated)" }}
                  />
                ) : r.total > 0 ? (
                  <>
                    <p
                      className="text-2xl font-bold tabular-nums"
                      style={{ color: "var(--text-primary)" }}
                    >
                      ₹{fmt(r.total)}
                    </p>
                    {showCredited && (
                      <p
                        className="text-xs font-semibold mt-1"
                        style={{ color: r.left > 0 ? "#eab308" : "#22c55e" }}
                      >
                        {r.left > 0
                          ? `₹${fmt(r.left)} left to credit`
                          : "All credited"}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    No data
                  </p>
                )}
              </button>
            ))}
          </div>
        ) : dayRows.length === 0 ? (
          <div
            className="rounded-2xl border p-10 text-center"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
            }}
          >
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No {title.toLowerCase()} entries for {displayMonth(drillMonth)}.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayRows.map((e) => {
              const items = e[entriesKey] || [];
              const value = Number(e[fieldKey]) || 0;
              const dayLeft = showCredited
                ? items.reduce((s, it) => s + creditLeft(it), 0)
                : 0;
              return (
                <div
                  key={e._id}
                  className="rounded-2xl border overflow-hidden"
                  style={{
                    background: "var(--bg-surface)",
                    borderColor: "var(--border)",
                    boxShadow: "var(--shadow)",
                  }}
                >
                  <div
                    className="flex items-center justify-between px-4 py-3 border-b"
                    style={{
                      borderColor: "var(--border-sub)",
                      background: "var(--bg-elevated)",
                    }}
                  >
                    <span
                      className="text-sm font-bold"
                      style={{ color: "var(--accent-text)" }}
                    >
                      {fmtDate(e.date)}
                    </span>
                    <div className="flex items-center gap-2">
                      {showCredited && dayLeft > 0 && (
                        <Badge variant="warning">₹{fmt(dayLeft)} left</Badge>
                      )}
                      {items.length > 0 && !showCredited ? (
                        <button
                          onClick={() =>
                            setBreakdown({
                              items,
                              title: `${title} — ${fmtDate(e.date)}`,
                            })
                          }
                          className="tabular-nums font-bold text-sm border-b border-dotted"
                          style={{
                            color: "var(--text-primary)",
                            borderColor: "var(--text-muted)",
                          }}
                        >
                          ₹{fmt(value)}
                        </button>
                      ) : (
                        <span
                          className="tabular-nums font-bold text-sm"
                          style={{ color: "var(--text-primary)" }}
                        >
                          ₹{fmt(value)}
                        </span>
                      )}
                    </div>
                  </div>

                  {showCredited && items.length > 0 && (
                    <div
                      className="divide-y"
                      style={{ borderColor: "var(--border-sub)" }}
                    >
                      {items.map((it, idx) => {
                        const key = `${e._id}:${idx}`;
                        const editing = editKey === key;
                        const status = creditStatus(it);
                        const left = creditLeft(it);
                        const pct = creditPct(it);
                        return (
                          <div key={idx} className="px-4 py-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p
                                  className="text-sm font-semibold truncate"
                                  style={{ color: "var(--text-primary)" }}
                                >
                                  {it.name}
                                </p>
                                <p
                                  className="text-xs tabular-nums"
                                  style={{ color: "var(--text-sec)" }}
                                >
                                  ₹{fmt(it.creditedAmount || 0)} of ₹
                                  {fmt(it.amount)} credited
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
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
                                {!editing && (
                                  <button
                                    onClick={() => startEdit(e, idx, it)}
                                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border shrink-0"
                                    style={{
                                      borderColor: "var(--accent-border)",
                                      color: "var(--accent-text)",
                                      background: "var(--accent-soft)",
                                    }}
                                  >
                                    Update
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* progress bar: how much of this credit has been settled */}
                            <div
                              className="mt-2 h-1.5 rounded-full overflow-hidden"
                              style={{ background: "var(--bg-elevated)" }}
                            >
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${pct}%`,
                                  background:
                                    status === "full" ? "#22c55e" : "#eab308",
                                }}
                              />
                            </div>

                            {editing && (
                              <div
                                className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border p-2.5"
                                style={{
                                  borderColor: "var(--border-sub)",
                                  background: "var(--bg-elevated)",
                                }}
                              >
                                <label
                                  className="text-xs shrink-0"
                                  style={{ color: "var(--text-muted)" }}
                                >
                                  Credited amount
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  max={it.amount}
                                  autoFocus
                                  value={editValue}
                                  onChange={(ev) =>
                                    setEditValue(ev.target.value)
                                  }
                                  className="w-24 px-2.5 py-1.5 rounded-lg border text-xs outline-none"
                                  style={{
                                    background: "var(--bg-surface)",
                                    borderColor: "var(--border)",
                                    color: "var(--text-primary)",
                                  }}
                                />
                                <button
                                  onClick={() =>
                                    setEditValue(String(it.amount))
                                  }
                                  className="text-xs px-2 py-1.5 rounded-lg border shrink-0"
                                  style={{
                                    borderColor: "var(--border)",
                                    color: "var(--text-sec)",
                                  }}
                                >
                                  Mark fully credited
                                </button>
                                <span
                                  className="text-xs font-semibold shrink-0"
                                  style={{
                                    color:
                                      Math.max(
                                        0,
                                        it.amount - (Number(editValue) || 0),
                                      ) > 0
                                        ? "#eab308"
                                        : "#22c55e",
                                  }}
                                >
                                  Left after: ₹
                                  {fmt(
                                    Math.max(
                                      0,
                                      it.amount - (Number(editValue) || 0),
                                    ),
                                  )}
                                </span>
                                <div className="flex gap-2 ml-auto shrink-0">
                                  <button
                                    onClick={cancelEdit}
                                    className="text-xs px-3 py-1.5 rounded-lg border"
                                    style={{
                                      borderColor: "var(--border)",
                                      color: "var(--text-sec)",
                                      background: "var(--bg-surface)",
                                    }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => askConfirm(e, idx, it)}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                                    style={{ background: "var(--accent)" }}
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {breakdown && (
        <BreakdownModal
          title={breakdown.title}
          items={breakdown.items}
          onClose={() => setBreakdown(null)}
        />
      )}

      {confirmState && (
        <ConfirmDialog
          title="Confirm credit update"
          message={`Mark ₹${fmt(confirmState.value)} of ₹${fmt(confirmState.item.amount)} as credited for ${confirmState.item.name} on ${fmtDate(confirmState.entry.date)}? ${
            confirmState.value < confirmState.item.amount
              ? `₹${fmt(confirmState.item.amount - confirmState.value)} will remain left.`
              : "This will be fully credited."
          }`}
          confirmLabel="Confirm"
          busy={saving}
          onConfirm={commitConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  );
}
