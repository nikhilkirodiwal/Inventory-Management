import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import useMonthlyDaybook from "../hooks/useMonthlyDaybook";
import {
  toMonthKey,
  displayMonth,
  yearsFrom,
  monthsForYear,
  fmt,
  normalizeExpenses,
} from "../utils/daybook";

/* ═══════════════════════════════════════════════════════════════════════════
   Site Reports — built from the same daybook entries the dashboard loads.
   Each builder returns { summary, chart?, sections } so the screen view,
   Print/PDF and the Excel download all share one source of truth.
═══════════════════════════════════════════════════════════════════════════ */

const n = (v) => Number(v) || 0;
const dayKey = (d) => String(d || "").slice(0, 10);
const coffee = (e) => n(e.coffeeShop ?? e.coffeeShopSale);
const sum = (rows, k) => rows.reduce((s, r) => s + n(r[k]), 0);
const nameOf = (it) => String(it?.name || "").trim() || "Unnamed";

/* ─── Date helpers (timezone-safe: always read the YYYY-MM-DD part) ───────── */
const asUTC = (d) => {
  const [y, m, dd] = dayKey(d).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, dd));
};
const dateFmt = (d, opts) =>
  asUTC(d).toLocaleDateString("en-IN", { ...opts, timeZone: "UTC" });
const fmtShort = (d) =>
  dateFmt(d, { day: "2-digit", month: "short", year: "numeric" }); // 01 Sep 2026
const fmtLong = (d) =>
  dateFmt(d, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }); // Tue, 01 Sep 2026
const weekday = (d) => dateFmt(d, { weekday: "short" });
const toLocalNoon = (d) => {
  const [y, m, dd] = dayKey(d).split("-").map(Number);
  return new Date(y, m - 1, dd, 12); // noon avoids any timezone day-shift in Excel
};

const compact = (v) => {
  const a = Math.abs(v);
  const s =
    a >= 1e7
      ? `${(a / 1e7).toFixed(1)}Cr`
      : a >= 1e5
        ? `${(a / 1e5).toFixed(1)}L`
        : a >= 1e3
          ? `${(a / 1e3).toFixed(1)}k`
          : `${Math.round(a)}`;
  return (v < 0 ? "-" : "") + s.replace(".0", "");
};

/* column helpers */
const DT = { key: "date", label: "Date", type: "date" };
const T = (key, label, extra) => ({ key, label, type: "text", ...extra });
const M = (key, label, extra) => ({
  key,
  label,
  type: "money",
  align: "right",
  sum: true,
  ...extra,
});
const N = (key, label, extra) => ({
  key,
  label,
  type: "num",
  align: "right",
  sum: true,
  ...extra,
});
const P = (key, label, extra) => ({
  key,
  label,
  type: "pct",
  align: "right",
  sum: true,
  ...extra,
});

/* ─── Report builders ─────────────────────────────────────────────────────── */

function buildSales(entries, { yearly }) {
  const rows = entries.map((e) => ({
    date: e.date,
    kitchen: n(e.kitchenSale),
    coffee: coffee(e),
    counter: n(e.counterSale),
    total: n(e.totalSale),
  }));
  const total = sum(rows, "total");
  const best = rows.reduce((b, r) => (!b || r.total > b.total ? r : b), null);
  const lines = (r) => [
    { k: "Kitchen", v: r.kitchen },
    { k: "Coffee shop", v: r.coffee },
    { k: "Counter sale", v: r.counter },
    { k: "Total sale", v: r.total, bold: true },
  ];

  let items;
  if (yearly) {
    const by = {};
    rows.forEach((r) => {
      const k = dayKey(r.date).slice(0, 7);
      if (!by[k]) by[k] = { kitchen: 0, coffee: 0, counter: 0, total: 0 };
      ["kitchen", "coffee", "counter", "total"].forEach(
        (f) => (by[k][f] += r[f]),
      );
    });
    items = Object.entries(by).map(([k, r]) => ({
      label: displayMonth(k).slice(0, 3),
      value: r.total,
      tip: { title: displayMonth(k), lines: lines(r) },
    }));
  } else {
    items = rows.map((r) => ({
      label: dayKey(r.date).slice(8),
      sub: weekday(r.date),
      value: r.total,
      tip: { title: fmtLong(r.date), lines: lines(r) },
    }));
  }
  const avg = items.length
    ? items.reduce((s, i) => s + i.value, 0) / items.length
    : 0;

  return {
    summary: [
      {
        label: "Total sales",
        value: total,
        money: true,
        tone: "accent",
        hint: "Kitchen + Coffee shop + Counter sale for the whole period.",
      },
      {
        label: "Kitchen",
        value: sum(rows, "kitchen"),
        money: true,
        hint: "All kitchen sub-tabs combined.",
      },
      {
        label: "Coffee shop",
        value: sum(rows, "coffee"),
        money: true,
        hint: "All coffee shop sub-tabs combined.",
      },
      {
        label: "Counter sale",
        value: sum(rows, "counter"),
        money: true,
        hint: "All counter sale sub-tabs combined.",
      },
      {
        label: "Average per day",
        value: rows.length ? total / rows.length : 0,
        money: true,
        hint: "Total sales divided by the days that have an entry.",
      },
      {
        label: "Best day",
        value: best ? fmtShort(best.date) : "—",
        sub: best ? `₹${fmt(best.total)}` : "",
        hint: "The day with the highest total sale.",
      },
    ],
    chart: {
      type: "columns",
      title: yearly ? "Total sale by month" : "Total sale by day",
      items,
      avg,
    },
    sections: [
      {
        columns: [
          DT,
          M("kitchen", "Kitchen"),
          M("coffee", "Coffee Shop"),
          M("counter", "Counter Sale"),
          M("total", "Total Sale", { bold: true }),
        ],
        rows,
      },
    ],
  };
}

