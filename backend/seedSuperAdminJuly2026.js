import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./db/dbconnection.js";
import Partner from "./models/partner.js";
import PartnerTransaction from "./models/partnerTransaction.js";
import LedgerEntry from "./models/ledgerEntry.js";

dotenv.config();

const MONTH_START = new Date("2026-07-01T00:00:00.000Z");
const MONTH_END = new Date("2026-08-01T00:00:00.000Z");

/* ── Patient Bill — daily-ish income, most days of July ── */
const patientBillEntries =
[
  {
    "date": "2026-07-01",
    "entries": [
      {
        "name": "Deepak Saini",
        "amount": 1934
      },
      {
        "name": "Sarita Sharma",
        "amount": 3031
      },
      {
        "name": "Ramesh Yadav",
        "amount": 1679
      }
    ],
    "directAmount": 0,
    "amount": 6644,
    "note": ""
  },
  {
    "date": "2026-07-02",
    "entries": [
      {
        "name": "Sunita Devi",
        "amount": 4093
      },
      {
        "name": "Sunita Devi",
        "amount": 6163
      }
    ],
    "directAmount": 0,
    "amount": 10256,
    "note": ""
  },
  {
    "date": "2026-07-03",
    "entries": [
      {
        "name": "Priya Singh",
        "amount": 4793
      },
      {
        "name": "Pooja Rani",
        "amount": 3228
      },
      {
        "name": "Pooja Rani",
        "amount": 5150
      },
      {
        "name": "Ramesh Yadav",
        "amount": 5331
      }
    ],
    "directAmount": 0,
    "amount": 18502,
    "note": ""
  },
  {
    "date": "2026-07-04",
    "entries": [
      {
        "name": "Pooja Rani",
        "amount": 2047
      },
      {
        "name": "Mohd Aslam",
        "amount": 8081
      },
      {
        "name": "Rakesh Sharma",
        "amount": 7465
      }
    ],
    "directAmount": 0,
    "amount": 17593,
    "note": ""
  },
  {
    "date": "2026-07-05",
    "entries": [
      {
        "name": "Ramesh Yadav",
        "amount": 5547
      },
      {
        "name": "Mohd Aslam",
        "amount": 1854
      },
      {
        "name": "Meena Kumari",
        "amount": 8925
      }
    ],
    "directAmount": 0,
    "amount": 16326,
    "note": ""
  },
  {
    "date": "2026-07-06",
    "entries": [
      {
        "name": "Deepak Saini",
        "amount": 2890
      },
      {
        "name": "Meena Kumari",
        "amount": 2815
      },
      {
        "name": "Deepak Saini",
        "amount": 2513
      },
      {
        "name": "Suresh Kumar",
        "amount": 1406
      }
    ],
    "directAmount": 0,
    "amount": 9624,
    "note": ""
  },
  {
    "date": "2026-07-08",
    "entries": [
      {
        "name": "Rakesh Sharma",
        "amount": 4620
      },
      {
        "name": "Vijay Chauhan",
        "amount": 2763
      },
      {
        "name": "Vijay Chauhan",
        "amount": 5651
      },
      {
        "name": "Pooja Rani",
        "amount": 6011
      }
    ],
    "directAmount": 0,
    "amount": 19045,
    "note": ""
  },
  {
    "date": "2026-07-09",
    "entries": [
      {
        "name": "Sunita Devi",
        "amount": 10619
      },
      {
        "name": "Anita Gupta",
        "amount": 4305
      },
      {
        "name": "Rakesh Sharma",
        "amount": 5448
      }
    ],
    "directAmount": 0,
    "amount": 20372,
    "note": ""
  },
  {
    "date": "2026-07-10",
    "entries": [
      {
        "name": "Ajay Meena",
        "amount": 18196
      },
      {
        "name": "Pooja Rani",
        "amount": 6139
      },
      {
        "name": "Sarita Sharma",
        "amount": 3412
      }
    ],
    "directAmount": 0,
    "amount": 27747,
    "note": ""
  },
  {
    "date": "2026-07-12",
    "entries": [
      {
        "name": "Mohd Aslam",
        "amount": 17374
      },
      {
        "name": "Pooja Rani",
        "amount": 12883
      }
    ],
    "directAmount": 0,
    "amount": 30257,
    "note": ""
  },
  {
    "date": "2026-07-13",
    "entries": [
      {
        "name": "Ramesh Yadav",
        "amount": 3907
      },
      {
        "name": "Sunita Devi",
        "amount": 4435
      },
      {
        "name": "Anita Gupta",
        "amount": 4826
      }
    ],
    "directAmount": 0,
    "amount": 13168,
    "note": ""
  },
  {
    "date": "2026-07-14",
    "entries": [
      {
        "name": "Deepak Saini",
        "amount": 3211
      },
      {
        "name": "Ramesh Yadav",
        "amount": 12880
      }
    ],
    "directAmount": 0,
    "amount": 16091,
    "note": ""
  },
  {
    "date": "2026-07-15",
    "entries": [
      {
        "name": "Vijay Chauhan",
        "amount": 20082
      },
      {
        "name": "Deepak Saini",
        "amount": 7516
      }
    ],
    "directAmount": 0,
    "amount": 27598,
    "note": ""
  },
  {
    "date": "2026-07-16",
    "entries": [
      {
        "name": "Suresh Kumar",
        "amount": 3822
      },
      {
        "name": "Priya Singh",
        "amount": 3385
      }
    ],
    "directAmount": 0,
    "amount": 7207,
    "note": ""
  },
  {
    "date": "2026-07-17",
    "entries": [
      {
        "name": "Ramesh Yadav",
        "amount": 11467
      },
      {
        "name": "Priya Singh",
        "amount": 7032
      },
      {
        "name": "Ajay Meena",
        "amount": 13049
      }
    ],
    "directAmount": 0,
    "amount": 31548,
    "note": ""
  },
  {
    "date": "2026-07-18",
    "entries": [
      {
        "name": "Sunita Devi",
        "amount": 3516
      },
      {
        "name": "Kavita Verma",
        "amount": 4433
      }
    ],
    "directAmount": 0,
    "amount": 7949,
    "note": ""
  },
  {
    "date": "2026-07-19",
    "entries": [
      {
        "name": "Ramesh Yadav",
        "amount": 4634
      },
      {
        "name": "Ramesh Yadav",
        "amount": 6253
      }
    ],
    "directAmount": 0,
    "amount": 10887,
    "note": ""
  },
  {
    "date": "2026-07-20",
    "entries": [
      {
        "name": "Deepak Saini",
        "amount": 7391
      },
      {
        "name": "Sarita Sharma",
        "amount": 4526
      },
      {
        "name": "Sunita Devi",
        "amount": 6388
      }
    ],
    "directAmount": 0,
    "amount": 18305,
    "note": ""
  },
  {
    "date": "2026-07-21",
    "entries": [
      {
        "name": "Mohd Aslam",
        "amount": 11888
      },
      {
        "name": "Rakesh Sharma",
        "amount": 10539
      }
    ],
    "directAmount": 0,
    "amount": 22427,
    "note": ""
  },
  {
    "date": "2026-07-22",
    "entries": [
      {
        "name": "Mohd Aslam",
        "amount": 5203
      },
      {
        "name": "Priya Singh",
        "amount": 11088
      }
    ],
    "directAmount": 0,
    "amount": 16291,
    "note": ""
  },
  {
    "date": "2026-07-23",
    "entries": [
      {
        "name": "Vijay Chauhan",
        "amount": 8504
      },
      {
        "name": "Mohd Aslam",
        "amount": 3701
      }
    ],
    "directAmount": 0,
    "amount": 12205,
    "note": ""
  },
  {
    "date": "2026-07-24",
    "entries": [
      {
        "name": "Sunita Devi",
        "amount": 2538
      },
      {
        "name": "Kavita Verma",
        "amount": 9307
      },
      {
        "name": "Rakesh Sharma",
        "amount": 3552
      }
    ],
    "directAmount": 0,
    "amount": 15397,
    "note": ""
  },
  {
    "date": "2026-07-26",
    "entries": [
      {
        "name": "Ramesh Yadav",
        "amount": 15546
      },
      {
        "name": "Ramesh Yadav",
        "amount": 10765
      }
    ],
    "directAmount": 0,
    "amount": 26311,
    "note": ""
  },
  {
    "date": "2026-07-27",
    "entries": [
      {
        "name": "Priya Singh",
        "amount": 2459
      },
      {
        "name": "Ramesh Yadav",
        "amount": 1964
      },
      {
        "name": "Vijay Chauhan",
        "amount": 3128
      },
      {
        "name": "Vijay Chauhan",
        "amount": 4466
      }
    ],
    "directAmount": 0,
    "amount": 12017,
    "note": ""
  },
  {
    "date": "2026-07-28",
    "entries": [
      {
        "name": "Deepak Saini",
        "amount": 4833
      },
      {
        "name": "Mohd Aslam",
        "amount": 5034
      },
      {
        "name": "Deepak Saini",
        "amount": 5130
      },
      {
        "name": "Sarita Sharma",
        "amount": 5246
      }
    ],
    "directAmount": 0,
    "amount": 20243,
    "note": ""
  }
];

