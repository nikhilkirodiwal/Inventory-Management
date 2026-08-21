import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import useMonthlyDaybook from "../hooks/useMonthlyDaybook";
import { Badge, ConfirmDialog } from "../components/DaybookUI";
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
 * Full-page drill-down for the shop dashboard's quick-stat tiles. Three
 * distinct layouts depending on `mode`:
 *
 *  - "dayCards"     Patient Bill, Purchase Credit — month -> day-wise cards,
 *                    each listing that day's entries as name + amount rows
 *                    (inline, no click-through modal needed).
 *  - "personGrouped" Personal Cr. — month -> grouped BY PERSON across every
 *                    day in that month, each person's card lists their
 *                    individual entries (date, amount, note, credited
 *                    status) with an inline "Update" for the credited amount.
 *  - "flatTable"     Salary — month -> a flat Date/Name/Amount/Note table
 *                    per field (Salary, then Advance right below it).
 *
 * `fields` is an array of { key, entriesKey, label, showCredited? }.
 * dayCards/personGrouped use fields[0]; flatTable renders one table per field.
 */
export default function CrDetailPage({ title, mode = "dayCards", fields }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { allData, setAllData, loadingMap, fetchMonth } =
    useMonthlyDaybook(user);

  const today = new Date();
  const currentMonthKey = toMonthKey(today.getFullYear(), today.getMonth() + 1);
  const currentYear = Number(currentMonthKey.slice(0, 4));

  const [year, setYear] = useState(currentYear);
  const [drillMonth, setDrillMonth] = useState(null);
  const [editKey, setEditKey] = useState(null); // `${entryId}:${idx}` currently being edited
  const [editValue, setEditValue] = useState("");
  const [editNote, setEditNote] = useState("");
  const [confirmState, setConfirmState] = useState(null);
  const [saving, setSaving] = useState(false);

  const yearOptions = yearsFrom(2024, currentMonthKey);
  const monthsInYear = monthsForYear(year, currentMonthKey);
  const primaryField = fields[0];

  useEffect(() => {
    monthsInYear.forEach((mk) => {
      if (!(mk in allData) && !loadingMap[mk]) fetchMonth(mk);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  /* ─── Level 1: monthly totals (one row of numbers per field) ────────────── */
  const monthlyRows = monthsInYear.map((mk) => {
    const list = allData[mk] || [];
    const totals = fields.map((f) => ({
      key: f.key,
      label: f.label || title,
      total: list.reduce((s, e) => s + (Number(e[f.key]) || 0), 0),
      left: f.showCredited
        ? list.reduce(
            (s, e) =>
              s +
              (e[f.entriesKey] || []).reduce(
                (s2, it) => s2 + creditLeft(it),
                0,
              ),
            0,
          )
        : 0,
    }));
    return {
      mk,
      totals,
      days: list.length,
      loading: loadingMap[mk] && !(mk in allData),
    };
  });

  /* ─── dayCards data: entries flattened per day, filtered to non-empty ───── */
  const dayRows =
    mode === "dayCards" && drillMonth
      ? (allData[drillMonth] || [])
          .filter(
            (e) =>
              (Number(e[primaryField.key]) || 0) > 0 ||
              (e[primaryField.entriesKey] || []).length > 0,
          )
          .sort((a, b) => new Date(a.date) - new Date(b.date))
      : [];

  /* ─── personGrouped data: same entries, regrouped by person name ────────── */
  const personGroups = useMemo(() => {
    if (mode !== "personGrouped" || !drillMonth) return [];
    const list = allData[drillMonth] || [];
    const map = {};
    list.forEach((entry) => {
      (entry[primaryField.entriesKey] || []).forEach((item, idx) => {
        const key = (item.name || "Unnamed").trim() || "Unnamed";
        if (!map[key])
          map[key] = { name: key, entries: [], totalAmount: 0, totalLeft: 0 };
        map[key].entries.push({
          ...item,
          date: entry.date,
          entryId: entry._id,
          idx,
        });
        map[key].totalAmount += Number(item.amount) || 0;
        map[key].totalLeft += creditLeft(item);
      });
    });
    return Object.values(map)
      .map((g) => ({
        ...g,
        entries: g.entries.sort((a, b) => new Date(a.date) - new Date(b.date)),
      }))
      .sort(
        (a, b) => b.totalLeft - a.totalLeft || a.name.localeCompare(b.name),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allData, drillMonth, mode]);

  /* ─── flatTable data: one flat, date-sorted list per field ───────────────── */
  const flatRowsFor = (field) => {
    if (!drillMonth) return [];
    const list = allData[drillMonth] || [];
    const rows = [];
    list.forEach((entry) => {
      (entry[field.entriesKey] || []).forEach((item) => {
        rows.push({
          date: entry.date,
          name: item.name,
          amount: item.amount,
          note: item.note || "",
        });
      });
    });
    return rows.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  /* ─── Personal Cr. credited-amount inline editor (personGrouped only) ───── */
  const startEdit = (item) => {
    setEditKey(`${item.entryId}:${item.idx}`);
    setEditValue(String(item.creditedAmount ?? 0));
    setEditNote(item.note || "");
  };
  const cancelEdit = () => {
    setEditKey(null);
    setEditValue("");
    setEditNote("");
  };
  const askConfirm = (item) => {
    const value = Math.max(0, Math.min(Number(editValue) || 0, item.amount));
    setConfirmState({ item, value, note: editNote });
  };
  const commitConfirm = async () => {
    if (!confirmState) return;
    const { item, value, note } = confirmState;
    setSaving(true);
    try {
      const { data } = await API.patch(
        `/daybook/${item.entryId}/personal-cr/${item.idx}`,
        { creditedAmount: value, note },
      );
      if (data.success) {
        setAllData((p) => ({
          ...p,
          [drillMonth]: (p[drillMonth] || []).map((e) =>
            e._id === item.entryId ? data.data : e,
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
              {drillMonth
                ? mode === "personGrouped"
                  ? "Grouped by person"
                  : mode === "flatTable"
                    ? "Date-wise table"
                    : "Day-wise breakdown"
                : "Monthly overview"}
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
        {/* ═══ LEVEL 1: monthly cards (same for every mode) ═══ */}
        {!drillMonth && (
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
                ) : (
                  <div className="space-y-2">
                    {r.totals.map((t) => (
                      <div key={t.key}>
                        {fields.length > 1 && (
                          <p
                            className="text-[10px] uppercase tracking-wider font-semibold"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {t.label}
                          </p>
                        )}
                        {t.total > 0 ? (
                          <p
                            className="text-xl font-bold tabular-nums"
                            style={{ color: "var(--text-primary)" }}
                          >
                            ₹{fmt(t.total)}
                          </p>
                        ) : (
                          <p
                            className="text-sm"
                            style={{ color: "var(--text-muted)" }}
                          >
                            No data
                          </p>
                        )}
                        {t.left > 0 && (
                          <p
                            className="text-xs font-semibold"
                            style={{ color: "#eab308" }}
                          >
                            ₹{fmt(t.left)} left to credit
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ═══ LEVEL 2: dayCards mode (Patient Bill, Purchase Credit) ═══ */}
        {drillMonth &&
          mode === "dayCards" &&
          (dayRows.length === 0 ? (
            <EmptyState title={title} monthLabel={displayMonth(drillMonth)} />
          ) : (
            <div className="space-y-3">
              {dayRows.map((e) => {
                const items = e[primaryField.entriesKey] || [];
                const value = Number(e[primaryField.key]) || 0;
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
                      <span
                        className="tabular-nums font-bold text-sm"
                        style={{ color: "var(--text-primary)" }}
                      >
                        ₹{fmt(value)}
                      </span>
                    </div>
                    {items.length > 0 ? (
                      <div
                        className="divide-y"
                        style={{ borderColor: "var(--border-sub)" }}
                      >
                        {items.map((it, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-3 px-4 py-2.5"
                          >
                            <div className="min-w-0">
                              <p
                                className="text-sm font-medium truncate"
                                style={{ color: "var(--text-primary)" }}
                              >
                                {it.name}
                              </p>
                              {it.note && (
                                <p
                                  className="text-xs mt-0.5 truncate"
                                  style={{ color: "var(--text-muted)" }}
                                >
                                  {it.note}
                                </p>
                              )}
                            </div>
                            <span
                              className="tabular-nums font-semibold text-sm shrink-0"
                              style={{ color: "var(--accent-text)" }}
                            >
                              ₹{fmt(it.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p
                        className="px-4 py-3 text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        No itemized entries — direct amount only.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

        {/* ═══ LEVEL 2: personGrouped mode (Personal Cr.) ═══ */}
        {drillMonth &&
          mode === "personGrouped" &&
          (personGroups.length === 0 ? (
            <EmptyState title={title} monthLabel={displayMonth(drillMonth)} />
          ) : (
            <div className="space-y-3">
              {personGroups.map((g) => (
                <div
                  key={g.name}
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
                    <div className="min-w-0">
                      <p
                        className="text-sm font-bold truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {g.name}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {g.entries.length} entr
                        {g.entries.length === 1 ? "y" : "ies"} this month
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className="tabular-nums font-bold text-sm"
                        style={{ color: "var(--text-primary)" }}
                      >
                        ₹{fmt(g.totalAmount)}
                      </p>
                      {g.totalLeft > 0 ? (
                        <Badge variant="warning">
                          ₹{fmt(g.totalLeft)} pending
                        </Badge>
                      ) : (
                        <Badge variant="positive">Fully credited</Badge>
                      )}
                    </div>
                  </div>

                  <div
                    className="divide-y"
                    style={{ borderColor: "var(--border-sub)" }}
                  >
                    {g.entries.map((it) => {
                      const key = `${it.entryId}:${it.idx}`;
                      const editing = editKey === key;
                      const status = creditStatus(it);
                      const left = creditLeft(it);
                      const pct = creditPct(it);
                      return (
                        <div key={key} className="px-4 py-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p
                                className="text-xs font-semibold"
                                style={{ color: "var(--accent-text)" }}
                              >
                                {fmtDate(it.date)}
                              </p>
                              <p
                                className="text-xs tabular-nums"
                                style={{ color: "var(--text-sec)" }}
                              >
                                ₹{fmt(it.creditedAmount || 0)} of ₹
                                {fmt(it.amount)} credited
                              </p>
                              {it.note && !editing && (
                                <p
                                  className="text-xs mt-1 italic truncate"
                                  style={{ color: "var(--text-muted)" }}
                                >
                                  {it.note}
                                </p>
                              )}
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
                                  onClick={() => startEdit(it)}
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
                              className="mt-3 space-y-2 rounded-xl border p-2.5"
                              style={{
                                borderColor: "var(--border-sub)",
                                background: "var(--bg-elevated)",
                              }}
                            >
                              <div className="flex flex-wrap items-center gap-2">
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
                              </div>
                              <div className="flex items-center gap-2">
                                <label
                                  className="text-xs shrink-0"
                                  style={{ color: "var(--text-muted)" }}
                                >
                                  Note
                                </label>
                                <input
                                  type="text"
                                  value={editNote}
                                  onChange={(ev) =>
                                    setEditNote(ev.target.value)
                                  }
                                  placeholder="Optional note…"
                                  className="flex-1 px-2.5 py-1.5 rounded-lg border text-xs outline-none"
                                  style={{
                                    background: "var(--bg-surface)",
                                    borderColor: "var(--border)",
                                    color: "var(--text-primary)",
                                  }}
                                />
                              </div>
                              <div className="flex justify-end gap-2">
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
                                  onClick={() => askConfirm(it)}
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
                </div>
              ))}
            </div>
          ))}

        {/* ═══ LEVEL 2: flatTable mode (Salary + Advance) ═══ */}
        {drillMonth && mode === "flatTable" && (
          <div className="space-y-6">
            {fields.map((field) => {
              const rows = flatRowsFor(field);
              return (
                <div key={field.key}>
                  <h3
                    className="font-bold text-sm mb-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {field.label}
                  </h3>
                  {rows.length === 0 ? (
                    <div
                      className="rounded-2xl border p-6 text-center"
                      style={{
                        background: "var(--bg-surface)",
                        borderColor: "var(--border)",
                      }}
                    >
                      <p
                        className="text-sm"
                        style={{ color: "var(--text-muted)" }}
                      >
                        No {field.label.toLowerCase()} entries for{" "}
                        {displayMonth(drillMonth)}.
                      </p>
                    </div>
                  ) : (
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
                              {["Date", "Name", "Amount", "Note"].map(
                                (h, i) => (
                                  <th
                                    key={h}
                                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b ${i === 2 ? "text-right" : "text-left"}`}
                                    style={{
                                      borderColor: "var(--border-sub)",
                                      color: "var(--text-muted)",
                                    }}
                                  >
                                    {h}
                                  </th>
                                ),
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((r, idx) => (
                              <tr
                                key={idx}
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
                                  className="px-4 py-2.5 font-medium whitespace-nowrap"
                                  style={{ color: "var(--accent-text)" }}
                                >
                                  {fmtDate(r.date)}
                                </td>
                                <td
                                  className="px-4 py-2.5"
                                  style={{ color: "var(--text-primary)" }}
                                >
                                  {r.name}
                                </td>
                                <td
                                  className="px-4 py-2.5 text-right tabular-nums font-semibold"
                                  style={{ color: "var(--text-primary)" }}
                                >
                                  ₹{fmt(r.amount)}
                                </td>
                                <td
                                  className="px-4 py-2.5 text-xs"
                                  style={{ color: "var(--text-muted)" }}
                                >
                                  {r.note || "—"}
                                </td>
                              </tr>
                            ))}
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
                                className="px-4 py-2.5"
                                colSpan={2}
                                style={{ color: "var(--text-muted)" }}
                              >
                                TOTAL
                              </td>
                              <td
                                className="px-4 py-2.5 text-right tabular-nums"
                                style={{ color: "var(--accent-text)" }}
                              >
                                ₹
                                {fmt(
                                  rows.reduce((s, r) => s + (r.amount || 0), 0),
                                )}
                              </td>
                              <td />
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {confirmState && (
        <ConfirmDialog
          title="Confirm credit update"
          message={`Mark ₹${fmt(confirmState.value)} of ₹${fmt(confirmState.item.amount)} as credited for ${confirmState.item.name} on ${fmtDate(confirmState.item.date)}? ${
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

function EmptyState({ title, monthLabel }) {
  return (
    <div
      className="rounded-2xl border p-10 text-center"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        No {title.toLowerCase()} entries for {monthLabel}.
      </p>
    </div>
  );
}
