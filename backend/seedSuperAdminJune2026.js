import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./db/dbconnection.js";
import Partner from "./models/partner.js";
import PartnerTransaction from "./models/partnerTransaction.js";
import LedgerEntry from "./models/ledgerEntry.js";

dotenv.config();

const MONTH_START = new Date("2026-06-01T00:00:00.000Z");
const MONTH_END = new Date("2026-07-01T00:00:00.000Z");

/* ── Patient Bill — daily-ish income, most days of June ── */
const patientBillEntries =
[
  {
    "date": "2026-06-01",
    "entries": [
      {
        "name": "Sandeep Malhotra",
        "amount": 4174
      },
      {
        "name": "Usha Rani",
        "amount": 3817
      },
      {
        "name": "Rekha Bansal",
        "amount": 4765
      },
      {
        "name": "Sandeep Malhotra",
        "amount": 2080
      },
      {
        "name": "Kiran Bala",
        "amount": 4247
      }
    ],
    "directAmount": 0,
    "amount": 19083,
    "note": ""
  },
  {
    "date": "2026-06-02",
    "entries": [
      {
        "name": "Rekha Bansal",
        "amount": 1381
      },
      {
        "name": "Rekha Bansal",
        "amount": 4472
      },
      {
        "name": "Harish Chand",
        "amount": 3871
      },
      {
        "name": "Rekha Bansal",
        "amount": 2672
      }
    ],
    "directAmount": 0,
    "amount": 12396,
    "note": ""
  },
  {
    "date": "2026-06-04",
    "entries": [
      {
        "name": "Manoj Tiwari",
        "amount": 2590
      },
      {
        "name": "Neha Sharma",
        "amount": 3605
      }
    ],
    "directAmount": 0,
    "amount": 6195,
    "note": ""
  },
  {
    "date": "2026-06-05",
    "entries": [
      {
        "name": "Usha Rani",
        "amount": 8255
      },
      {
        "name": "Farida Begum",
        "amount": 3660
      },
      {
        "name": "Ashok Kumar",
        "amount": 4016
      },
      {
        "name": "Imran Khan",
        "amount": 6340
      },
      {
        "name": "Kiran Bala",
        "amount": 3103
      }
    ],
    "directAmount": 0,
    "amount": 25374,
    "note": ""
  },
  {
    "date": "2026-06-08",
    "entries": [
      {
        "name": "Neha Sharma",
        "amount": 6045
      },
      {
        "name": "Manoj Tiwari",
        "amount": 5091
      }
    ],
    "directAmount": 0,
    "amount": 11136,
    "note": ""
  },
  {
    "date": "2026-06-09",
    "entries": [
      {
        "name": "Kiran Bala",
        "amount": 5271
      },
      {
        "name": "Harish Chand",
        "amount": 4575
      },
      {
        "name": "Rekha Bansal",
        "amount": 4455
      },
      {
        "name": "Kiran Bala",
        "amount": 7635
      }
    ],
    "directAmount": 0,
    "amount": 21936,
    "note": ""
  },
  {
    "date": "2026-06-10",
    "entries": [
      {
        "name": "Shalini Rao",
        "amount": 3405
      },
      {
        "name": "Farida Begum",
        "amount": 3937
      },
      {
        "name": "Geeta Devi",
        "amount": 3247
      },
      {
        "name": "Manoj Tiwari",
        "amount": 4170
      },
      {
        "name": "Sandeep Malhotra",
        "amount": 3118
      }
    ],
    "directAmount": 0,
    "amount": 17877,
    "note": ""
  },
  {
    "date": "2026-06-11",
    "entries": [
      {
        "name": "Imran Khan",
        "amount": 2538
      },
      {
        "name": "Om Prakash",
        "amount": 2754
      },
      {
        "name": "Kiran Bala",
        "amount": 2126
      }
    ],
    "directAmount": 0,
    "amount": 7418,
    "note": ""
  },
  {
    "date": "2026-06-12",
    "entries": [
      {
        "name": "Kiran Bala",
        "amount": 7466
      },
      {
        "name": "Usha Rani",
        "amount": 1838
      },
      {
        "name": "Pankaj Arora",
        "amount": 3381
      },
      {
        "name": "Imran Khan",
        "amount": 3389
      }
    ],
    "directAmount": 0,
    "amount": 16074,
    "note": ""
  },
  {
    "date": "2026-06-13",
    "entries": [
      {
        "name": "Farida Begum",
        "amount": 15238
      },
      {
        "name": "Shalini Rao",
        "amount": 10908
      }
    ],
    "directAmount": 0,
    "amount": 26146,
    "note": ""
  },
  {
    "date": "2026-06-15",
    "entries": [
      {
        "name": "Farida Begum",
        "amount": 8258
      },
      {
        "name": "Ashok Kumar",
        "amount": 2846
      },
      {
        "name": "Vikas Sethi",
        "amount": 5661
      },
      {
        "name": "Neha Sharma",
        "amount": 11812
      }
    ],
    "directAmount": 0,
    "amount": 28577,
    "note": ""
  },
  {
    "date": "2026-06-16",
    "entries": [
      {
        "name": "Harish Chand",
        "amount": 2774
      },
      {
        "name": "Farida Begum",
        "amount": 2563
      },
      {
        "name": "Pankaj Arora",
        "amount": 1342
      },
      {
        "name": "Shalini Rao",
        "amount": 3286
      },
      {
        "name": "Harish Chand",
        "amount": 3105
      }
    ],
    "directAmount": 0,
    "amount": 13070,
    "note": ""
  },
  {
    "date": "2026-06-17",
    "entries": [
      {
        "name": "Rekha Bansal",
        "amount": 5545
      },
      {
        "name": "Om Prakash",
        "amount": 9529
      },
      {
        "name": "Ashok Kumar",
        "amount": 7518
      },
      {
        "name": "Manoj Tiwari",
        "amount": 5346
      }
    ],
    "directAmount": 0,
    "amount": 27938,
    "note": ""
  },
  {
    "date": "2026-06-18",
    "entries": [
      {
        "name": "Om Prakash",
        "amount": 6893
      },
      {
        "name": "Neha Sharma",
        "amount": 8525
      },
      {
        "name": "Manoj Tiwari",
        "amount": 2940
      }
    ],
    "directAmount": 0,
    "amount": 18358,
    "note": ""
  },
  {
    "date": "2026-06-19",
    "entries": [
      {
        "name": "Shalini Rao",
        "amount": 14154
      },
      {
        "name": "Harish Chand",
        "amount": 6149
      }
    ],
    "directAmount": 0,
    "amount": 20303,
    "note": ""
  },
  {
    "date": "2026-06-20",
    "entries": [
      {
        "name": "Harish Chand",
        "amount": 11734
      },
      {
        "name": "Om Prakash",
        "amount": 2394
      },
      {
        "name": "Om Prakash",
        "amount": 9260
      }
    ],
    "directAmount": 0,
    "amount": 23388,
    "note": ""
  },
  {
    "date": "2026-06-21",
    "entries": [
      {
        "name": "Shalini Rao",
        "amount": 5737
      },
      {
        "name": "Shalini Rao",
        "amount": 23827
      }
    ],
    "directAmount": 0,
    "amount": 29564,
    "note": ""
  },
  {
    "date": "2026-06-22",
    "entries": [
      {
        "name": "Neha Sharma",
        "amount": 1408
      },
      {
        "name": "Rekha Bansal",
        "amount": 6694
      },
      {
        "name": "Rekha Bansal",
        "amount": 2445
      },
      {
        "name": "Usha Rani",
        "amount": 4656
      }
    ],
    "directAmount": 0,
    "amount": 15203,
    "note": ""
  },
  {
    "date": "2026-06-23",
    "entries": [
      {
        "name": "Neha Sharma",
        "amount": 3620
      },
      {
        "name": "Usha Rani",
        "amount": 13214
      },
      {
        "name": "Vikas Sethi",
        "amount": 6611
      },
      {
        "name": "Farida Begum",
        "amount": 3412
      }
    ],
    "directAmount": 0,
    "amount": 26857,
    "note": ""
  },
  {
    "date": "2026-06-24",
    "entries": [
      {
        "name": "Rekha Bansal",
        "amount": 2576
      },
      {
        "name": "Usha Rani",
        "amount": 1553
      },
      {
        "name": "Om Prakash",
        "amount": 2099
      },
      {
        "name": "Ashok Kumar",
        "amount": 2753
      },
      {
        "name": "Om Prakash",
        "amount": 3365
      }
    ],
    "directAmount": 0,
    "amount": 12346,
    "note": ""
  },
  {
    "date": "2026-06-25",
    "entries": [
      {
        "name": "Shalini Rao",
        "amount": 4532
      },
      {
        "name": "Farida Begum",
        "amount": 2534
      }
    ],
    "directAmount": 0,
    "amount": 7066,
    "note": ""
  },
  {
    "date": "2026-06-27",
    "entries": [
      {
        "name": "Ashok Kumar",
        "amount": 2753
      },
      {
        "name": "Om Prakash",
        "amount": 1232
      },
      {
        "name": "Geeta Devi",
        "amount": 1019
      },
      {
        "name": "Harish Chand",
        "amount": 2716
      }
    ],
    "directAmount": 0,
    "amount": 7720,
    "note": ""
  },
  {
    "date": "2026-06-30",
    "entries": [
      {
        "name": "Ashok Kumar",
        "amount": 4483
      },
      {
        "name": "Farida Begum",
        "amount": 2274
      },
      {
        "name": "Kiran Bala",
        "amount": 3451
      },
      {
        "name": "Geeta Devi",
        "amount": 1946
      },
      {
        "name": "Shalini Rao",
        "amount": 1664
      }
    ],
    "directAmount": 0,
    "amount": 13818,
    "note": ""
  }
];

