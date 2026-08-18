import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./db/dbconnection.js";
import DayBook from "./models/dayBook.js";
import Partner from "./models/partner.js";
import PartnerTransaction from "./models/partnerTransaction.js";

dotenv.config();

/* ═══════════════════════════════════════════════════════════════════════
   Seed: Jeevan Anmol Hospital
   Source: jeevan.xlsx (real historical bookkeeping data)
   Date range: 2026-05-01 to 2026-05-31  (31 days)

   Mapping notes (see chat for full rationale):
   - openingCash / totalSale / totalCash / cashExpenses / cashInHand are
     copied DIRECTLY from the spreadsheet's own daily totals (ground truth),
     not re-derived from the granular columns below.
   - kitchenSale / coffeeShop / officialCr / personalCr are a best-effort
     breakdown from the sheet's sale + credit columns, for display purposes.
   - "Cash Received From <partner>" columns became PartnerTransaction
     (type "receive"); trailing per-partner advance columns became
     PartnerTransaction (type "transfer"). Non-partner columns (e.g.
     "Others"/"Hospital"/"Pantry") were left out of partner transactions.
   - Vendor "Credit Purchase" columns are not represented (no schema field).
═══════════════════════════════════════════════════════════════════════ */

const SHOP_ID = "6a82d9221a779efb7177420e";
const RANGE_START = new Date("2026-05-01T00:00:00.000Z");
const RANGE_END = new Date("2026-06-01T00:00:00.000Z");

