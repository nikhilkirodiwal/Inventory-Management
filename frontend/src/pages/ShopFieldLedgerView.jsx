import { useEffect, useState } from "react";
import API from "../api/axios";
import { toast } from "react-toastify";
import {
  toMonthKey,
  displayMonth,
  yearsFrom,
  monthsForYear,
  fmt,
  fmtDate,
} from "../utils/daybook";

/**
 * Superadmin, read-only. Salary and Patient Bill are no longer separate
 * manually-entered ledgers — they're just a view into each shop's own
 * daybook data (DayBook.salary / DayBook.officialCr). Flow:
 *   Level 0: pick a site (cards show lifetime + this-month totals)
 *   Level 1: pick a month for that site
 *   Level 2: "dayCards" (Patient Bill) — day-wise, name+amount inline
 *            "flatTable" (Salary)     — a single Date/Name/Amount/Note table
 */
export default function ShopFieldLedgerView({
  field, // "salary" | "officialCr"
  entriesKey, // "salaryEntries" | "officialCrEntries"
  title,
  subtitle,
  mode, // "dayCards" | "flatTable"
}) {
  const today = new Date();
  const currentMonthKey = toMonthKey(today.getFullYear(), today.getMonth() + 1);
  const currentYear = today.getFullYear();

  const [shops, setShops] = useState([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [selectedShop, setSelectedShop] = useState(null);

  const [year, setYear] = useState(currentYear);
  const [drillMonth, setDrillMonth] = useState(null);
  const [allData, setAllData] = useState({});
  const [loadingMap, setLoadingMap] = useState({});

  const yearOptions = yearsFrom(2024, currentMonthKey);
  const monthsInYear = monthsForYear(year, currentMonthKey);

  useEffect(() => {
    (async () => {
      try {
        setLoadingShops(true);
        const { data } = await API.get(`/daybook/shop-totals/${field}`);
        setShops(data.success ? data.data : []);
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to load sites");
      } finally {
        setLoadingShops(false);
      }
    })();
  }, [field]);

  const fetchMonth = async (mk) => {
    if (!selectedShop) return;
    setLoadingMap((p) => ({ ...p, [mk]: true }));
    try {
      const { data } = await API.get("/daybook", {
        params: { month: mk, shop: selectedShop._id },
      });
      setAllData((p) => ({ ...p, [mk]: data.success ? data.data || [] : [] }));
    } catch {
      setAllData((p) => ({ ...p, [mk]: [] }));
    } finally {
      setLoadingMap((p) => ({ ...p, [mk]: false }));
    }
  };

  useEffect(() => {
    if (!selectedShop) return;
    setAllData({});
    setDrillMonth(null);
    monthsInYear.forEach((mk) => fetchMonth(mk));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShop, year]);

  const pickShop = (s) => {
    setSelectedShop(s);
    setYear(currentYear);
  };
  const backToShops = () => {
    setSelectedShop(null);
    setDrillMonth(null);
    setAllData({});
  };

  const monthlyRows = monthsInYear.map((mk) => {
    const list = allData[mk] || [];
    const total = list.reduce((s, e) => s + (Number(e[field]) || 0), 0);
    return { mk, total, days: list.length, loading: loadingMap[mk] && !(mk in allData) };
  });

  const dayRows =
    mode === "dayCards" && drillMonth
      ? (allData[drillMonth] || [])
          .filter(
            (e) => (Number(e[field]) || 0) > 0 || (e[entriesKey] || []).length > 0,
          )
          .sort((a, b) => new Date(a.date) - new Date(b.date))
      : [];

  const flatRows = () => {
    if (!drillMonth) return [];
    const list = allData[drillMonth] || [];
    const rows = [];
    list.forEach((entry) => {
      (entry[entriesKey] || []).forEach((item) => {
        rows.push({ date: entry.date, name: item.name, amount: item.amount, note: item.note || "" });
      });
    });
    return rows.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  /* ═══ Level 0: pick a site ═══ */
  if (!selectedShop) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
            {title}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {subtitle} · read-only, pulled from each site's own daybook · pick a site
          </p>
        </div>

        {loadingShops ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl border animate-pulse"
                style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
              />
            ))}
          </div>
        ) : shops.length === 0 ? (
          <div
            className="rounded-2xl border p-10 text-center"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
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
                onClick={() => pickShop(s)}
                className="text-left rounded-2xl border p-4 transition hover:-translate-y-0.5"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "var(--shadow)" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold" style={{ color: "var(--accent-text)" }}>
                    {s.name}
                  </span>
                  <span style={{ color: "var(--text-muted)" }}>→</span>
                </div>
                {s.address && (
                  <p className="text-xs mb-3 truncate" style={{ color: "var(--text-muted)" }}>
                    {s.address}
                  </p>
                )}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      This month
                    </p>
                    <p className="text-lg font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                      ₹{fmt(s.thisMonthTotal)}
                    </p>
                  </div>
                  <p className="text-xs tabular-nums" style={{ color: "var(--text-sec)" }}>
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

  /* ═══ Level 1: pick a month ═══ */
  if (!drillMonth) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <button
              onClick={backToShops}
              className="text-xs font-semibold mb-1.5 flex items-center gap-1"
              style={{ color: "var(--accent-text)" }}
            >
              ← All sites
            </button>
            <h2 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
              {title} <span style={{ color: "var(--text-muted)" }}>— {selectedShop.name}</span>
            </h2>
          </div>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border outline-none"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-sec)" }}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {monthlyRows.map((r) => (
            <button
              key={r.mk}
              onClick={() => setDrillMonth(r.mk)}
              className="text-left rounded-2xl border p-4 transition hover:-translate-y-0.5"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "var(--shadow)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold" style={{ color: "var(--accent-text)" }}>
                  {displayMonth(r.mk)}
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {r.days > 0 ? `${r.days} day${r.days === 1 ? "" : "s"}` : ""}
                </span>
              </div>
              {r.loading ? (
                <div className="h-7 w-24 rounded-md animate-pulse" style={{ background: "var(--bg-elevated)" }} />
              ) : r.total > 0 ? (
                <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                  ₹{fmt(r.total)}
                </p>
              ) : (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No data</p>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ═══ Level 2: day-wise or flat table ═══ */
  return (
    <div className="space-y-5">
      <div>
        <button
          onClick={() => setDrillMonth(null)}
          className="text-xs font-semibold mb-1.5 flex items-center gap-1"
          style={{ color: "var(--accent-text)" }}
        >
          ← Back to months
        </button>
        <h2 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
          {title} <span style={{ color: "var(--text-muted)" }}>— {selectedShop.name} · {displayMonth(drillMonth)}</span>
        </h2>
      </div>

      {mode === "dayCards" ? (
        dayRows.length === 0 ? (
          <div className="rounded-2xl border p-10 text-center" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No {title.toLowerCase()} entries for {displayMonth(drillMonth)}.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayRows.map((e) => {
              const items = e[entriesKey] || [];
              const value = Number(e[field]) || 0;
              return (
                <div
                  key={e._id}
                  className="rounded-2xl border overflow-hidden"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "var(--shadow)" }}
                >
                  <div
                    className="flex items-center justify-between px-4 py-3 border-b"
                    style={{ borderColor: "var(--border-sub)", background: "var(--bg-elevated)" }}
                  >
                    <span className="text-sm font-bold" style={{ color: "var(--accent-text)" }}>
                      {fmtDate(e.date)}
                    </span>
                    <span className="tabular-nums font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                      ₹{fmt(value)}
                    </span>
                  </div>
                  {items.length > 0 ? (
                    <div className="divide-y" style={{ borderColor: "var(--border-sub)" }}>
                      {items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 px-4 py-2.5">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                              {it.name}
                            </p>
                            {it.note && (
                              <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                                {it.note}
                              </p>
                            )}
                          </div>
                          <span className="tabular-nums font-semibold text-sm shrink-0" style={{ color: "var(--accent-text)" }}>
                            ₹{fmt(it.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                      No itemized entries — direct amount only.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        (() => {
          const rows = flatRows();
          return rows.length === 0 ? (
            <div className="rounded-2xl border p-10 text-center" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No {title.toLowerCase()} entries for {displayMonth(drillMonth)}.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "var(--shadow)" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr style={{ background: "var(--bg-elevated)" }}>
                      {["Date", "Name", "Amount", "Note"].map((h, i) => (
                        <th
                          key={h}
                          className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b ${i === 2 ? "text-right" : "text-left"}`}
                          style={{ borderColor: "var(--border-sub)", color: "var(--text-muted)" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => (
                      <tr
                        key={idx}
                        className="border-b"
                        style={{ borderColor: "var(--border-sub)", background: idx % 2 === 0 ? "transparent" : "var(--bg-elevated)" }}
                      >
                        <td className="px-4 py-2.5 font-medium whitespace-nowrap" style={{ color: "var(--accent-text)" }}>
                          {fmtDate(r.date)}
                        </td>
                        <td className="px-4 py-2.5" style={{ color: "var(--text-primary)" }}>
                          {r.name}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-semibold" style={{ color: "var(--text-primary)" }}>
                          ₹{fmt(r.amount)}
                        </td>
                        <td className="px-4 py-2.5 text-xs" style={{ color: "var(--text-muted)" }}>
                          {r.note || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-bold text-sm" style={{ borderColor: "rgba(0,0,0,0.15)", background: "var(--bg-elevated)" }}>
                      <td className="px-4 py-2.5" colSpan={2} style={{ color: "var(--text-muted)" }}>TOTAL</td>
                      <td className="px-4 py-2.5 text-right tabular-nums" style={{ color: "var(--accent-text)" }}>
                        ₹{fmt(rows.reduce((s, r) => s + (r.amount || 0), 0))}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}
