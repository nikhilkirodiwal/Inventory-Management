import { useEffect, useMemo, useState } from "react";
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
const fmt = (n) =>
  n === undefined || n === null || isNaN(n)
    ? "—"
    : new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

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

export default function ProfitLossView() {
  const today = new Date();
  const currentMonthKey = toMonthKey(today.getFullYear(), today.getMonth() + 1);

  const [month, setMonth] = useState(currentMonthKey);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPnl = async (mk) => {
    try {
      setLoading(true);
      const { data } = await API.get("/pnl", { params: { month: mk } });
      setData(data.success ? data.data : null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load P&L");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPnl(month);
  }, [month]); // eslint-disable-line

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2
            className="font-bold text-lg"
            style={{ color: "var(--text-primary)" }}
          >
            Profit &amp; Loss
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Per-site: Total Sale + Patient Bill + UPI − Personal Cr − Salary −
            Expenses. Combined also subtracts Admin Expense.
          </p>
        </div>
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
      </div>

      {loading || !data ? (
        <div
          className="rounded-2xl border p-10 text-center"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
          }}
        >
          <p style={{ color: "var(--text-muted)" }}>Loading…</p>
        </div>
      ) : (
        <>
          {/* ── Per-Shop P&L ── */}
          <div>
            <h3
              className="font-bold text-sm mb-3 flex items-center gap-2"
              style={{ color: "var(--text-primary)" }}
            >
              Per-Site P&amp;L{" "}
              <span
                className="text-xs font-normal"
                style={{ color: "var(--text-muted)" }}
              >
                — Total Sale + Patient Bill + UPI − Personal Cr − Salary −
                Expenses
              </span>
            </h3>
            {data.perShop.length === 0 ? (
              <div
                className="rounded-2xl border p-6 text-center"
                style={{
                  background: "var(--bg-surface)",
                  borderColor: "var(--border)",
                }}
              >
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No shop entries for {displayMonth(month)}.
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
                        <th
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider border-b"
                          style={{
                            borderColor: "var(--border-sub)",
                            color: "var(--text-muted)",
                          }}
                        >
                          Site
                        </th>
                        <th
                          className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider border-b"
                          style={{
                            borderColor: "var(--border-sub)",
                            color: "var(--text-muted)",
                          }}
                        >
                          Total Sale
                        </th>
                        <th
                          className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider border-b"
                          style={{
                            borderColor: "var(--border-sub)",
                            color: "var(--text-muted)",
                          }}
                        >
                          Patient Bill
                        </th>
                        <th
                          className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider border-b"
                          style={{
                            borderColor: "var(--border-sub)",
                            color: "var(--text-muted)",
                          }}
                        >
                          UPI
                        </th>
                        <th
                          className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider border-b"
                          style={{
                            borderColor: "var(--border-sub)",
                            color: "var(--text-muted)",
                          }}
                        >
                          Personal Cr
                        </th>
                        <th
                          className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider border-b"
                          style={{
                            borderColor: "var(--border-sub)",
                            color: "var(--text-muted)",
                          }}
                        >
                          Salary
                        </th>
                        <th
                          className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider border-b"
                          style={{
                            borderColor: "var(--border-sub)",
                            color: "var(--text-muted)",
                          }}
                        >
                          Expenses
                        </th>
                        <th
                          className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider border-b"
                          style={{
                            borderColor: "var(--border-sub)",
                            color: "var(--text-muted)",
                          }}
                        >
                          Days
                        </th>
                        <th
                          className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider border-b"
                          style={{
                            borderColor: "var(--border-sub)",
                            color: "var(--text-muted)",
                          }}
                        >
                          P&amp;L
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.perShop.map((s, idx) => (
                        <tr
                          key={s.shopId}
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
                            className="px-4 py-3 font-semibold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {s.shopName}
                          </td>
                          <td
                            className="px-4 py-3 text-right tabular-nums"
                            style={{ color: "var(--accent-text)" }}
                          >
                            ₹{fmt(s.totalSale)}
                          </td>
                          <td
                            className="px-4 py-3 text-right tabular-nums"
                            style={{ color: "var(--accent-text)" }}
                          >
                            ₹{fmt(s.patientBill)}
                          </td>
                          <td
                            className="px-4 py-3 text-right tabular-nums"
                            style={{ color: "var(--accent-text)" }}
                          >
                            ₹{fmt(s.upiReceived)}
                          </td>
                          <td
                            className="px-4 py-3 text-right tabular-nums"
                            style={{ color: "var(--danger-text)" }}
                          >
                            ₹{fmt(s.personalCr)}
                          </td>
                          <td
                            className="px-4 py-3 text-right tabular-nums"
                            style={{ color: "var(--danger-text)" }}
                          >
                            ₹{fmt(s.salary)}
                          </td>
                          <td
                            className="px-4 py-3 text-right tabular-nums"
                            style={{ color: "var(--danger-text)" }}
                          >
                            ₹{fmt(s.cashExpenses)}
                          </td>
                          <td
                            className="px-4 py-3 text-right tabular-nums"
                            style={{ color: "var(--text-sec)" }}
                          >
                            {s.days}
                          </td>
                          <td className="px-4 py-3 text-right font-bold tabular-nums">
                            <Badge
                              variant={
                                s.profitLoss >= 0 ? "positive" : "negative"
                              }
                            >
                              ₹{fmt(s.profitLoss)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ── Combined P&L ── */}
          <div>
            <h3
              className="font-bold text-sm mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              Combined P&amp;L{" "}
              <span
                className="text-xs font-normal"
                style={{ color: "var(--text-muted)" }}
              >
                — every site added together, minus business-wide Admin Expense
              </span>
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
                  Total Revenue
                </p>
                <p
                  className="text-2xl font-black mt-1 tabular-nums"
                  style={{ color: "var(--accent-text)" }}
                >
                  ₹{fmt(data.combined.revenue)}
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
                  Total Expenses
                </p>
                <p
                  className="text-2xl font-black mt-1 tabular-nums"
                  style={{ color: "var(--danger-text)" }}
                >
                  ₹{fmt(data.combined.expenses)}
                </p>
              </div>
              <div
                className="rounded-2xl px-5 py-4 border lg:col-span-2"
                style={{
                  background:
                    data.combined.profitLoss >= 0
                      ? "rgba(34,197,94,0.05)"
                      : "var(--danger-soft)",
                  borderColor:
                    data.combined.profitLoss >= 0
                      ? "rgba(34,197,94,0.3)"
                      : "var(--danger-border)",
                  boxShadow: "var(--shadow)",
                }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{
                    color:
                      data.combined.profitLoss >= 0
                        ? "#22c55e"
                        : "var(--danger-text)",
                  }}
                >
                  Net Profit / Loss
                </p>
                <p
                  className="text-2xl font-black mt-1 tabular-nums"
                  style={{
                    color:
                      data.combined.profitLoss >= 0
                        ? "#22c55e"
                        : "var(--danger-text)",
                  }}
                >
                  ₹{fmt(data.combined.profitLoss)}
                </p>
              </div>
            </div>

            <div
              className="rounded-2xl border p-5"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border)",
                boxShadow: "var(--shadow)",
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: "var(--text-muted)" }}
              >
                How this is built
              </p>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div
                  className="flex justify-between rounded-lg px-3 py-2"
                  style={{ background: "var(--bg-elevated)" }}
                >
                  <span style={{ color: "var(--text-sec)" }}>
                    Total Sale (all sites)
                  </span>
                  <span
                    className="font-semibold tabular-nums"
                    style={{ color: "var(--accent-text)" }}
                  >
                    + ₹{fmt(data.combined.totalSale)}
                  </span>
                </div>
                <div
                  className="flex justify-between rounded-lg px-3 py-2"
                  style={{ background: "var(--bg-elevated)" }}
                >
                  <span style={{ color: "var(--text-sec)" }}>
                    Patient Bill (all sites)
                  </span>
                  <span
                    className="font-semibold tabular-nums"
                    style={{ color: "var(--accent-text)" }}
                  >
                    + ₹{fmt(data.combined.patientBill)}
                  </span>
                </div>
                <div
                  className="flex justify-between rounded-lg px-3 py-2"
                  style={{ background: "var(--bg-elevated)" }}
                >
                  <span style={{ color: "var(--text-sec)" }}>
                    UPI Received (all sites)
                  </span>
                  <span
                    className="font-semibold tabular-nums"
                    style={{ color: "var(--accent-text)" }}
                  >
                    + ₹{fmt(data.combined.upiReceived)}
                  </span>
                </div>
                <div
                  className="flex justify-between rounded-lg px-3 py-2 sm:col-start-1"
                  style={{ background: "var(--bg-elevated)" }}
                >
                  <span style={{ color: "var(--text-sec)" }}>
                    Personal Cr (all sites)
                  </span>
                  <span
                    className="font-semibold tabular-nums"
                    style={{ color: "var(--danger-text)" }}
                  >
                    − ₹{fmt(data.combined.personalCr)}
                  </span>
                </div>
                <div
                  className="flex justify-between rounded-lg px-3 py-2"
                  style={{ background: "var(--bg-elevated)" }}
                >
                  <span style={{ color: "var(--text-sec)" }}>
                    Salary (all sites)
                  </span>
                  <span
                    className="font-semibold tabular-nums"
                    style={{ color: "var(--danger-text)" }}
                  >
                    − ₹{fmt(data.combined.salary)}
                  </span>
                </div>
                <div
                  className="flex justify-between rounded-lg px-3 py-2"
                  style={{ background: "var(--bg-elevated)" }}
                >
                  <span style={{ color: "var(--text-sec)" }}>
                    Cash Expenses (all sites)
                  </span>
                  <span
                    className="font-semibold tabular-nums"
                    style={{ color: "var(--danger-text)" }}
                  >
                    − ₹{fmt(data.combined.cashExpenses)}
                  </span>
                </div>
                <div
                  className="flex justify-between rounded-lg px-3 py-2"
                  style={{ background: "var(--bg-elevated)" }}
                >
                  <span style={{ color: "var(--text-sec)" }}>
                    Admin Expense (business-wide)
                  </span>
                  <span
                    className="font-semibold tabular-nums"
                    style={{ color: "var(--danger-text)" }}
                  >
                    − ₹{fmt(data.combined.adminExpense)}
                  </span>
                </div>
                <div
                  className="flex justify-between rounded-lg px-3 py-2"
                  style={{ background: "var(--bg-elevated)" }}
                >
                  <span style={{ color: "var(--text-sec)" }}>
                    Vendor spend (informational — already inside Cash Expenses)
                  </span>
                  <span
                    className="font-semibold tabular-nums"
                    style={{ color: "var(--text-muted)" }}
                  >
                    ₹{fmt(data.combined.vendor)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