const rawEntries = [
  {
    "date": "2026-05-01",
    "openingCash": 8371,
    "kitchenSale": 170,
    "coffeeShop": 1750,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 240,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 240,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 430,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 180,
      "Veg/Fruit": 140,
      "Milk/Curd": 351,
      "Paneer": 60,
      "Egg": 80,
      "Travel Expense": 811
    },
    "cashExpenses": 1241,
    "totalSale": 1920,
    "totalCash": 10291,
    "cashInHand": 9050
  },
  {
    "date": "2026-05-02",
    "openingCash": 9050,
    "kitchenSale": 145,
    "coffeeShop": 2025,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 335,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 335,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 505,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 120,
      "Veg/Fruit": 1120,
      "Milk/Curd": 274,
      "Snacks": 200,
      "Paneer": 160,
      "Travel Expense": 1874
    },
    "cashExpenses": 2379,
    "totalSale": 2170,
    "totalCash": 11220,
    "cashInHand": 8841
  },
  {
    "date": "2026-05-03",
    "openingCash": 8841,
    "kitchenSale": 120,
    "coffeeShop": 960,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 160,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 160,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 380,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 224,
      "Veg/Fruit": 120,
      "Milk/Curd": 154,
      "Cold Drink/Cashew Nut": 60,
      "Paneer": 80,
      "Travel Expense": 638
    },
    "cashExpenses": 1018,
    "totalSale": 1080,
    "totalCash": 9921,
    "cashInHand": 8903
  },
  {
    "date": "2026-05-04",
    "openingCash": 8903,
    "kitchenSale": 190,
    "coffeeShop": 1955,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 235,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 235,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 785,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 224,
      "Veg/Fruit": 1055,
      "Milk/Curd": 231,
      "Snacks": 240,
      "Egg": 170,
      "Travel Expense": 1920
    },
    "cashExpenses": 2705,
    "totalSale": 2145,
    "totalCash": 11048,
    "cashInHand": 8343
  },
  {
    "date": "2026-05-05",
    "openingCash": 8343,
    "kitchenSale": 170,
    "coffeeShop": 1555,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 270,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 270,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 935,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 120,
      "Veg/Fruit": 120,
      "Milk/Curd": 334,
      "Paneer": 160,
      "Egg": 80,
      "Stationery": 175,
      "Travel Expense": 989
    },
    "cashExpenses": 1924,
    "totalSale": 1725,
    "totalCash": 10068,
    "cashInHand": 8144
  },
  {
    "date": "2026-05-06",
    "openingCash": 8144,
    "kitchenSale": 185,
    "coffeeShop": 1565,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 240,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 240,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 540,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 120,
      "Veg/Fruit": 1040,
      "Milk/Curd": 231,
      "Cold Drink/Cashew Nut": 200,
      "Paneer": 60,
      "Egg": 80,
      "Ration/Biscuit": 40,
      "Travel Expense": 1771
    },
    "cashExpenses": 2311,
    "totalSale": 1750,
    "totalCash": 9894,
    "cashInHand": 7583
  },
  {
    "date": "2026-05-07",
    "openingCash": 7583,
    "kitchenSale": 150,
    "coffeeShop": 1950,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 260,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 260,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 850,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 180,
      "Veg/Fruit": 100,
      "Milk/Curd": 411,
      "Paneer": 60,
      "Egg": 80,
      "Ration/Biscuit": 40,
      "Travel Expense": 871
    },
    "cashExpenses": 1721,
    "totalSale": 2100,
    "totalCash": 9683,
    "cashInHand": 7962
  },
  {
    "date": "2026-05-08",
    "openingCash": 7962,
    "kitchenSale": 180,
    "coffeeShop": 1920,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 270,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 270,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 1285,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 120,
      "Veg/Fruit": 990,
      "Milk/Curd": 351,
      "Snacks": 280,
      "Egg": 160,
      "Ration/Biscuit": 200,
      "Travel Expense": 2101
    },
    "cashExpenses": 3386,
    "totalSale": 2100,
    "totalCash": 10062,
    "cashInHand": 6676
  },
  {
    "date": "2026-05-09",
    "openingCash": 6676,
    "kitchenSale": 180,
    "coffeeShop": 1520,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 285,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 285,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 945,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 185,
      "Veg/Fruit": 115,
      "Milk/Curd": 274,
      "Paneer": 120,
      "Egg": 80,
      "Travel Expense": 774
    },
    "cashExpenses": 1719,
    "totalSale": 1700,
    "totalCash": 8376,
    "cashInHand": 6657
  },
  {
    "date": "2026-05-10",
    "openingCash": 6657,
    "kitchenSale": 90,
    "coffeeShop": 1075,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 155,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 155,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 465,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 130,
      "Veg/Fruit": 1050,
      "Milk/Curd": 231,
      "Egg": 112,
      "Travel Expense": 1523
    },
    "cashExpenses": 1988,
    "totalSale": 1165,
    "totalCash": 7822,
    "cashInHand": 5834
  },
  {
    "date": "2026-05-11",
    "openingCash": 5834,
    "kitchenSale": 145,
    "coffeeShop": 1620,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 180,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 180,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 720,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 120,
      "Veg/Fruit": 210,
      "Milk/Curd": 231,
      "Snacks": 120,
      "Egg": 160,
      "Travel Expense": 841
    },
    "cashExpenses": 1561,
    "totalSale": 1765,
    "totalCash": 7599,
    "cashInHand": 6038
  },
  {
    "date": "2026-05-12",
    "openingCash": 6038,
    "kitchenSale": 170,
    "coffeeShop": 1535,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 175,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 175,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 550,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 224,
      "Veg/Fruit": 1070,
      "Milk/Curd": 154,
      "Paneer": 120,
      "Egg": 80,
      "Travel Expense": 1648
    },
    "cashExpenses": 2198,
    "totalSale": 1705,
    "totalCash": 7743,
    "cashInHand": 5545
  },
  {
    "date": "2026-05-13",
    "openingCash": 5545,
    "kitchenSale": 195,
    "coffeeShop": 1610,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 290,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 290,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 555,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 180,
      "Veg/Fruit": 125,
      "Milk/Curd": 154,
      "Snacks": 120,
      "Egg": 160,
      "Ration/Biscuit": 120,
      "Travel Expense": 859
    },
    "cashExpenses": 1414,
    "totalSale": 1805,
    "totalCash": 7350,
    "cashInHand": 5936
  },
  {
    "date": "2026-05-14",
    "openingCash": 5936,
    "kitchenSale": 155,
    "coffeeShop": 1740,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 200,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 200,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 1020,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 180,
      "Veg/Fruit": 1120,
      "Milk/Curd": 231,
      "Snacks": 210,
      "Egg": 80,
      "Ration/Biscuit": 120,
      "Travel Expense": 1941
    },
    "cashExpenses": 2961,
    "totalSale": 1895,
    "totalCash": 7831,
    "cashInHand": 4870
  },
  {
    "date": "2026-05-15",
    "openingCash": 4870,
    "kitchenSale": 120,
    "coffeeShop": 1075,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 320,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 320,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 640,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 120,
      "Veg/Fruit": 145,
      "Milk/Curd": 351,
      "Paneer": 160,
      "Egg": 80,
      "Travel Expense": 856
    },
    "cashExpenses": 1496,
    "totalSale": 1195,
    "totalCash": 6065,
    "cashInHand": 4569
  },
  {
    "date": "2026-05-16",
    "openingCash": 4569,
    "kitchenSale": 180,
    "coffeeShop": 1730,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 440,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 440,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 1130,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 180,
      "Veg/Fruit": 1110,
      "Milk/Curd": 351,
      "Snacks": 210,
      "Paneer": 160,
      "Egg": 80,
      "Travel Expense": 2091
    },
    "cashExpenses": 3221,
    "totalSale": 1910,
    "totalCash": 6479,
    "cashInHand": 3258
  },
  {
    "date": "2026-05-17",
    "openingCash": 3258,
    "kitchenSale": 120,
    "coffeeShop": 1335,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 105,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 105,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 615,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 164,
      "Veg/Fruit": 170,
      "Milk/Curd": 154,
      "Paneer": 60,
      "Crockery": 90,
      "Travel Expense": 638
    },
    "cashExpenses": 1253,
    "totalSale": 1455,
    "totalCash": 4713,
    "cashInHand": 3460
  },
  {
    "date": "2026-05-18",
    "openingCash": 3460,
    "kitchenSale": 155,
    "coffeeShop": 1935,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 190,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 190,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 1090,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 180,
      "Veg/Fruit": 1144,
      "Milk/Curd": 411,
      "Snacks": 60,
      "Travel Expense": 1795
    },
    "cashExpenses": 2885,
    "totalSale": 2090,
    "totalCash": 5550,
    "cashInHand": 2665
  },
  {
    "date": "2026-05-19",
    "openingCash": 2665,
    "kitchenSale": 170,
    "coffeeShop": 1820,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 265,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 265,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 765,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 164,
      "Veg/Fruit": 140,
      "Milk/Curd": 231,
      "Snacks": 120,
      "Paneer": 160,
      "Egg": 80,
      "Travel Expense": 895
    },
    "cashExpenses": 1660,
    "totalSale": 1990,
    "totalCash": 4655,
    "cashInHand": 2995
  },
  {
    "date": "2026-05-20",
    "openingCash": 2995,
    "kitchenSale": 170,
    "coffeeShop": 2215,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 320,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 320,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 780,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 180,
      "Veg/Fruit": 1110,
      "Milk/Curd": 284,
      "Snacks": 45,
      "Travel Expense": 1619
    },
    "cashExpenses": 2399,
    "totalSale": 2385,
    "totalCash": 5380,
    "cashInHand": 2981
  },
  {
    "date": "2026-05-21",
    "openingCash": 2981,
    "kitchenSale": 150,
    "coffeeShop": 1700,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 280,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 280,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 660,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 505,
      "Veg/Fruit": 155,
      "Milk/Curd": 284,
      "Paneer": 160,
      "Egg": 80,
      "Travel Expense": 1184
    },
    "cashExpenses": 1844,
    "totalSale": 1850,
    "totalCash": 4831,
    "cashInHand": 2987
  },
  {
    "date": "2026-05-22",
    "openingCash": 2987,
    "kitchenSale": 200,
    "coffeeShop": 1865,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 270,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 270,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 585,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 195,
      "Veg/Fruit": 1115,
      "Milk/Curd": 284,
      "Snacks": 210,
      "Egg": 80,
      "Travel Expense": 1884
    },
    "cashExpenses": 2469,
    "totalSale": 2065,
    "totalCash": 5052,
    "cashInHand": 2583
  },
  {
    "date": "2026-05-23",
    "openingCash": 2583,
    "kitchenSale": 200,
    "coffeeShop": 1860,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 355,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 355,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 880,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 195,
      "Veg/Fruit": 150,
      "Milk/Curd": 304,
      "Snacks": 90,
      "Egg": 80,
      "Travel Expense": 819
    },
    "cashExpenses": 1699,
    "totalSale": 2060,
    "totalCash": 4643,
    "cashInHand": 2944
  },
  {
    "date": "2026-05-24",
    "openingCash": 2944,
    "kitchenSale": 100,
    "coffeeShop": 716,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 295,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 295,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 660,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 180,
      "Veg/Fruit": 1110,
      "Milk/Curd": 160,
      "Egg": 80,
      "Conveyance": 70,
      "Travel Expense": 1600
    },
    "cashExpenses": 2260,
    "totalSale": 816,
    "totalCash": 3760,
    "cashInHand": 1500
  },
  {
    "date": "2026-05-25",
    "openingCash": 1500,
    "kitchenSale": 130,
    "coffeeShop": 1940,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 2811,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 230,
        "creditedAmount": 0
      },
      {
        "name": "Canteen Credit Collected",
        "amount": 2581,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 435,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 195,
      "Veg/Fruit": 140,
      "Milk/Curd": 284,
      "Snacks": 210,
      "Paneer": 180,
      "Egg": 80,
      "Travel Expense": 1089
    },
    "cashExpenses": 1524,
    "totalSale": 4651,
    "totalCash": 6151,
    "cashInHand": 4627
  },
  {
    "date": "2026-05-26",
    "openingCash": 4627,
    "kitchenSale": 150,
    "coffeeShop": 1630,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 1195,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 195,
        "creditedAmount": 0
      },
      {
        "name": "Canteen Credit Collected",
        "amount": 1000,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 925,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 250,
      "Veg/Fruit": 1060,
      "Milk/Curd": 364,
      "Paneer": 200,
      "Egg": 160,
      "Travel Expense": 2034
    },
    "cashExpenses": 2959,
    "totalSale": 2780,
    "totalCash": 7407,
    "cashInHand": 4448
  },
  {
    "date": "2026-05-27",
    "openingCash": 4448,
    "kitchenSale": 100,
    "coffeeShop": 1745,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 220,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 220,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 710,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Veg/Fruit": 130,
      "Milk/Curd": 160,
      "Snacks": 300,
      "Cold Drink/Cashew Nut": 120,
      "Egg": 80,
      "Ration/Biscuit": 160,
      "Travel Expense": 950
    },
    "cashExpenses": 1660,
    "totalSale": 1845,
    "totalCash": 6293,
    "cashInHand": 4633
  },
  {
    "date": "2026-05-28",
    "openingCash": 4633,
    "kitchenSale": 200,
    "coffeeShop": 1850,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 235,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 235,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 700,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 195,
      "Veg/Fruit": 1120,
      "Milk/Curd": 284,
      "Paneer": 60,
      "Egg": 80,
      "Ration/Biscuit": 160,
      "Travel Expense": 1899
    },
    "cashExpenses": 2599,
    "totalSale": 2050,
    "totalCash": 6683,
    "cashInHand": 4084
  },
  {
    "date": "2026-05-29",
    "openingCash": 4084,
    "kitchenSale": 175,
    "coffeeShop": 1640,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 7530,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 225,
        "creditedAmount": 0
      },
      {
        "name": "Canteen Credit Collected",
        "amount": 7305,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 760,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 195,
      "Veg/Fruit": 130,
      "Milk/Curd": 284,
      "Paneer": 40,
      "Egg": 96,
      "Travel Expense": 745
    },
    "cashExpenses": 1505,
    "totalSale": 9120,
    "totalCash": 13204,
    "cashInHand": 11699
  },
  {
    "date": "2026-05-30",
    "openingCash": 11699,
    "kitchenSale": 125,
    "coffeeShop": 1500,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 215,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 215,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 645,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 174,
      "Veg/Fruit": 1145,
      "Milk/Curd": 160,
      "Paneer": 60,
      "Egg": 96,
      "HK": 160,
      "Travel Expense": 1795
    },
    "cashExpenses": 2440,
    "totalSale": 1625,
    "totalCash": 13324,
    "cashInHand": 10884
  },
  {
    "date": "2026-05-31",
    "openingCash": 10884,
    "kitchenSale": 90,
    "coffeeShop": 730,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 140,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 140,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 0,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 195,
      "Veg/Fruit": 135,
      "Milk/Curd": 240,
      "Cold Drink/Cashew Nut": 60,
      "Paneer": 75,
      "Egg": 96,
      "Travel Expense": 801
    },
    "cashExpenses": 801,
    "totalSale": 820,
    "totalCash": 11704,
    "cashInHand": 10903
  }
];

