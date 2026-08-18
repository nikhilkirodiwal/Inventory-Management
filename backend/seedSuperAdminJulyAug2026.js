import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./db/dbconnection.js";
import Partner from "./models/partner.js";
import PartnerTransaction from "./models/partnerTransaction.js";
import LedgerEntry from "./models/ledgerEntry.js";

dotenv.config();

// Updated July plus August till today in this workspace: 2026-08-12.
const RANGE_START = new Date("2026-07-01T00:00:00.000Z");
const RANGE_END = new Date("2026-08-13T00:00:00.000Z");

const patientNames = [
  "Deepak Saini",
  "Sarita Sharma",
  "Ramesh Yadav",
  "Sunita Devi",
  "Priya Singh",
  "Pooja Rani",
  "Mohd Aslam",
  "Rakesh Sharma",
  "Vijay Chauhan",
  "Anita Gupta",
  "Kavita Verma",
  "Ajay Meena",
  "Meena Kumari",
  "Suresh Kumar",
];

const staffNames = ["nik1", "nik2", "nik3", "amit", "raj", "Cleaner", "Security Guard"];
const adminCategories = [
  "Office Rent",
  "Electricity Bill",
  "Internet & Phone",
  "Stationery",
  "Legal & Accounting",
  "Insurance Premium",
  "Equipment Maintenance",
  "Housekeeping Supplies",
  "Misc Admin",
];

const makeRand = (seed) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const amount = (rand, min, max) => Math.round(min + rand() * (max - min));

const datesBetween = (start, endExclusive) => {
  const dates = [];
  for (let d = new Date(start); d < endExclusive; d.setUTCDate(d.getUTCDate() + 1)) {
    dates.push(new Date(d));
  }
  return dates;
};

const sumEntries = (entries) => entries.reduce((sum, entry) => sum + entry.amount, 0);

const buildPatientBillEntries = () =>
  datesBetween(RANGE_START, RANGE_END)
    .filter((date) => !([2, 11, 25].includes(date.getUTCDate()) && date.getUTCDay() === 0))
    .map((date) => {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, "0");
      const d = String(date.getUTCDate()).padStart(2, "0");
      const rand = makeRand(Number(`17${y}${m}${d}`));
      const rows = Array.from({ length: amount(rand, 2, 4) }, () => ({
        name: patientNames[Math.floor(rand() * patientNames.length)],
        amount: amount(rand, 1400, date.getUTCDay() === 0 ? 12500 : 9500),
      }));

      return {
        date: `${y}-${m}-${d}`,
        entries: rows,
        directAmount: 0,
        amount: sumEntries(rows),
        note: "",
      };
    });

const salarySchedule = [
  { date: "2026-07-01", note: "Monthly salary disbursement", count: 4, min: 6500, max: 18500 },
  { date: "2026-07-07", note: "Partial / advance salary", count: 4, min: 5000, max: 18000 },
  { date: "2026-07-15", note: "Partial / advance salary", count: 3, min: 6500, max: 17000 },
  { date: "2026-07-22", note: "Partial / advance salary", count: 2, min: 8000, max: 19000 },
  { date: "2026-07-28", note: "Partial / advance salary", count: 4, min: 7000, max: 19000 },
  { date: "2026-07-31", note: "Month-end salary adjustment", count: 3, min: 5500, max: 16500 },
  { date: "2026-08-01", note: "Monthly salary disbursement", count: 4, min: 7000, max: 19000 },
  { date: "2026-08-07", note: "Partial / advance salary", count: 3, min: 5000, max: 16000 },
  { date: "2026-08-12", note: "Partial / advance salary", count: 2, min: 6000, max: 14500 },
];

const buildSalaryEntries = () =>
  salarySchedule.map((item) => {
    const rand = makeRand(Number(item.date.replaceAll("-", "")) + 31);
    const rows = Array.from({ length: item.count }, () => ({
      name: staffNames[Math.floor(rand() * staffNames.length)],
      amount: amount(rand, item.min, item.max),
    }));

    return {
      date: item.date,
      entries: rows,
      directAmount: 0,
      amount: sumEntries(rows),
      note: item.note,
    };
  });

const adminExpenseDates = [
  "2026-07-02",
  "2026-07-05",
  "2026-07-09",
  "2026-07-11",
  "2026-07-14",
  "2026-07-17",
  "2026-07-19",
  "2026-07-23",
  "2026-07-26",
  "2026-07-30",
  "2026-08-02",
  "2026-08-04",
  "2026-08-08",
  "2026-08-11",
];