/* ── Salary — paid on a handful of specific days ── */
const salaryEntries =
[
  {
    "date": "2026-07-01",
    "entries": [
      {
        "name": "nik1",
        "amount": 10293
      },
      {
        "name": "nik2",
        "amount": 17611
      },
      {
        "name": "amit",
        "amount": 5029
      },
      {
        "name": "nik3",
        "amount": 13162
      }
    ],
    "directAmount": 0,
    "amount": 46095,
    "note": "Monthly salary disbursement"
  },
  {
    "date": "2026-07-07",
    "entries": [
      {
        "name": "nik2",
        "amount": 17743
      },
      {
        "name": "raj",
        "amount": 12715
      },
      {
        "name": "amit",
        "amount": 6679
      },
      {
        "name": "nik3",
        "amount": 16029
      }
    ],
    "directAmount": 0,
    "amount": 53166,
    "note": "Partial / advance salary"
  },
  {
    "date": "2026-07-15",
    "entries": [
      {
        "name": "nik3",
        "amount": 12176
      },
      {
        "name": "nik2",
        "amount": 11484
      }
    ],
    "directAmount": 0,
    "amount": 23660,
    "note": "Partial / advance salary"
  },
  {
    "date": "2026-07-22",
    "entries": [
      {
        "name": "amit",
        "amount": 17208
      },
      {
        "name": "Cleaner",
        "amount": 11903
      }
    ],
    "directAmount": 0,
    "amount": 29111,
    "note": "Partial / advance salary"
  },
  {
    "date": "2026-07-28",
    "entries": [
      {
        "name": "Security Guard",
        "amount": 17746
      },
      {
        "name": "nik3",
        "amount": 16369
      },
      {
        "name": "nik2",
        "amount": 7949
      },
      {
        "name": "nik1",
        "amount": 16511
      }
    ],
    "directAmount": 0,
    "amount": 58575,
    "note": "Partial / advance salary"
  }
];