const partnerTxnsByName = {};

const buildEntry = (raw) => {
  const kitchenSale = raw.kitchenSale;
  const coffeeShop = raw.coffeeShop;

  return {
    date: raw.date,
    shop: SHOP_ID,

    openingCash: raw.openingCash,

    kitchenSale,
    kitchenSubTabs: [{ name: "Kitchen Sale", entries: [], directAmount: kitchenSale }],
    kitchenSaleEntries: [],

    coffeeShop,
    coffeeShopSale: coffeeShop,
    coffeeSubTabs: [{ name: "Coffee Shop", entries: [], directAmount: coffeeShop }],
    coffeeShopEntries: [],

    officialCr: raw.officialCr,
    officialCrEntries: raw.officialCrEntries,
    personalCr: raw.personalCr,
    personalCrEntries: raw.personalCrEntries,

    upiReceived: raw.upiReceived,

    cafeSale: 0,
    cafeNight: 0,

    totalSale: raw.totalSale,
    totalCash: raw.totalCash,

    cashToOffice: raw.cashToOffice,
    cashToOfficeEntries: [],

    salary: raw.salary,
    salaryEntries: raw.salaryEntries,
    advance: raw.advance,
    advanceEntries: raw.advanceEntries,

    expenseEntries: raw.expenseEntries,
    cashExpenses: raw.cashExpenses,

    cashInHand: raw.cashInHand,
    closingCash: raw.cashInHand,
  };
};