/* ── Salary — paid on a handful of specific days ── */
const salaryEntries =
[
  {
    "date": "2026-06-01",
    "entries": [
      {
        "name": "Security Guard",
        "amount": 15125
      },
      {
        "name": "Receptionist",
        "amount": 7520
      },
      {
        "name": "amit",
        "amount": 14332
      },
      {
        "name": "raj",
        "amount": 16593
      }
    ],
    "directAmount": 0,
    "amount": 53570,
    "note": "Monthly salary disbursement"
  },
  {
    "date": "2026-06-08",
    "entries": [
      {
        "name": "amit",
        "amount": 4708
      },
      {
        "name": "Security Guard",
        "amount": 4781
      },
      {
        "name": "nik2",
        "amount": 16007
      }
    ],
    "directAmount": 0,
    "amount": 25496,
    "note": "Partial / advance salary"
  },
  {
    "date": "2026-06-16",
    "entries": [
      {
        "name": "Cleaner",
        "amount": 4615
      },
      {
        "name": "nik2",
        "amount": 13216
      },
      {
        "name": "nik1",
        "amount": 14969
      },
      {
        "name": "Security Guard",
        "amount": 5556
      }
    ],
    "directAmount": 0,
    "amount": 38356,
    "note": "Partial / advance salary"
  },
  {
    "date": "2026-06-24",
    "entries": [
      {
        "name": "amit",
        "amount": 5795
      },
      {
        "name": "nik1",
        "amount": 16744
      },
      {
        "name": "Receptionist",
        "amount": 13937
      }
    ],
    "directAmount": 0,
    "amount": 36476,
    "note": "Partial / advance salary"
  },
  {
    "date": "2026-06-30",
    "entries": [
      {
        "name": "raj",
        "amount": 14489
      },
      {
        "name": "nik1",
        "amount": 4653
      }
    ],
    "directAmount": 0,
    "amount": 19142,
    "note": "Partial / advance salary"
  }
];