function buildCash(entries) {
  const rows = entries.map((e) => {
    const exp = n(e.cashExpenses);
    const off = n(e.cashToOffice);
    return {
      date: e.date,
      opening: n(e.openingCash),
      sale: n(e.totalSale),
      ded: n(e.officialCr) + n(e.personalCr) + n(e.upiReceived),
      totalCash: n(e.totalCash),
      exp,
      off,
      inHand: n(e.cashInHand ?? e.closingCash ?? n(e.totalCash) - exp - off),
    };
  });
  const last = rows[rows.length - 1];
  return {
    summary: [
      {
        label: "Total sale",
        value: sum(rows, "sale"),
        money: true,
        tone: "accent",
        hint: "Kitchen + Coffee shop + Counter sale.",
      },
      {
        label: "Credits + UPI",
        value: sum(rows, "ded"),
        money: true,
        hint: "Official Cr. + Personal Cr. + UPI received. These reduce cash in the drawer.",
      },
      {
        label: "Cash expenses",
        value: sum(rows, "exp"),
        money: true,
        hint: "Expense categories + Salary + Advance + Overtime.",
      },
      {
        label: "Cash to office",
        value: sum(rows, "off"),
        money: true,
        hint: "Cash sent to office / partners.",
      },
      {
        label: "Closing cash",
        value: last ? last.inHand : 0,
        money: true,
        tone: last && last.inHand < 0 ? "danger" : "accent",
        sub: last ? `as on ${fmtShort(last.date)}` : "",
        hint: "Cash in hand on the last day. It becomes the next day's opening cash.",
      },
    ],
    chart: {
      type: "columns",
      title: "Closing cash by day",
      items: rows.map((r) => ({
        label: dayKey(r.date).slice(8),
        sub: weekday(r.date),
        value: r.inHand,
        tip: {
          title: fmtLong(r.date),
          lines: [
            { k: "Opening cash", v: r.opening },
            { k: "Total sale", v: r.sale },
            { k: "Credits + UPI", v: r.ded },
            { k: "Cash expenses", v: r.exp },
            { k: "Cash to office", v: r.off },
            { k: "Cash in hand", v: r.inHand, bold: true },
          ],
        },
      })),
    },
    sections: [
      {
        columns: [
          DT,
          M("opening", "Opening", { sum: false }),
          M("sale", "Total Sale"),
          M("ded", "Cr. + UPI"),
          M("totalCash", "Total Cash", { sum: false }),
          M("exp", "Cash Exp."),
          M("off", "To Office"),
          M("inHand", "Cash In Hand", { sum: false, bold: true, signed: true }),
        ],
        rows,
      },
    ],
  };
}

function buildCredit(entries) {
  const rows = entries.map((e) => {
    const credited = (e.personalCrEntries || []).reduce(
      (s, it) => s + Math.min(n(it.creditedAmount), n(it.amount)),
      0,
    );
    return {
      date: e.date,
      official: n(e.officialCr),
      personal: n(e.personalCr),
      upi: n(e.upiReceived),
      credited,
      pending: Math.max(0, n(e.personalCr) - credited),
    };
  });

  const map = {};
  entries.forEach((e) =>
    (e.personalCrEntries || []).forEach((it) => {
      const name = nameOf(it);
      const amt = n(it.amount);
      const cr = Math.min(n(it.creditedAmount), amt);
      if (!map[name])
        map[name] = { name, count: 0, amount: 0, credited: 0, pending: 0 };
      map[name].count += 1;
      map[name].amount += amt;
      map[name].credited += cr;
      map[name].pending += Math.max(0, amt - cr);
    }),
  );
  const people = Object.values(map).sort(
    (a, b) => b.pending - a.pending || a.name.localeCompare(b.name),
  );
  const pendingPeople = people.filter((p) => p.pending > 0).slice(0, 10);

  return {
    summary: [
      {
        label: "Patient bill",
        value: sum(rows, "official"),
        money: true,
        hint: "Official Cr. — bills raised to be settled later.",
      },
      {
        label: "Personal Cr.",
        value: sum(rows, "personal"),
        money: true,
        hint: "Total personal credit given in this period.",
      },
      {
        label: "Personal received",
        value: sum(rows, "credited"),
        money: true,
        hint: "Part of Personal Cr. already credited back.",
      },
      {
        label: "Personal pending",
        value: sum(rows, "pending"),
        money: true,
        tone: "danger",
        hint: "Personal Cr. minus the amount already credited.",
      },
      {
        label: "UPI received",
        value: sum(rows, "upi"),
        money: true,
        tone: "accent",
        hint: "Payments received through UPI.",
      },
    ],
    chart: pendingPeople.length
      ? {
          type: "hbars",
          title: "Pending personal Cr. by person",
          items: pendingPeople.map((p) => ({
            label: p.name,
            value: p.pending,
            tip: {
              title: p.name,
              lines: [
                { k: "Entries", t: String(p.count) },
                { k: "Amount", v: p.amount },
                { k: "Received", v: p.credited },
                { k: "Pending", v: p.pending, bold: true },
              ],
            },
          })),
        }
      : null,
    sections: [
      {
        heading: "Day-wise credits",
        columns: [
          DT,
          M("official", "Official Cr."),
          M("personal", "Personal Cr."),
          M("credited", "Personal Received"),
          M("pending", "Personal Pending", { bold: true }),
          M("upi", "UPI Received"),
        ],
        rows,
      },
      {
        heading: "Personal Cr. — pending by person",
        columns: [
          T("name", "Name"),
          N("count", "Entries"),
          M("amount", "Amount"),
          M("credited", "Received"),
          M("pending", "Pending", { bold: true }),
        ],
        rows: people,
      },
    ],
  };
}