const buildAdminExpenseEntries = () =>
  adminExpenseDates.map((dateText, index) => {
    const rand = makeRand(Number(dateText.replaceAll("-", "")) + 47);
    const category = adminCategories[index % adminCategories.length];
    const high = ["Office Rent", "Electricity Bill", "Equipment Maintenance"].includes(category);
    const rows = [{ name: category, amount: amount(rand, high ? 5200 : 900, high ? 24500 : 6500) }];

    return {
      date: dateText,
      entries: rows,
      directAmount: 0,
      amount: sumEntries(rows),
      note: "",
    };
  });

const partnerTxnsByName = {
  "Vijayant Kohli": [
    { date: "2026-07-02", type: "transfer", amount: 78857, note: "Partner draw" },
    { date: "2026-07-03", type: "transfer", amount: 85393, note: "Partner draw" },
    { date: "2026-07-27", type: "receive", amount: 31268, note: "Profit share contribution" },
    { date: "2026-07-31", type: "receive", amount: 46500, note: "Month-end adjustment" },
    { date: "2026-08-05", type: "transfer", amount: 54200, note: "Partner draw" },
  ],
  "Shishir Arora": [
    { date: "2026-07-09", type: "receive", amount: 42492, note: "Advance towards expenses" },
    { date: "2026-07-17", type: "transfer", amount: 82559, note: "Profit distribution" },
    { date: "2026-07-22", type: "transfer", amount: 34229, note: "Partner draw" },
    { date: "2026-08-03", type: "receive", amount: 38500, note: "Advance towards expenses" },
    { date: "2026-08-10", type: "transfer", amount: 44800, note: "Partner draw" },
  ],
  "S K Pahuja": [
    { date: "2026-07-15", type: "transfer", amount: 22727, note: "Partner draw" },
    { date: "2026-07-16", type: "receive", amount: 58353, note: "Advance towards expenses" },
    { date: "2026-07-18", type: "receive", amount: 60812, note: "Capital injection" },
    { date: "2026-08-01", type: "receive", amount: 50000, note: "Capital injection" },
    { date: "2026-08-12", type: "transfer", amount: 31500, note: "Partner draw" },
  ],
};

const patientBillEntries = buildPatientBillEntries();
const salaryEntries = buildSalaryEntries();
const adminExpenseEntries = buildAdminExpenseEntries();

const insertLedger = async (kind, rows) => {
  const docs = rows.map((row) => ({ ...row, kind }));
  return LedgerEntry.insertMany(docs, { ordered: true });
};

const run = async () => {
  await connectDB();

  try {
    const deletedLedger = await LedgerEntry.deleteMany({
      kind: { $in: ["patientBill", "salary", "adminExpense"] },
      date: { $gte: RANGE_START, $lt: RANGE_END },
    });
    console.log(`Deleted ${deletedLedger.deletedCount} existing ledger entries from July 1 to August 12`);

    const partnerNames = Object.keys(partnerTxnsByName);
    const partnerMap = {};
    for (const name of partnerNames) {
      let partner = await Partner.findOne({ name });
      if (!partner) partner = await Partner.create({ name });
      partnerMap[name] = partner._id;
    }

    const deletedTxns = await PartnerTransaction.deleteMany({
      partner: { $in: Object.values(partnerMap) },
      date: { $gte: RANGE_START, $lt: RANGE_END },
    });
    console.log(`Deleted ${deletedTxns.deletedCount} existing partner transactions from July 1 to August 12`);

    const patientBillResult = await insertLedger("patientBill", patientBillEntries);
    const salaryResult = await insertLedger("salary", salaryEntries);
    const adminExpenseResult = await insertLedger("adminExpense", adminExpenseEntries);

    const partnerTxnDocs = [];
    for (const [name, txns] of Object.entries(partnerTxnsByName)) {
      txns.forEach((txn) => partnerTxnDocs.push({ ...txn, partner: partnerMap[name] }));
    }
    const partnerTxnResult = await PartnerTransaction.insertMany(partnerTxnDocs, { ordered: true });

    const sum = (rows) => rows.reduce((total, row) => total + (row.amount || 0), 0);
    console.log(`Patient Bill: ${patientBillResult.length} entries, Rs ${sum(patientBillEntries)} total`);
    console.log(`Salary: ${salaryResult.length} entries, Rs ${sum(salaryEntries)} total`);
    console.log(`Admin Expense: ${adminExpenseResult.length} entries, Rs ${sum(adminExpenseEntries)} total`);
    console.log(`Partner transactions: ${partnerTxnResult.length} total`);

    for (const [name, txns] of Object.entries(partnerTxnsByName)) {
      const received = txns.filter((txn) => txn.type === "receive").reduce((total, txn) => total + txn.amount, 0);
      const transferred = txns.filter((txn) => txn.type === "transfer").reduce((total, txn) => total + txn.amount, 0);
      console.log(`${name}: received Rs ${received}, transferred Rs ${transferred}, net Rs ${received - transferred}`);
    }
  } catch (err) {
    console.error("Seed failed:", err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

run();