const run = async () => {
  await connectDB();

  try {
    const deletedDaybook = await DayBook.deleteMany({
      shop: SHOP_ID,
      date: { $gte: RANGE_START, $lt: RANGE_END },
    });
    console.log(`Deleted ${deletedDaybook.deletedCount} existing daybook entries for Jeevan Anmol Hospital`);

    const docs = rawEntries.map(buildEntry);
    const result = await DayBook.insertMany(docs, { ordered: true });
    console.log(`Inserted ${result.length} daybook entries for Jeevan Anmol Hospital`);

    // Ensure partners exist, then reseed their transactions for this shop + range
    const partnerNames = Object.keys(partnerTxnsByName);
    const partnerMap = {};
    for (const name of partnerNames) {
      let partner = await Partner.findOne({ name });
      if (!partner) partner = await Partner.create({ name });
      partnerMap[name] = partner._id;
    }

    const deletedTxns = await PartnerTransaction.deleteMany({
      shop: SHOP_ID,
      partner: { $in: Object.values(partnerMap) },
      date: { $gte: RANGE_START, $lt: RANGE_END },
    });
    console.log(`Deleted ${deletedTxns.deletedCount} existing partner transactions for this shop/range`);

    const txnDocs = [];
    for (const [name, txns] of Object.entries(partnerTxnsByName)) {
      txns.forEach((t) => txnDocs.push({ ...t, partner: partnerMap[name], shop: SHOP_ID }));
    }
    if (txnDocs.length) {
      const txnResult = await PartnerTransaction.insertMany(txnDocs, { ordered: true });
      console.log(`Inserted ${txnResult.length} partner transactions for Jeevan Anmol Hospital`);
    } else {
      console.log("No partner transactions found in source data for Jeevan Anmol Hospital");
    }

    const first = result[0];
    const last = result[result.length - 1];
    console.log(`Opening cash on ${first.date.toDateString()}: Rs ${first.openingCash}`);
    console.log(`Closing cash on ${last.date.toDateString()}: Rs ${last.cashInHand}`);
  } catch (err) {
    console.error("Seed failed:", err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

run();