function buildExpenses(entries) {
  const cats = {};
  const items = {};
  const add = (k, v) => {
    if (n(v) > 0) cats[k] = (cats[k] || 0) + n(v);
  };
  entries.forEach((e) => {
    Object.entries(normalizeExpenses(e.expenseEntries)).forEach(([k, v]) =>
      add(k, v),
    );
    add("Salary", e.salary);
    add("Advance", e.advance);
    add("Overtime", e.overtime);
    Object.entries(e.expenseSubEntries || {}).forEach(([cat, list]) =>
      (list || []).forEach((it) => {
        const key = `${cat}||${it.name}`;
        if (!items[key])
          items[key] = { category: cat, name: it.name || "—", amount: 0 };
        items[key].amount += n(it.amount);
      }),
    );
  });
  const total = Object.values(cats).reduce((s, v) => s + v, 0);
  const salesTotal = sum(entries, "totalSale");
  const rows = Object.entries(cats)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({
      category,
      amount,
      share: total ? (amount / total) * 100 : 0,
    }));
  const itemRows = Object.values(items).sort(
    (a, b) => a.category.localeCompare(b.category) || b.amount - a.amount,
  );

  return {
    summary: [
      {
        label: "Total cash expenses",
        value: total,
        money: true,
        tone: "danger",
        hint: "Every expense category plus Salary, Advance and Overtime.",
      },
      {
        label: "Top category",
        value: rows[0]?.category || "—",
        sub: rows[0] ? `₹${fmt(rows[0].amount)}` : "",
        hint: "The category where the most cash went.",
      },
      {
        label: "Average per day",
        value: entries.length ? total / entries.length : 0,
        money: true,
        hint: "Total expenses divided by days with an entry.",
      },
      {
        label: "Expense vs sale",
        value: salesTotal ? `${((total / salesTotal) * 100).toFixed(1)}%` : "—",
        sub: "of total sale",
        hint: "How much of every ₹100 of sale went to cash expenses.",
      },
    ],
    chart: {
      type: "hbars",
      title: "Spend by category (top 10)",
      items: rows.slice(0, 10).map((r) => ({
        label: r.category,
        value: r.amount,
        tip: {
          title: r.category,
          lines: [
            { k: "Amount", v: r.amount },
            { k: "Share of expenses", t: `${r.share.toFixed(1)}%`, bold: true },
          ],
        },
      })),
    },
    sections: [
      {
        heading: "Category-wise",
        columns: [
          T("category", "Category"),
          M("amount", "Amount", { bold: true }),
          P("share", "Share"),
        ],
        rows,
      },
      {
        heading: "Itemised subnames",
        columns: [
          T("category", "Category"),
          T("name", "Subname"),
          M("amount", "Amount", { bold: true }),
        ],
        rows: itemRows,
      },
    ],
  };
}

function buildPayroll(entries) {
  const people = {};
  const ledger = [];
  const kinds = [
    ["salaryEntries", "Salary", "salary"],
    ["advanceEntries", "Advance", "advance"],
    ["overtimeEntries", "Overtime", "overtime"],
  ];
  entries.forEach((e) =>
    kinds.forEach(([key, label, field]) =>
      (e[key] || []).forEach((it) => {
        const name = nameOf(it);
        if (!people[name])
          people[name] = {
            name,
            role: "",
            salary: 0,
            advance: 0,
            overtime: 0,
            total: 0,
          };
        const p = people[name];
        p[field] += n(it.amount);
        p.total += n(it.amount);
        if (field === "salary" && it.role)
          p.role = it.role === "off-role" ? "Off-role" : "On-role";
        ledger.push({
          date: e.date,
          type: label,
          name,
          amount: n(it.amount),
          note: it.note || "",
        });
      }),
    ),
  );
  const rows = Object.values(people).sort((a, b) => b.total - a.total);

  return {
    summary: [
      {
        label: "Salary",
        value: sum(rows, "salary"),
        money: true,
        hint: "Salary paid in this period.",
      },
      {
        label: "Advance",
        value: sum(rows, "advance"),
        money: true,
        hint: "Advances given in this period.",
      },
      {
        label: "Overtime",
        value: sum(rows, "overtime"),
        money: true,
        hint: "Overtime paid in this period.",
      },
      {
        label: "Total payout",
        value: sum(rows, "total"),
        money: true,
        tone: "accent",
        hint: "Salary + Advance + Overtime.",
      },
      {
        label: "People paid",
        value: rows.length,
        hint: "Distinct names with at least one payment.",
      },
    ],
    chart: {
      type: "hbars",
      title: "Payout by person (top 10)",
      items: rows.slice(0, 10).map((r) => ({
        label: r.name,
        value: r.total,
        tip: {
          title: r.name + (r.role ? ` · ${r.role}` : ""),
          lines: [
            { k: "Salary", v: r.salary },
            { k: "Advance", v: r.advance },
            { k: "Overtime", v: r.overtime },
            { k: "Total", v: r.total, bold: true },
          ],
        },
      })),
    },
    sections: [
      {
        heading: "Summary by person",
        columns: [
          T("name", "Name"),
          T("role", "Role"),
          M("salary", "Salary"),
          M("advance", "Advance"),
          M("overtime", "Overtime"),
          M("total", "Total", { bold: true }),
        ],
        rows,
      },
      {
        heading: "Payment ledger",
        columns: [
          DT,
          T("type", "Type"),
          T("name", "Name"),
          M("amount", "Amount", { bold: true }),
          T("note", "Note"),
        ],
        rows: ledger,
      },
    ],
  };
}