/* ── Admin Expense — scattered overhead costs ── */
const adminExpenseEntries =
[
  {
    "date": "2026-07-02",
    "entries": [
      {
        "name": "Office Rent",
        "amount": 20924
      }
    ],
    "directAmount": 0,
    "amount": 20924,
    "note": ""
  },
  {
    "date": "2026-07-05",
    "entries": [
      {
        "name": "Electricity Bill",
        "amount": 5768
      }
    ],
    "directAmount": 0,
    "amount": 5768,
    "note": ""
  },
  {
    "date": "2026-07-09",
    "entries": [
      {
        "name": "Internet & Phone",
        "amount": 2438
      }
    ],
    "directAmount": 0,
    "amount": 2438,
    "note": ""
  },
  {
    "date": "2026-07-11",
    "entries": [
      {
        "name": "Stationery",
        "amount": 3126
      }
    ],
    "directAmount": 0,
    "amount": 3126,
    "note": ""
  },
  {
    "date": "2026-07-14",
    "entries": [
      {
        "name": "Legal & Accounting",
        "amount": 1946
      }
    ],
    "directAmount": 0,
    "amount": 1946,
    "note": ""
  },
  {
    "date": "2026-07-17",
    "entries": [
      {
        "name": "Insurance Premium",
        "amount": 2024
      }
    ],
    "directAmount": 0,
    "amount": 2024,
    "note": ""
  },
  {
    "date": "2026-07-19",
    "entries": [
      {
        "name": "Equipment Maintenance",
        "amount": 5907
      }
    ],
    "directAmount": 0,
    "amount": 5907,
    "note": ""
  },
  {
    "date": "2026-07-23",
    "entries": [
      {
        "name": "Housekeeping Supplies",
        "amount": 1456
      }
    ],
    "directAmount": 0,
    "amount": 1456,
    "note": ""
  },
  {
    "date": "2026-07-26",
    "entries": [
      {
        "name": "Misc Admin",
        "amount": 3659
      }
    ],
    "directAmount": 0,
    "amount": 3659,
    "note": ""
  }
];