/* ── Admin Expense — scattered overhead costs ── */
const adminExpenseEntries =
[
  {
    "date": "2026-06-03",
    "entries": [
      {
        "name": "Office Rent",
        "amount": 23323
      }
    ],
    "directAmount": 0,
    "amount": 23323,
    "note": ""
  },
  {
    "date": "2026-06-06",
    "entries": [
      {
        "name": "Electricity Bill",
        "amount": 4754
      }
    ],
    "directAmount": 0,
    "amount": 4754,
    "note": ""
  },
  {
    "date": "2026-06-10",
    "entries": [
      {
        "name": "Internet & Phone",
        "amount": 2809
      }
    ],
    "directAmount": 0,
    "amount": 2809,
    "note": ""
  },
  {
    "date": "2026-06-12",
    "entries": [
      {
        "name": "Stationery",
        "amount": 881
      }
    ],
    "directAmount": 0,
    "amount": 881,
    "note": ""
  },
  {
    "date": "2026-06-15",
    "entries": [
      {
        "name": "Legal & Accounting",
        "amount": 3701
      }
    ],
    "directAmount": 0,
    "amount": 3701,
    "note": ""
  },
  {
    "date": "2026-06-18",
    "entries": [
      {
        "name": "Insurance Premium",
        "amount": 4492
      }
    ],
    "directAmount": 0,
    "amount": 4492,
    "note": ""
  },
  {
    "date": "2026-06-21",
    "entries": [
      {
        "name": "Equipment Maintenance",
        "amount": 5206
      }
    ],
    "directAmount": 0,
    "amount": 5206,
    "note": ""
  },
  {
    "date": "2026-06-25",
    "entries": [
      {
        "name": "Housekeeping Supplies",
        "amount": 742
      }
    ],
    "directAmount": 0,
    "amount": 742,
    "note": ""
  },
  {
    "date": "2026-06-28",
    "entries": [
      {
        "name": "Misc Admin",
        "amount": 781
      }
    ],
    "directAmount": 0,
    "amount": 781,
    "note": ""
  }
];