const purchaseMeta = (it) =>
  it.entryMode === "bill"
    ? [
        it.billNo ? `Bill No. ${it.billNo}` : "",
        it.rate ? `Rate ${fmt(it.rate)}` : "",
      ]
        .filter(Boolean)
        .join(" | ")
    : [
        it.quantity ? `Qty ${it.quantity}` : "",
        it.rate ? `Rate ${fmt(it.rate)}` : "",
      ]
        .filter(Boolean)
        .join(" | ");

function buildPurchase(entries) {
  const rows = [];
  const map = {};
  entries.forEach((e) =>
    (e.purchaseCreditEntries || []).forEach((it) => {
      const name = nameOf(it);
      rows.push({
        date: e.date,
        name,
        details: purchaseMeta(it),
        note: it.note || "",
        amount: n(it.amount),
      });
      if (!map[name]) map[name] = { name, count: 0, amount: 0 };
      map[name].count += 1;
      map[name].amount += n(it.amount);
    }),
  );
  const byName = Object.values(map).sort((a, b) => b.amount - a.amount);
  const largest = rows.reduce(
    (b, r) => (!b || r.amount > b.amount ? r : b),
    null,
  );

  return {
    summary: [
      {
        label: "Bought on credit",
        value: sum(rows, "amount"),
        money: true,
        tone: "danger",
        hint: "Goods bought on credit. Not counted in cash expenses.",
      },
      {
        label: "Entries",
        value: rows.length,
        hint: "Number of purchase credit entries.",
      },
      { label: "Names", value: byName.length, hint: "Distinct credit names." },
      {
        label: "Largest entry",
        value: largest ? `₹${fmt(largest.amount)}` : "—",
        sub: largest ? largest.name : "",
        hint: "The single biggest purchase on credit.",
      },
    ],
    chart: {
      type: "hbars",
      title: "Credit by name (top 10)",
      items: byName.slice(0, 10).map((r) => ({
        label: r.name,
        value: r.amount,
        tip: {
          title: r.name,
          lines: [
            { k: "Entries", t: String(r.count) },
            { k: "Amount", v: r.amount, bold: true },
          ],
        },
      })),
    },
    sections: [
      {
        heading: "By name",
        columns: [
          T("name", "Name"),
          N("count", "Entries"),
          M("amount", "Amount", { bold: true }),
        ],
        rows: byName,
      },
      {
        heading: "All entries",
        columns: [
          DT,
          T("name", "Name"),
          T("details", "Details"),
          T("note", "Note"),
          M("amount", "Amount", { bold: true }),
        ],
        rows,
      },
    ],
  };
}

const REPORTS = [
  {
    id: "sales",
    icon: "📈",
    label: "Sales report",
    desc: "Kitchen, coffee & counter sale",
    build: buildSales,
  },
  {
    id: "cash",
    icon: "💵",
    label: "Cash flow",
    desc: "Opening to closing cash, day by day",
    build: buildCash,
  },
  {
    id: "credit",
    icon: "🧾",
    label: "Credit report",
    desc: "Patient bill, personal Cr. & UPI",
    build: buildCredit,
  },
  {
    id: "expenses",
    icon: "📉",
    label: "Expense report",
    desc: "Category & subname breakdown",
    build: buildExpenses,
  },
  {
    id: "payroll",
    icon: "👥",
    label: "Payroll report",
    desc: "Salary, advance & overtime",
    build: buildPayroll,
  },
  {
    id: "purchase",
    icon: "🛒",
    label: "Purchase credit",
    desc: "Goods bought on credit",
    build: buildPurchase,
  },
];

/* ─── Table + Excel helpers ───────────────────────────────────────────────── */

const cellText = (c, v) => {
  if (c.type === "money") return n(v) === 0 ? "–" : fmt(v);
  if (c.type === "pct") return `${n(v).toFixed(1)}%`;
  if (c.type === "num") return v;
  return v || "—";
};

const footerCells = (sec, raw = false) =>
  sec.columns.map((c, i) => {
    if (i === 0) return "TOTAL";
    if (!c.sum) return "";
    const t = sum(sec.rows, c.key);
    if (raw) return t;
    if (c.type === "money") return `₹${fmt(t)}`;
    if (c.type === "pct") return `${t.toFixed(1)}%`;
    return t;
  });

const MONEY_Z = "#,##0.00";