/* ── Partner transactions — keyed by partner name ── */
const partnerTxnsByName =
{
  "Vijayant Kohli": [
    {
      "date": "2026-07-02",
      "type": "transfer",
      "amount": 78857,
      "note": "Partner draw"
    },
    {
      "date": "2026-07-03",
      "type": "transfer",
      "amount": 85393,
      "note": "Partner draw"
    },
    {
      "date": "2026-07-27",
      "type": "receive",
      "amount": 31268,
      "note": "Profit share contribution"
    }
  ],
  "Shishir Arora": [
    {
      "date": "2026-07-09",
      "type": "receive",
      "amount": 42492,
      "note": "Advance towards expenses"
    },
    {
      "date": "2026-07-17",
      "type": "transfer",
      "amount": 82559,
      "note": "Profit distribution"
    },
    {
      "date": "2026-07-22",
      "type": "transfer",
      "amount": 34229,
      "note": "Partner draw"
    }
  ],
  "S K Pahuja": [
    {
      "date": "2026-07-15",
      "type": "transfer",
      "amount": 22727,
      "note": "Partner draw"
    },
    {
      "date": "2026-07-16",
      "type": "receive",
      "amount": 58353,
      "note": "Advance towards expenses"
    },
    {
      "date": "2026-07-18",
      "type": "receive",
      "amount": 60812,
      "note": "Capital injection"
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
    // ── Step 1: clear existing July data for these ledgers so this script is safe to re-run ──
    const deletedLedger = await LedgerEntry.deleteMany({
      kind: { $in: ["patientBill", "salary", "adminExpense"] },
      date: { $gte: MONTH_START, $lt: MONTH_END },
    });
    console.log(`🗑️  Deleted ${deletedLedger.deletedCount} existing ledger entries for July`);

    // ── Step 2: ensure the three partners exist, get their real _ids ──
    const partnerNames = Object.keys(partnerTxnsByName);
    const partnerMap = {};
    for (const name of partnerNames) {
      let partner = await Partner.findOne({ name });
      if (!partner) partner = await Partner.create({ name });
      partnerMap[name] = partner._id;
    }

    // ── Step 3: clear existing July partner transactions for these partners ──
    const deletedTxns = await PartnerTransaction.deleteMany({
      partner: { $in: Object.values(partnerMap) },
      date: { $gte: MONTH_START, $lt: MONTH_END },
    });
    console.log(`🗑️  Deleted ${deletedTxns.deletedCount} existing partner transactions for July`);

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