/* ── Partner transactions — keyed by partner name ── */
const partnerTxnsByName =
{
  "Vijayant Kohli": [
    {
      "date": "2026-06-10",
      "type": "receive",
      "amount": 30597,
      "note": "Profit share contribution"
    },
    {
      "date": "2026-06-25",
      "type": "transfer",
      "amount": 74281,
      "note": "Partner draw"
    },
    {
      "date": "2026-06-29",
      "type": "transfer",
      "amount": 69726,
      "note": "Partner draw"
    }
  ],
  "Shishir Arora": [
    {
      "date": "2026-06-06",
      "type": "receive",
      "amount": 84069,
      "note": "Loan to business"
    },
    {
      "date": "2026-06-28",
      "type": "receive",
      "amount": 36917,
      "note": "Advance towards expenses"
    }
  ],
  "S K Pahuja": [
    {
      "date": "2026-06-06",
      "type": "receive",
      "amount": 79060,
      "note": "Profit share contribution"
    },
    {
      "date": "2026-06-14",
      "type": "receive",
      "amount": 27782,
      "note": "Capital injection"
    },
    {
      "date": "2026-06-20",
      "type": "transfer",
      "amount": 53734,
      "note": "Reimbursement"
    },
    {
      "date": "2026-06-27",
      "type": "transfer",
      "amount": 17762,
      "note": "Profit distribution"
    }
  ]
};

const insertLedger = async (kind, rows) => {
  const docs = rows.map((r) => ({ ...r, kind }));
  const result = await LedgerEntry.insertMany(docs, { ordered: true });
  return result;
};

const run = async () => {
  await connectDB();

  try {
    // ── Step 1: clear existing June data for these ledgers so this script is safe to re-run ──
    const deletedLedger = await LedgerEntry.deleteMany({
      kind: { $in: ["patientBill", "salary", "adminExpense"] },
      date: { $gte: MONTH_START, $lt: MONTH_END },
    });
    console.log(`🗑️  Deleted ${deletedLedger.deletedCount} existing ledger entries for June`);

    // ── Step 2: ensure the three partners exist, get their real _ids ──
    const partnerNames = Object.keys(partnerTxnsByName);
    const partnerMap = {};
    for (const name of partnerNames) {
      let partner = await Partner.findOne({ name });
      if (!partner) partner = await Partner.create({ name });
      partnerMap[name] = partner._id;
    }

    // ── Step 3: clear existing June partner transactions for these partners ──
    const deletedTxns = await PartnerTransaction.deleteMany({
      partner: { $in: Object.values(partnerMap) },
      date: { $gte: MONTH_START, $lt: MONTH_END },
    });
    console.log(`🗑️  Deleted ${deletedTxns.deletedCount} existing partner transactions for June`);

    // ── Step 4: insert everything ──
    const patientBillResult = await insertLedger("patientBill", patientBillEntries);
    const salaryResult = await insertLedger("salary", salaryEntries);
    const adminExpenseResult = await insertLedger("adminExpense", adminExpenseEntries);

    const partnerTxnDocs = [];
    for (const [name, txns] of Object.entries(partnerTxnsByName)) {
      txns.forEach((t) => partnerTxnDocs.push({ ...t, partner: partnerMap[name] }));
    }
    const partnerTxnResult = await PartnerTransaction.insertMany(partnerTxnDocs, { ordered: true });

    const sum = (rows) => rows.reduce((s, r) => s + (r.amount || 0), 0);

    console.log(`✅ Patient Bill: ${patientBillResult.length} entries, ₹${sum(patientBillEntries)} total`);
    console.log(`✅ Salary: ${salaryResult.length} entries, ₹${sum(salaryEntries)} total`);
    console.log(`✅ Admin Expense: ${adminExpenseResult.length} entries, ₹${sum(adminExpenseEntries)} total`);
    console.log(`✅ Partner transactions: ${partnerTxnResult.length} total`);
    for (const [name, txns] of Object.entries(partnerTxnsByName)) {
      const received = txns.filter((t) => t.type === "receive").reduce((s, t) => s + t.amount, 0);
      const transferred = txns.filter((t) => t.type === "transfer").reduce((s, t) => s + t.amount, 0);
      console.log(`   ${name}: received ₹${received}, transferred ₹${transferred}, net ₹${received - transferred}`);
    }
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

run();