/* Real .xlsx: true date cells, number formats and sized columns (no "#####"). */
async function downloadXLSX(report, data, meta, fileBase) {
  const XLSX = await import("xlsx");
  const aoa = [];
  const fmts = [];
  const widths = [];
  const push = (row, measure = true) => {
    if (measure)
      row.forEach((v, i) => {
        const len =
          v instanceof Date
            ? 12
            : typeof v === "number"
              ? fmt(v).length + 3
              : String(v ?? "").length;
        widths[i] = Math.max(widths[i] || 8, Math.min(len + 2, 42));
      });
    aoa.push(row);
    return aoa.length - 1;
  };
  const zFor = (c) =>
    c.type === "date"
      ? "dd mmm yyyy"
      : c.type === "money"
        ? MONEY_Z
        : c.type === "pct"
          ? '0.0"%"'
          : null;

  push([meta.shop], false);
  push([`${report.label} — ${meta.period}`], false);
  push([`Generated ${meta.generated}`], false);
  push([], false);
  data.summary.forEach((s) => {
    const r = push([s.label, s.money ? n(s.value) : s.value]);
    if (s.money) fmts.push({ r, c: 1, z: MONEY_Z });
  });
  data.sections.forEach((sec) => {
    if (!sec.rows.length) return;
    push([], false);
    if (sec.heading) push([sec.heading], false);
    push(sec.columns.map((c) => c.label));
    sec.rows.forEach((row) => {
      const r = push(
        sec.columns.map((c) =>
          c.type === "date"
            ? toLocalNoon(row[c.key])
            : c.type === "pct"
              ? n(row[c.key])
              : row[c.key],
        ),
      );
      sec.columns.forEach(
        (c, ci) => zFor(c) && fmts.push({ r, c: ci, z: zFor(c) }),
      );
    });
    const fr = push(footerCells(sec, true));
    sec.columns.forEach(
      (c, ci) =>
        c.sum &&
        c.type !== "num" &&
        zFor(c) &&
        fmts.push({ r: fr, c: ci, z: zFor(c) }),
    );
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa, { cellDates: true });
  fmts.forEach(({ r, c, z }) => {
    const cell = ws[XLSX.utils.encode_cell({ r, c })];
    if (cell) cell.z = z;
  });
  ws["!cols"] = Array.from(widths, (w) => ({ wch: w || 8 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    ws,
    report.label.replace(/[\\/?*[\]:]/g, "").slice(0, 31),
  );
  XLSX.writeFile(wb, `${fileBase}.xlsx`, { cellDates: true });
}

/* ─── Styles: hover tooltips (screen) + A4 landscape print ────────────────── */
const PAGE_CSS = `
.rp-tip { display: none; }
.rp-col:hover .rp-tip, .rp-col:focus .rp-tip { display: block; }
.rp-col { outline: none; }
.rp-bar { opacity: .8; transition: opacity .15s, transform .15s; transform-origin: bottom; }
.rp-col:hover .rp-bar, .rp-col:focus .rp-bar { opacity: 1; transform: scaleY(1.02); }
.rp-card { transition: transform .15s, box-shadow .15s; }
.rp-card:hover { transform: translateY(-2px); }
.rp-row:hover td { background: var(--bg-hover); }
@page { size: A4 landscape; margin: 10mm; }
@media print {
  .no-print, .rp-tip { display: none !important; }
  .reports-root { background: #fff !important; min-height: 0 !important; }
  .reports-main { display: block !important; padding: 0 !important; max-width: none !important; }
  .report-sheet {
    --bg-base:#fff; --bg-surface:#fff; --bg-elevated:#f3f4f6; --bg-hover:#f3f4f6;
    --text-primary:#111827; --text-sec:#374151; --text-muted:#6b7280;
    --border:#d1d5db; --border-sub:#e5e7eb;
    --accent:#1d4ed8; --accent-text:#1d4ed8; --accent-soft:#eff6ff; --accent-border:#bfdbfe;
    --danger-text:#b91c1c; --danger-soft:#fef2f2; --danger-border:#fecaca; --shadow:none;
    background:#fff !important; color:#111827 !important; border:none !important; box-shadow:none !important;
  }
  .rp-bar { opacity: 1 !important; }
  .report-block, .report-sheet tr { break-inside: avoid; }
  .report-sheet thead { display: table-header-group; }
  .report-sheet .overflow-x-auto { overflow: visible !important; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}`;

/* ─── Presentational pieces ───────────────────────────────────────────────── */

function TipBody({ tip, className = "" }) {
  return (
    <div
      className={`rp-tip absolute z-30 rounded-xl border px-3 py-2.5 text-xs whitespace-nowrap ${className}`}
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border)",
        color: "var(--text-primary)",
        boxShadow: "0 10px 30px rgba(0,0,0,.22)",
      }}
    >
      <p className="font-bold mb-1.5" style={{ color: "var(--accent-text)" }}>
        {tip.title}
      </p>
      {tip.lines.map((l) => (
        <div
          key={l.k}
          className="flex justify-between gap-6 py-0.5"
          style={{
            fontWeight: l.bold ? 700 : 400,
            borderTop: l.bold ? "1px solid var(--border-sub)" : undefined,
            marginTop: l.bold ? 4 : 0,
            paddingTop: l.bold ? 4 : undefined,
          }}
        >
          <span style={{ color: "var(--text-muted)" }}>{l.k}</span>
          <span className="tabular-nums">{l.t ?? `₹${fmt(l.v)}`}</span>
        </div>
      ))}
    </div>
  );
}

