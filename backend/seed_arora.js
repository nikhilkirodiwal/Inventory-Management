import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./db/dbconnection.js";
import DayBook from "./models/dayBook.js";
import Partner from "./models/partner.js";
import PartnerTransaction from "./models/partnerTransaction.js";

dotenv.config();

/* ═══════════════════════════════════════════════════════════════════════
   Seed: Arora Hospital (Bharatpur Raj)
   Source: arora.xlsx (real historical bookkeeping data)
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

const SHOP_ID = "6a82da0e1a779efb71774214";
const RANGE_START = new Date("2026-05-01T00:00:00.000Z");
const RANGE_END = new Date("2026-06-01T00:00:00.000Z");

const rawEntries = [
  {
    "date": "2026-05-01",
    "openingCash": -6313,
    "kitchenSale": 350,
    "coffeeShop": 2740,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 416,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 270,
      "Bread/Butter": 50,
      "Veg/Fruit": 620,
      "Egg/Non-veg": 160,
      "Travel Expense": 1100
    },
    "cashExpenses": 1516,
    "totalSale": 3090,
    "totalCash": -3223,
    "cashInHand": -4739
  },
  {
    "date": "2026-05-02",
    "openingCash": -4739,
    "kitchenSale": 390,
    "coffeeShop": 2885,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 205,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 324,
      "Bread/Butter": 50,
      "Cold Drink/Cashew Nut": 4440,
      "GAS": 1800,
      "Veg/Fruit": 690,
      "Paneer": 270,
      "Travel Expense": 7574
    },
    "cashExpenses": 7779,
    "totalSale": 3275,
    "totalCash": -1464,
    "cashInHand": -9243
  },
  {
    "date": "2026-05-03",
    "openingCash": -9243,
    "kitchenSale": 405,
    "coffeeShop": 3350,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 345,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 324,
      "Bread/Butter": 50,
      "Mineral Water": 1200,
      "Veg/Fruit": 640,
      "Egg/Non-veg": 160,
      "Travel Expense": 2374
    },
    "cashExpenses": 2719,
    "totalSale": 3755,
    "totalCash": -5488,
    "cashInHand": -8207
  },
  {
    "date": "2026-05-04",
    "openingCash": -8207,
    "kitchenSale": 380,
    "coffeeShop": 3385,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 205,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 324,
      "Bread/Butter": 50,
      "GAS": 1800,
      "Veg/Fruit": 680,
      "Paneer": 90,
      "Travel Expense": 2944
    },
    "cashExpenses": 3149,
    "totalSale": 3765,
    "totalCash": -4442,
    "cashInHand": -7591
  },
  {
    "date": "2026-05-05",
    "openingCash": -7591,
    "kitchenSale": 410,
    "coffeeShop": 2885,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 305,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 324,
      "Bread/Butter": 50,
      "Veg/Fruit": 660,
      "Ration": 240,
      "Travel Expense": 1274
    },
    "cashExpenses": 1579,
    "totalSale": 3295,
    "totalCash": -4296,
    "cashInHand": -5875
  },
  {
    "date": "2026-05-06",
    "openingCash": -5875,
    "kitchenSale": 380,
    "coffeeShop": 2555,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 337,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 324,
      "Bread/Butter": 100,
      "GAS": 1800,
      "Veg/Fruit": 750,
      "Paneer": 360,
      "Ration": 205,
      "Travel Expense": 3539
    },
    "cashExpenses": 3876,
    "totalSale": 2935,
    "totalCash": -2940,
    "cashInHand": -6816
  },
  {
    "date": "2026-05-07",
    "openingCash": -6816,
    "kitchenSale": 380,
    "coffeeShop": 2205,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 155,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 324,
      "Bread/Butter": 100,
      "Snacks (chips/juice)": 580,
      "Veg/Fruit": 660,
      "Egg/Non-veg": 160,
      "Ration": 380,
      "Travel Expense": 2204
    },
    "cashExpenses": 2359,
    "totalSale": 2585,
    "totalCash": -4231,
    "cashInHand": -6590
  },
  {
    "date": "2026-05-08",
    "openingCash": -6590,
    "kitchenSale": 410,
    "coffeeShop": 2420,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 285,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 324,
      "Bread/Butter": 50,
      "Snacks (chips/juice)": 2564,
      "GAS": 1800,
      "Veg/Fruit": 710,
      "Travel Expense": 5448
    },
    "cashExpenses": 5733,
    "totalSale": 2830,
    "totalCash": -3760,
    "cashInHand": -9493
  },
  {
    "date": "2026-05-09",
    "openingCash": -9493,
    "kitchenSale": 450,
    "coffeeShop": 2980,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 265,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 272,
      "Bread/Butter": 50,
      "Cold Drink/Cashew Nut": 2730,
      "Veg/Fruit": 650,
      "Travel Expense": 3702
    },
    "cashExpenses": 3967,
    "totalSale": 3430,
    "totalCash": -6063,
    "cashInHand": -10030
  },
  {
    "date": "2026-05-10",
    "openingCash": -10030,
    "kitchenSale": 500,
    "coffeeShop": 2880,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 482,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 204,
      "Bread/Butter": 100,
      "Snacks (chips/juice)": 60,
      "GAS": 1800,
      "Veg/Fruit": 670,
      "Egg/Non-veg": 160,
      "Paneer": 270,
      "Travel Expense": 3264
    },
    "cashExpenses": 3746,
    "totalSale": 3380,
    "totalCash": -6650,
    "cashInHand": -10396
  },
  {
    "date": "2026-05-11",
    "openingCash": -10396,
    "kitchenSale": 430,
    "coffeeShop": 2735,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 95,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 270,
      "Bread/Butter": 55,
      "Veg/Fruit": 680,
      "Travel Expense": 1005
    },
    "cashExpenses": 1100,
    "totalSale": 3165,
    "totalCash": 2769,
    "cashInHand": 1669
  },
  {
    "date": "2026-05-12",
    "openingCash": 1669,
    "kitchenSale": 380,
    "coffeeShop": 2690,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 429,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 216,
      "Bread/Butter": 55,
      "GAS": 1800,
      "Veg/Fruit": 650,
      "Egg/Non-veg": 160,
      "Room Rent": 5000,
      "Travel Expense": 7881
    },
    "cashExpenses": 8310,
    "totalSale": 3070,
    "totalCash": 4739,
    "cashInHand": -3571
  },
  {
    "date": "2026-05-13",
    "openingCash": -3571,
    "kitchenSale": 340,
    "coffeeShop": 3365,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 395,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 162,
      "Snacks (chips/juice)": 95,
      "Cold Drink/Cashew Nut": 1710,
      "Veg/Fruit": 680,
      "Paneer": 270,
      "Travel Expense": 2917
    },
    "cashExpenses": 3312,
    "totalSale": 3705,
    "totalCash": 134,
    "cashInHand": -3178
  },
  {
    "date": "2026-05-14",
    "openingCash": -3178,
    "kitchenSale": 400,
    "coffeeShop": 2645,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 345,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 270,
      "Bread/Butter": 110,
      "GAS": 1800,
      "Veg/Fruit": 700,
      "Travel Expense": 2880
    },
    "cashExpenses": 3225,
    "totalSale": 3045,
    "totalCash": -133,
    "cashInHand": -3358
  },
  {
    "date": "2026-05-15",
    "openingCash": -3358,
    "kitchenSale": 390,
    "coffeeShop": 2930,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 290,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 270,
      "Bread/Butter": 55,
      "Cold Drink/Cashew Nut": 660,
      "Veg/Fruit": 670,
      "Travel Expense": 1655
    },
    "cashExpenses": 1945,
    "totalSale": 3320,
    "totalCash": -38,
    "cashInHand": -1983
  },
  {
    "date": "2026-05-16",
    "openingCash": -1983,
    "kitchenSale": 360,
    "coffeeShop": 3080,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 395,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 270,
      "Bread/Butter": 55,
      "Cold Drink/Cashew Nut": 525,
      "GAS": 1800,
      "Veg/Fruit": 630,
      "Egg/Non-veg": 160,
      "Paneer": 270,
      "Travel Expense": 3710
    },
    "cashExpenses": 4105,
    "totalSale": 3440,
    "totalCash": 1457,
    "cashInHand": -2648
  },
  {
    "date": "2026-05-17",
    "openingCash": -2648,
    "kitchenSale": 400,
    "coffeeShop": 3575,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 480,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 324,
      "Bread/Butter": 110,
      "Snacks (chips/juice)": 72,
      "Cold Drink/Cashew Nut": 660,
      "Veg/Fruit": 710,
      "Ration": 250,
      "Travel Expense": 2126
    },
    "cashExpenses": 2606,
    "totalSale": 3975,
    "totalCash": 1327,
    "cashInHand": -1279
  },
  {
    "date": "2026-05-18",
    "openingCash": -1279,
    "kitchenSale": 380,
    "coffeeShop": 3365,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 470,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 324,
      "Bread/Butter": 150,
      "Snacks (chips/juice)": 1631,
      "Cold Drink/Cashew Nut": 3050,
      "GAS": 1800,
      "Veg/Fruit": 650,
      "Travel Expense": 7605
    },
    "cashExpenses": 8075,
    "totalSale": 3745,
    "totalCash": 2466,
    "cashInHand": -5609
  },
  {
    "date": "2026-05-19",
    "openingCash": -5609,
    "kitchenSale": 400,
    "coffeeShop": 3080,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 485,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 270,
      "Bread/Butter": 55,
      "Mineral Water": 1200,
      "Veg/Fruit": 630,
      "Travel Expense": 2155
    },
    "cashExpenses": 2640,
    "totalSale": 3480,
    "totalCash": -2129,
    "cashInHand": -4769
  },
  {
    "date": "2026-05-20",
    "openingCash": -4769,
    "kitchenSale": 320,
    "coffeeShop": 2630,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 570,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 324,
      "Bread/Butter": 55,
      "GAS": 1800,
      "Veg/Fruit": 670,
      "Paneer": 270,
      "Travel Expense": 3119
    },
    "cashExpenses": 3689,
    "totalSale": 2950,
    "totalCash": -1819,
    "cashInHand": -5508
  },
  {
    "date": "2026-05-21",
    "openingCash": -5508,
    "kitchenSale": 330,
    "coffeeShop": 3210,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 384,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 324,
      "Bread/Butter": 110,
      "Cold Drink/Cashew Nut": 2370,
      "Veg/Fruit": 710,
      "Travel Expense": 3514
    },
    "cashExpenses": 3898,
    "totalSale": 3540,
    "totalCash": -1968,
    "cashInHand": -5866
  },
  {
    "date": "2026-05-22",
    "openingCash": -5866,
    "kitchenSale": 300,
    "coffeeShop": 3560,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 582,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 216,
      "Bread/Butter": 100,
      "Snacks (chips/juice)": 137,
      "GAS": 1800,
      "Veg/Fruit": 690,
      "Egg/Non-veg": 160,
      "Travel Expense": 3103
    },
    "cashExpenses": 3685,
    "totalSale": 3860,
    "totalCash": -2006,
    "cashInHand": -5691
  },
  {
    "date": "2026-05-23",
    "openingCash": -5691,
    "kitchenSale": 350,
    "coffeeShop": 3290,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 475,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 324,
      "Bread/Butter": 50,
      "Cold Drink/Cashew Nut": 1800,
      "Veg/Fruit": 800,
      "Paneer": 360,
      "Ration": 140,
      "Travel Expense": 3474
    },
    "cashExpenses": 3949,
    "totalSale": 3640,
    "totalCash": -2051,
    "cashInHand": -6000
  },
  {
    "date": "2026-05-24",
    "openingCash": -6000,
    "kitchenSale": 420,
    "coffeeShop": 3310,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 330,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 324,
      "Bread/Butter": 50,
      "GAS": 1800,
      "Veg/Fruit": 700,
      "Travel Expense": 2874
    },
    "cashExpenses": 3204,
    "totalSale": 3730,
    "totalCash": -2270,
    "cashInHand": -5474
  },
  {
    "date": "2026-05-25",
    "openingCash": -5474,
    "kitchenSale": 380,
    "coffeeShop": 3095,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 327,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 280,
      "Bread/Butter": 110,
      "Mineral Water": 1440,
      "Veg/Fruit": 660,
      "Ration": 1500,
      "Travel Expense": 3990
    },
    "cashExpenses": 4317,
    "totalSale": 3475,
    "totalCash": -1999,
    "cashInHand": -6316
  },
  {
    "date": "2026-05-26",
    "openingCash": -6316,
    "kitchenSale": 470,
    "coffeeShop": 2900,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 525,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 280,
      "Bread/Butter": 55,
      "GAS": 1800,
      "Veg/Fruit": 700,
      "Travel Expense": 2835
    },
    "cashExpenses": 3360,
    "totalSale": 3370,
    "totalCash": -2946,
    "cashInHand": -6306
  },
  {
    "date": "2026-05-27",
    "openingCash": -6306,
    "kitchenSale": 380,
    "coffeeShop": 2640,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 610,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 336,
      "Bread/Butter": 50,
      "Veg/Fruit": 690,
      "Egg/Non-veg": 160,
      "Paneer": 270,
      "Travel Expense": 1506
    },
    "cashExpenses": 2116,
    "totalSale": 3020,
    "totalCash": -3286,
    "cashInHand": -5402
  },
  {
    "date": "2026-05-28",
    "openingCash": -5402,
    "kitchenSale": 400,
    "coffeeShop": 2615,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 190,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 280,
      "Bread/Butter": 55,
      "Snacks (chips/juice)": 2200,
      "Cold Drink/Cashew Nut": 3420,
      "GAS": 1800,
      "Veg/Fruit": 630,
      "Ration": 100,
      "Travel Expense": 8485
    },
    "cashExpenses": 8675,
    "totalSale": 3015,
    "totalCash": -2387,
    "cashInHand": -11062
  },
  {
    "date": "2026-05-29",
    "openingCash": -11062,
    "kitchenSale": 450,
    "coffeeShop": 3135,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 574,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 336,
      "Bread/Butter": 50,
      "Veg/Fruit": 630,
      "Egg/Non-veg": 160,
      "Travel Expense": 1176
    },
    "cashExpenses": 1750,
    "totalSale": 3585,
    "totalCash": -7477,
    "cashInHand": -9227
  },
  {
    "date": "2026-05-30",
    "openingCash": -9227,
    "kitchenSale": 410,
    "coffeeShop": 3180,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 422,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 336,
      "Bread/Butter": 50,
      "Snacks (chips/juice)": 127,
      "GAS": 1800,
      "Veg/Fruit": 680,
      "Paneer": 270,
      "Travel Expense": 3263
    },
    "cashExpenses": 3685,
    "totalSale": 3590,
    "totalCash": -5637,
    "cashInHand": -9322
  },
  {
    "date": "2026-05-31",
    "openingCash": -9322,
    "kitchenSale": 360,
    "coffeeShop": 3085,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 285,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 270,
      "Bread/Butter": 55,
      "Cold Drink/Cashew Nut": 1440,
      "Veg/Fruit": 650,
      "Egg/Non-veg": 160,
      "Travel Expense": 2575
    },
    "cashExpenses": 2860,
    "totalSale": 3445,
    "totalCash": -5877,
    "cashInHand": -8737
  }
];

const partnerTxnsByName = {
  "Shishir Arora": [
    {
      "date": "2026-05-11",
      "type": "receive",
      "amount": 10000,
      "note": "Cash received (daybook)"
    }
  ]
};

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
    console.log(`Deleted ${deletedDaybook.deletedCount} existing daybook entries for Arora Hospital (Bharatpur Raj)`);

    const docs = rawEntries.map(buildEntry);
    const result = await DayBook.insertMany(docs, { ordered: true });
    console.log(`Inserted ${result.length} daybook entries for Arora Hospital (Bharatpur Raj)`);

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
      console.log(`Inserted ${txnResult.length} partner transactions for Arora Hospital (Bharatpur Raj)`);
    } else {
      console.log("No partner transactions found in source data for Arora Hospital (Bharatpur Raj)");
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