function SummaryCard({ s, idx }) {
  const tone =
    s.tone === "accent"
      ? {
          bg: "var(--accent-soft)",
          bc: "var(--accent-border)",
          c: "var(--accent-text)",
        }
      : s.tone === "danger"
        ? {
            bg: "var(--danger-soft)",
            bc: "var(--danger-border)",
            c: "var(--danger-text)",
          }
        : {
            bg: "var(--bg-surface)",
            bc: "var(--border)",
            c: "var(--text-primary)",
          };
  return (
    <div
      tabIndex={0}
      className="rp-col rp-card report-block relative rounded-xl border px-4 py-3 min-w-0 cursor-default"
      style={{ background: tone.bg, borderColor: tone.bc }}
    >
      <p
        className="text-xs font-semibold truncate"
        style={{ color: "var(--text-muted)" }}
      >
        {s.label}
      </p>
      <p
        className="text-lg font-bold tabular-nums mt-1 truncate"
        style={{ color: tone.c }}
      >
        {s.money ? `₹${fmt(s.value)}` : s.value}
      </p>
      {s.sub && (
        <p className="text-xs truncate" style={{ color: "var(--text-sec)" }}>
          {s.sub}
        </p>
      )}
      {s.hint && (
        <div
          className={`rp-tip absolute top-full mt-1.5 z-30 w-56 rounded-lg border px-3 py-2 text-xs leading-snug ${idx % 6 >= 3 ? "right-0" : "left-0"}`}
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
            color: "var(--text-sec)",
            boxShadow: "0 10px 30px rgba(0,0,0,.22)",
          }}
        >
          {s.hint}
        </div>
      )}
    </div>
  );
}

function Chart({ chart }) {
  if (!chart || !chart.items.length) return null;
  const max = Math.max(...chart.items.map((i) => Math.abs(i.value)), 1);
  const len = chart.items.length;
  const H = 190;

  return (
    <div
      className="report-block rounded-xl border p-4"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <p
          className="text-sm font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {chart.title}
        </p>
        <p
          className="text-[11px] no-print"
          style={{ color: "var(--text-muted)" }}
        >
          Hover a {chart.type === "columns" ? "bar" : "row"} for details
        </p>
      </div>

      {chart.type === "columns" ? (
        <div className="pl-11">
          <div className="relative" style={{ height: H }}>
            {[0, 1, 2, 3, 4].map((t) => (
              <div
                key={t}
                className="absolute left-0 right-0 border-t border-dashed"
                style={{
                  bottom: `${t * 25}%`,
                  borderColor: "var(--border-sub)",
                }}
              >
                <span
                  className="absolute -left-11 -translate-y-1/2 w-9 text-right text-[10px] tabular-nums"
                  style={{ color: "var(--text-muted)" }}
                >
                  {compact((max * t) / 4)}
                </span>
              </div>
            ))}
            {chart.avg > 0 && (
              <div
                className="absolute left-0 right-0 border-t-2 border-dashed pointer-events-none z-10"
                style={{
                  bottom: `${(chart.avg / max) * 100}%`,
                  borderColor: "var(--danger-text)",
                  opacity: 0.55,
                }}
              >
                <span
                  className="absolute right-0 -translate-y-full text-[10px] font-semibold px-1.5 rounded"
                  style={{
                    color: "var(--danger-text)",
                    background: "var(--bg-surface)",
                  }}
                >
                  Avg ₹{compact(chart.avg)}
                </span>
              </div>
            )}
            <div className="absolute inset-0 flex items-end gap-1.5 px-1">
              {chart.items.map((i, idx) => (
                <div
                  key={idx}
                  tabIndex={0}
                  className="rp-col relative flex-1 h-full flex items-end justify-center cursor-pointer"
                >
                  <div
                    className="rp-bar w-full max-w-14 rounded-t-md"
                    style={{
                      height: `${Math.max(1.5, (Math.abs(i.value) / max) * 100)}%`,
                      background:
                        i.value < 0 ? "var(--danger-text)" : "var(--accent)",
                    }}
                  />
                  {i.tip && (
                    <TipBody
                      tip={i.tip}
                      className={`bottom-full mb-2 ${idx < 2 ? "left-0" : idx >= len - 2 ? "right-0" : "left-1/2 -translate-x-1/2"}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-1.5 px-1 mt-1.5">
            {chart.items.map((i, idx) => (
              <div key={idx} className="flex-1 text-center leading-tight">
                <span
                  className="block text-[10px] font-semibold"
                  style={{ color: "var(--text-sec)" }}
                >
                  {i.label}
                </span>
                {i.sub && len <= 12 && (
                  <span
                    className="block text-[9px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {i.sub}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {chart.items.map((i, idx) => (
            <div
              key={idx}
              tabIndex={0}
              className="rp-col relative flex items-center gap-3 rounded-lg px-2 py-1.5 cursor-pointer"
            >
              <span
                className="w-32 shrink-0 truncate text-xs font-medium"
                style={{ color: "var(--text-sec)" }}
              >
                {i.label}
              </span>
              <div
                className="flex-1 h-3 rounded-full overflow-hidden"
                style={{ background: "var(--bg-elevated)" }}
              >
                <div
                  className="rp-bar h-full rounded-full"
                  style={{
                    width: `${(Math.abs(i.value) / max) * 100}%`,
                    background: "var(--accent)",
                    transformOrigin: "left",
                  }}
                />
              </div>
              <span
                className="w-24 shrink-0 text-right text-xs font-semibold tabular-nums"
                style={{ color: "var(--text-primary)" }}
              >
                ₹{fmt(i.value)}
              </span>
              {i.tip && (
                <TipBody tip={i.tip} className="left-36 bottom-full mb-1" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DataTable({ sec }) {
  if (!sec.rows.length) return null;
  const foot = footerCells(sec);
  return (
    <div>
      {sec.heading && (
        <h3
          className="font-bold text-sm mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          {sec.heading}
        </h3>
      )}
      <div
        className="rounded-xl border overflow-hidden"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: "var(--bg-elevated)" }}>
                {sec.columns.map((c) => (
                  <th
                    key={c.key}
                    className={`px-3 py-2.5 text-xs font-semibold border-b whitespace-nowrap ${c.align === "right" ? "text-right" : "text-left"}`}
                    style={{
                      borderColor: "var(--border-sub)",
                      color: "var(--text-muted)",
                    }}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sec.rows.map((r, idx) => (
                <tr
                  key={idx}
                  className="rp-row border-b"
                  style={{
                    borderColor: "var(--border-sub)",
                    background: idx % 2 ? "var(--bg-elevated)" : "transparent",
                  }}
                >
                  {sec.columns.map((c) => {
                    const v = r[c.key];
                    const color =
                      c.type === "date"
                        ? "var(--accent-text)"
                        : c.signed && n(v) < 0
                          ? "var(--danger-text)"
                          : "var(--text-primary)";
                    return (
                      <td
                        key={c.key}
                        className={`px-3 py-2 tabular-nums ${c.align === "right" ? "text-right" : "text-left"} ${c.type === "date" ? "whitespace-nowrap" : ""}`}
                        style={{
                          color,
                          fontWeight:
                            c.bold || c.type === "date"
                              ? c.bold
                                ? 700
                                : 600
                              : undefined,
                        }}
                        title={
                          c.type === "date"
                            ? fmtLong(v)
                            : c.type === "money" && n(v)
                              ? `₹${fmt(v)}`
                              : undefined
                        }
                      >
                        {c.type === "date" ? (
                          <>
                            {fmtShort(v)}
                            <span
                              className="ml-1.5 text-[10px] font-normal"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {weekday(v)}
                            </span>
                          </>
                        ) : c.type === "pct" ? (
                          <div className="flex items-center justify-end gap-2">
                            <div
                              className="w-16 h-1.5 rounded-full overflow-hidden"
                              style={{ background: "var(--border-sub)" }}
                            >
                              <div
                                className="h-full"
                                style={{
                                  width: `${Math.min(100, n(v))}%`,
                                  background: "var(--accent)",
                                }}
                              />
                            </div>
                            <span>{cellText(c, v)}</span>
                          </div>
                        ) : (
                          cellText(c, v)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr
                className="font-bold"
                style={{ background: "var(--bg-elevated)" }}
              >
                {foot.map((v, i) => (
                  <td
                    key={i}
                    className={`px-3 py-2.5 tabular-nums ${sec.columns[i].align === "right" ? "text-right" : "text-left"}`}
                    style={{
                      color:
                        i === 0 ? "var(--text-muted)" : "var(--accent-text)",
                    }}
                  >
                    {v}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

const selectStyle = {
  background: "var(--bg-elevated)",
  borderColor: "var(--border)",
  color: "var(--text-primary)",
};

/* ═══ PAGE ═══════════════════════════════════════════════════════════════════ */
export default function ReportsPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { user } = useAuth();
  const { allData, loadingMap, fetchMonth } = useMonthlyDaybook(user);

  const today = new Date();
  const currentMonthKey = toMonthKey(today.getFullYear(), today.getMonth() + 1);
  const startMonth = state?.month || currentMonthKey;

  const [year, setYear] = useState(Number(startMonth.slice(0, 4)));
  const [period, setPeriod] = useState(startMonth); // "YYYY-MM" or "all"
  const [reportId, setReportId] = useState(
    REPORTS.some((r) => r.id === state?.report) ? state.report : "sales",
  );
  const [shop, setShop] = useState(null);
  const [exporting, setExporting] = useState(false);

  const yearOptions = yearsFrom(2024, currentMonthKey);
  const monthsInYear = [...monthsForYear(year, currentMonthKey)].sort();

  useEffect(() => {
    monthsInYear.forEach((mk) => {
      if (!(mk in allData) && !loadingMap[mk]) fetchMonth(mk);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  useEffect(() => {
    if (user?.role === "admin" && user?.shop) {
      API.get("/shops/me")
        .then(({ data }) => data.success && setShop(data.data.shop))
        .catch(() => setShop(null));
    }
  }, [user?.role, user?.shop]);

  const activePeriod =
    period === "all" || monthsInYear.includes(period)
      ? period
      : monthsInYear[monthsInYear.length - 1];
  const yearly = activePeriod === "all";
  const periodKeys = yearly ? monthsInYear : [activePeriod];
  const loading = periodKeys.some((mk) => loadingMap[mk] && !(mk in allData));

  const entries = useMemo(
    () =>
      periodKeys
        .flatMap((mk) => allData[mk] || [])
        .sort((a, b) => new Date(a.date) - new Date(b.date)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allData, activePeriod, year],
  );

  const report = REPORTS.find((r) => r.id === reportId) || REPORTS[0];
  const data = useMemo(
    () => report.build(entries, { yearly }),
    [report, entries, yearly],
  );

  const shopName = shop?.name || "Your Shop";
  const periodLabel = yearly ? `Full year ${year}` : displayMonth(activePeriod);
  const generated = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const fileBase = `${shopName}-${report.id}-${activePeriod}`.replace(
    /[^\w-]+/g,
    "_",
  );
  const canExport = !loading && entries.length > 0;

  const printReport = () => {
    const prev = document.title;
    document.title = fileBase; // default PDF file name
    window.print();
    setTimeout(() => (document.title = prev), 500);
  };

  const downloadExcel = async () => {
    setExporting(true);
    try {
      await downloadXLSX(
        report,
        data,
        { shop: shopName, period: periodLabel, generated },
        fileBase,
      );
    } catch (err) {
      alert("Couldn't create the Excel file: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const goBack = () =>
    window.history.length > 1 ? navigate(-1) : navigate("/dashboard");

  return (
    <div
      className="reports-root min-h-screen"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      <style>{PAGE_CSS}</style>

      <header
        className="no-print sticky top-0 z-40 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b"
        style={{
          background: "var(--topbar-bg)",
          borderColor: "var(--topbar-border)",
          boxShadow: "var(--shadow)",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={goBack}
            className="w-9 h-9 rounded-lg flex items-center justify-center border text-sm font-bold shrink-0"
            style={{
              borderColor: "var(--border)",
              background: "var(--bg-elevated)",
              color: "var(--text-sec)",
            }}
            title="Back"
          >
            ←
          </button>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-none truncate">Reports</p>
            <p
              className="text-xs mt-1 truncate"
              style={{ color: "var(--text-muted)" }}
            >
              {shopName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={downloadExcel}
            disabled={!canExport || exporting}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border disabled:opacity-40"
            style={{
              borderColor: "var(--border)",
              background: "var(--bg-elevated)",
              color: "var(--text-sec)",
            }}
          >
            {exporting ? "Preparing…" : "⬇ Excel"}
          </button>
          <button
            onClick={printReport}
            disabled={!canExport}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40"
            style={{ background: "var(--accent)" }}
          >
            🖨 Print / PDF
          </button>
        </div>
      </header>

      <main className="reports-main mx-auto px-4 sm:px-6 py-6 grid lg:grid-cols-[260px_minmax(0,1fr)] gap-5 items-start">
        <aside className="no-print space-y-4 lg:sticky lg:top-20">
          <div
            className="rounded-2xl border p-4 space-y-3"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow)",
            }}
          >
            <label
              className="block text-xs font-semibold"
              style={{ color: "var(--text-sec)" }}
            >
              Year
              <select
                value={year}
                onChange={(e) => {
                  setYear(Number(e.target.value));
                  setPeriod("all");
                }}
                className="w-full mt-1 px-3 py-2 rounded-lg border text-sm font-normal outline-none"
                style={selectStyle}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <label
              className="block text-xs font-semibold"
              style={{ color: "var(--text-sec)" }}
            >
              Period
              <select
                value={activePeriod}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border text-sm font-normal outline-none"
                style={selectStyle}
              >
                <option value="all">Full year {year}</option>
                {monthsInYear.map((mk) => (
                  <option key={mk} value={mk}>
                    {displayMonth(mk)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            {REPORTS.map((r) => {
              const active = r.id === report.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setReportId(r.id)}
                  className="text-left rounded-xl border px-3 py-2.5 flex items-center gap-3 transition-colors"
                  style={{
                    background: active
                      ? "var(--accent-soft)"
                      : "var(--bg-surface)",
                    borderColor: active
                      ? "var(--accent-border)"
                      : "var(--border)",
                  }}
                >
                  <span className="text-lg shrink-0">{r.icon}</span>
                  <span className="min-w-0">
                    <span
                      className="block text-sm font-semibold truncate"
                      style={{
                        color: active
                          ? "var(--accent-text)"
                          : "var(--text-primary)",
                      }}
                    >
                      {r.label}
                    </span>
                    <span
                      className="hidden sm:block text-[11px] truncate"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {r.desc}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section
          className="report-sheet rounded-2xl border p-5 sm:p-6 space-y-5 min-w-0"
          style={{
            background: "var(--bg-base)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow)",
          }}
        >
          <div
            className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b"
            style={{ borderColor: "var(--border-sub)" }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white text-lg shrink-0"
                style={{ background: "var(--accent)" }}
              >
                {shopName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-black leading-tight truncate">
                  {shopName}
                </h1>
                {shop?.address && (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {shop.address}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p
                className="text-base font-bold"
                style={{ color: "var(--accent-text)" }}
              >
                {report.label}
              </p>
              <p className="text-sm" style={{ color: "var(--text-sec)" }}>
                {periodLabel} · {entries.length} day
                {entries.length === 1 ? "" : "s"} recorded
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Generated {generated}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-xl"
                    style={{ background: "var(--bg-elevated)" }}
                  />
                ))}
              </div>
              <div
                className="h-48 rounded-xl"
                style={{ background: "var(--bg-elevated)" }}
              />
            </div>
          ) : entries.length === 0 ? (
            <div
              className="rounded-xl border p-10 text-center"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border)",
              }}
            >
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No day book entries for {periodLabel}. Pick another period, or
                add entries from the dashboard.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                {data.summary.map((s, i) => (
                  <SummaryCard key={s.label} s={s} idx={i} />
                ))}
              </div>
              <Chart chart={data.chart} />
              {data.sections.map((sec, i) => (
                <DataTable key={i} sec={sec} />
              ))}
              {data.sections.every((s) => s.rows.length === 0) && (
                <p
                  className="text-sm text-center py-6"
                  style={{ color: "var(--text-muted)" }}
                >
                  Nothing recorded for this report in {periodLabel}.
                </p>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
