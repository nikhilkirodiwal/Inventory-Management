import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./db/dbconnection.js";
import DayBook from "./models/dayBook.js";
import Partner from "./models/partner.js";
import PartnerTransaction from "./models/partnerTransaction.js";

dotenv.config();

/* ═══════════════════════════════════════════════════════════════════════
   Seed: Ujala Cygnus Moradabad UP
   Source: ujala.xlsx (real historical bookkeeping data)
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

const SHOP_ID = "6a82d73e1a779efb71774208";
const RANGE_START = new Date("2026-05-01T00:00:00.000Z");
const RANGE_END = new Date("2026-06-01T00:00:00.000Z");

const rawEntries = [
  {
    "date": "2026-05-01",
    "openingCash": 30906,
    "kitchenSale": 0,
    "coffeeShop": 5395,
    "officialCr": 985,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 985
      }
    ],
    "personalCr": 270,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 270,
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
      "Bread/Butter": 480,
      "Egg/Non-veg": 145,
      "Mineral Water": 7000,
      "Paneer": 160,
      "Ration": 180,
      "Room/Rent": 13000,
      "Conveyance": 100,
      "Travel Expense": 21065
    },
    "cashExpenses": 21065,
    "totalSale": 5395,
    "totalCash": 36301,
    "cashInHand": 15236
  },
  {
    "date": "2026-05-02",
    "openingCash": 15236,
    "kitchenSale": 0,
    "coffeeShop": 5425,
    "officialCr": 640,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 640
      }
    ],
    "personalCr": 105,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 105,
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
      "Milk/Curd": 210,
      "Bread/Butter": 560,
      "Cold Drink/Cashew Nut": 1500,
      "Egg/Non-veg": 176,
      "Disposable": 50,
      "Paneer": 100,
      "Conveyance": 100,
      "Travel Expense": 2696
    },
    "cashExpenses": 2696,
    "totalSale": 5425,
    "totalCash": 20661,
    "cashInHand": 17965
  },
  {
    "date": "2026-05-03",
    "openingCash": 17965,
    "kitchenSale": 0,
    "coffeeShop": 3585,
    "officialCr": 565,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 565
      }
    ],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 0,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 340,
      "Egg/Non-veg": 170,
      "Disposable": 400,
      "Overtime": 2000,
      "Paneer": 160,
      "Ration": 60,
      "Conveyance": 100,
      "Travel Expense": 3230
    },
    "cashExpenses": 3230,
    "totalSale": 3585,
    "totalCash": 21550,
    "cashInHand": 18320
  },
  {
    "date": "2026-05-04",
    "openingCash": 18320,
    "kitchenSale": 0,
    "coffeeShop": 4792,
    "officialCr": 1045,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1045
      }
    ],
    "personalCr": 135,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 135,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 0,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 1500,
    "advanceEntries": [
      {
        "name": "Staff",
        "amount": 1500
      }
    ],
    "expenseEntries": {
      "Bread/Butter": 360,
      "Egg/Non-veg": 140,
      "Paneer": 210,
      "Ration": 90,
      "Travel Expense": 800
    },
    "cashExpenses": 2300,
    "totalSale": 4792,
    "totalCash": 23112,
    "cashInHand": 20812
  },
  {
    "date": "2026-05-05",
    "openingCash": 20812,
    "kitchenSale": 0,
    "coffeeShop": 5452,
    "officialCr": 1030,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1030
      }
    ],
    "personalCr": 130,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 130,
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
      "Bread/Butter": 500,
      "Biscuit/Chips-Juice": 180,
      "GAS": 1700,
      "Egg/Non-veg": 149,
      "Mineral Water": 7000,
      "Paneer": 160,
      "Ration": 430,
      "Conveyance": 200,
      "Travel Expense": 10319
    },
    "cashExpenses": 10319,
    "totalSale": 5452,
    "totalCash": 26264,
    "cashInHand": 15945
  },
  {
    "date": "2026-05-06",
    "openingCash": 15945,
    "kitchenSale": 0,
    "coffeeShop": 5727,
    "officialCr": 1415,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1415
      }
    ],
    "personalCr": 130,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 130,
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
      "Bread/Butter": 622,
      "Cold Drink/Cashew Nut": 180,
      "Veg/Fruit": 90,
      "Egg/Non-veg": 140,
      "Mineral Water": 320,
      "Paneer": 160,
      "Ration": 70,
      "Misc/Repair": 500,
      "Conveyance": 100,
      "Travel Expense": 2182
    },
    "cashExpenses": 2182,
    "totalSale": 5727,
    "totalCash": 21672,
    "cashInHand": 19490
  },
  {
    "date": "2026-05-07",
    "openingCash": 19490,
    "kitchenSale": 0,
    "coffeeShop": 5352,
    "officialCr": 515,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 515
      }
    ],
    "personalCr": 120,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 120,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 0,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 8867,
    "advanceEntries": [
      {
        "name": "Staff",
        "amount": 8867
      }
    ],
    "expenseEntries": {
      "Milk/Curd": 350,
      "Bread/Butter": 460,
      "Veg/Fruit": 120,
      "Egg/Non-veg": 170,
      "Paneer": 550,
      "Ration": 1100,
      "Travel Expense": 2750
    },
    "cashExpenses": 11617,
    "totalSale": 5352,
    "totalCash": 24842,
    "cashInHand": 13225
  },
  {
    "date": "2026-05-08",
    "openingCash": 13225,
    "kitchenSale": 0,
    "coffeeShop": 4202,
    "officialCr": 440,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 440
      }
    ],
    "personalCr": 105,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 105,
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
      "Milk/Curd": 200,
      "Bread/Butter": 385,
      "Egg/Non-veg": 118,
      "Paneer": 160,
      "Ration": 400,
      "Conveyance": 100,
      "Travel Expense": 1363
    },
    "cashExpenses": 1363,
    "totalSale": 4202,
    "totalCash": 17427,
    "cashInHand": 16064
  },
  {
    "date": "2026-05-09",
    "openingCash": 16064,
    "kitchenSale": 0,
    "coffeeShop": 4402,
    "officialCr": 1990,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1990
      }
    ],
    "personalCr": 130,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 130,
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
      "Milk/Curd": 105,
      "Bread/Butter": 350,
      "Egg/Non-veg": 98,
      "Paneer": 160,
      "Ration": 140,
      "Misc/Repair": 2800,
      "Travel Expense": 3653
    },
    "cashExpenses": 3653,
    "totalSale": 4402,
    "totalCash": 20466,
    "cashInHand": 16813
  },
  {
    "date": "2026-05-10",
    "openingCash": 16813,
    "kitchenSale": 0,
    "coffeeShop": 3462,
    "officialCr": 790,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 790
      }
    ],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 0,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 300,
    "advanceEntries": [
      {
        "name": "Staff",
        "amount": 300
      }
    ],
    "expenseEntries": {
      "Bread/Butter": 460,
      "Egg/Non-veg": 60,
      "Disposable": 500,
      "Paneer": 60,
      "Ration": 50,
      "Misc/Repair": 200,
      "Conveyance": 180,
      "Travel Expense": 1510
    },
    "cashExpenses": 1810,
    "totalSale": 3462,
    "totalCash": 20275,
    "cashInHand": 18465
  },
  {
    "date": "2026-05-11",
    "openingCash": 18465,
    "kitchenSale": 0,
    "coffeeShop": 5590,
    "officialCr": 665,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 665
      }
    ],
    "personalCr": 160,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 160,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 0,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 300,
    "advanceEntries": [
      {
        "name": "Staff",
        "amount": 300
      }
    ],
    "expenseEntries": {
      "Bread/Butter": 745,
      "Cold Drink/Cashew Nut": 2450,
      "Egg/Non-veg": 150,
      "Mineral Water": 7000,
      "Paneer": 160,
      "Ration": 60,
      "Misc/Repair": 250,
      "Travel Expense": 10815
    },
    "cashExpenses": 11115,
    "totalSale": 5590,
    "totalCash": 24055,
    "cashInHand": 12940
  },
  {
    "date": "2026-05-12",
    "openingCash": 12940,
    "kitchenSale": 0,
    "coffeeShop": 6211,
    "officialCr": 840,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 840
      }
    ],
    "personalCr": 225,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 225,
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
      "Bread/Butter": 510,
      "GAS": 1500,
      "Egg/Non-veg": 150,
      "Ration": 140,
      "Travel Expense": 2300
    },
    "cashExpenses": 2300,
    "totalSale": 6211,
    "totalCash": 19151,
    "cashInHand": 16851
  },
  {
    "date": "2026-05-13",
    "openingCash": 16851,
    "kitchenSale": 0,
    "coffeeShop": 5406,
    "officialCr": 2065,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 2065
      }
    ],
    "personalCr": 90,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 90,
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
      "Bread/Butter": 1005,
      "Egg/Non-veg": 148,
      "Overtime": 1000,
      "Paneer": 200,
      "Conveyance": 100,
      "Travel Expense": 2453
    },
    "cashExpenses": 2453,
    "totalSale": 5406,
    "totalCash": 22257,
    "cashInHand": 19804
  },
  {
    "date": "2026-05-14",
    "openingCash": 19804,
    "kitchenSale": 0,
    "coffeeShop": 6006,
    "officialCr": 1250,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1250
      }
    ],
    "personalCr": 70,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 70,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 0,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 200,
    "advanceEntries": [
      {
        "name": "Staff",
        "amount": 200
      }
    ],
    "expenseEntries": {
      "Milk/Curd": 350,
      "Bread/Butter": 1090,
      "Egg/Non-veg": 165,
      "Paneer": 320,
      "Conveyance": 200,
      "Travel Expense": 2125
    },
    "cashExpenses": 2325,
    "totalSale": 6006,
    "totalCash": 25810,
    "cashInHand": 23485
  },
  {
    "date": "2026-05-15",
    "openingCash": 23485,
    "kitchenSale": 0,
    "coffeeShop": 5690,
    "officialCr": 1390,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1390
      }
    ],
    "personalCr": 290,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 290,
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
      "Bread/Butter": 435,
      "Cold Drink/Cashew Nut": 2000,
      "Egg/Non-veg": 186,
      "Paneer": 170,
      "Travel Expense": 2791
    },
    "cashExpenses": 2791,
    "totalSale": 5690,
    "totalCash": 29175,
    "cashInHand": 26384
  },
  {
    "date": "2026-05-16",
    "openingCash": 26384,
    "kitchenSale": 0,
    "coffeeShop": 4142,
    "officialCr": 660,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 660
      }
    ],
    "personalCr": 120,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 120,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 0,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 200,
    "advanceEntries": [
      {
        "name": "Staff",
        "amount": 200
      }
    ],
    "expenseEntries": {
      "Milk/Curd": 200,
      "Bread/Butter": 720,
      "Cold Drink/Cashew Nut": 2000,
      "Veg/Fruit": 455,
      "Egg/Non-veg": 150,
      "Paneer": 450,
      "Ration": 200,
      "Misc/Repair": 1120,
      "Conveyance": 100,
      "Travel Expense": 5395
    },
    "cashExpenses": 5595,
    "totalSale": 4142,
    "totalCash": 30526,
    "cashInHand": 24931
  },
  {
    "date": "2026-05-17",
    "openingCash": 24931,
    "kitchenSale": 0,
    "coffeeShop": 3969,
    "officialCr": 690,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 690
      }
    ],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 0,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 500,
    "advanceEntries": [
      {
        "name": "Staff",
        "amount": 500
      }
    ],
    "expenseEntries": {
      "Bread/Butter": 535,
      "Egg/Non-veg": 160,
      "Paneer": 160,
      "Ration": 20,
      "Misc/Repair": 400,
      "Travel Expense": 1275
    },
    "cashExpenses": 1775,
    "totalSale": 3969,
    "totalCash": 28900,
    "cashInHand": 27125
  },
  {
    "date": "2026-05-18",
    "openingCash": 27125,
    "kitchenSale": 0,
    "coffeeShop": 6012,
    "officialCr": 1215,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1215
      }
    ],
    "personalCr": 120,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 120,
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
      "Bread/Butter": 460,
      "Egg/Non-veg": 120,
      "Mineral Water": 7000,
      "Paneer": 160,
      "Misc/Repair": 680,
      "Travel Expense": 8420
    },
    "cashExpenses": 8420,
    "totalSale": 6012,
    "totalCash": 33137,
    "cashInHand": 24717
  },
  {
    "date": "2026-05-19",
    "openingCash": 24717,
    "kitchenSale": 0,
    "coffeeShop": 6392,
    "officialCr": 1035,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1035
      }
    ],
    "personalCr": 100,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 100,
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
      "Bread/Butter": 455,
      "Egg/Non-veg": 150,
      "Paneer": 160,
      "Ration": 50,
      "Travel Expense": 815
    },
    "cashExpenses": 815,
    "totalSale": 6392,
    "totalCash": 31109,
    "cashInHand": 30294
  },
  {
    "date": "2026-05-20",
    "openingCash": 30344,
    "kitchenSale": 0,
    "coffeeShop": 6085,
    "officialCr": 1455,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1455
      }
    ],
    "personalCr": 185,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 185,
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
      "Milk/Curd": 180,
      "Bread/Butter": 515,
      "Cold Drink/Cashew Nut": 2450,
      "Egg/Non-veg": 120,
      "Overtime": 4000,
      "Paneer": 280,
      "Ration": 280,
      "Conveyance": 200,
      "Travel Expense": 8025
    },
    "cashExpenses": 8025,
    "totalSale": 6085,
    "totalCash": 36429,
    "cashInHand": 28404
  },
  {
    "date": "2026-05-21",
    "openingCash": 28404,
    "kitchenSale": 0,
    "coffeeShop": 5187,
    "officialCr": 435,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 435
      }
    ],
    "personalCr": 850,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 850,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 0,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 5000,
    "advanceEntries": [
      {
        "name": "Staff",
        "amount": 5000
      }
    ],
    "expenseEntries": {
      "Bread/Butter": 575,
      "Egg/Non-veg": 190,
      "Paneer": 420,
      "Ration": 250,
      "Misc/Repair": 5900,
      "Conveyance": 200,
      "Travel Expense": 7535
    },
    "cashExpenses": 12535,
    "totalSale": 5187,
    "totalCash": 33591,
    "cashInHand": 21056
  },
  {
    "date": "2026-05-22",
    "openingCash": 21056,
    "kitchenSale": 0,
    "coffeeShop": 5842,
    "officialCr": 870,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 870
      }
    ],
    "personalCr": 100,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 100,
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
      "Bread/Butter": 545,
      "Veg/Fruit": 2780,
      "Egg/Non-veg": 120,
      "Stationery": 920,
      "Paneer": 160,
      "Ration": 60,
      "Misc/Repair": 490,
      "Conveyance": 200,
      "Travel Expense": 5275
    },
    "cashExpenses": 5275,
    "totalSale": 5842,
    "totalCash": 26898,
    "cashInHand": 21623
  },
  {
    "date": "2026-05-23",
    "openingCash": 21623,
    "kitchenSale": 0,
    "coffeeShop": 5480,
    "officialCr": 555,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 555
      }
    ],
    "personalCr": 260,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 260,
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
      "Milk/Curd": 360,
      "Bread/Butter": 555,
      "Egg/Non-veg": 70,
      "Stationery": 300,
      "Paneer": 160,
      "Ration": 30,
      "Travel Expense": 1475
    },
    "cashExpenses": 1475,
    "totalSale": 5480,
    "totalCash": 27103,
    "cashInHand": 25628
  },
  {
    "date": "2026-05-24",
    "openingCash": 25628,
    "kitchenSale": 0,
    "coffeeShop": 2709,
    "officialCr": 605,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 605
      }
    ],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 0,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Bread/Butter": 455,
      "Cold Drink/Cashew Nut": 2000,
      "Mineral Water": 4200,
      "Ration": 270,
      "Travel Expense": 6925
    },
    "cashExpenses": 6925,
    "totalSale": 2709,
    "totalCash": 28337,
    "cashInHand": 21412
  },
  {
    "date": "2026-05-25",
    "openingCash": 21412,
    "kitchenSale": 0,
    "coffeeShop": 6520,
    "officialCr": 1325,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1325
      }
    ],
    "personalCr": 150,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 150,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 0,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 500,
    "advanceEntries": [
      {
        "name": "Staff",
        "amount": 500
      }
    ],
    "expenseEntries": {
      "Bread/Butter": 625,
      "GAS": 1700,
      "Veg/Fruit": 40,
      "Egg/Non-veg": 120,
      "Misc/Repair": 200,
      "Travel Expense": 2685
    },
    "cashExpenses": 3185,
    "totalSale": 6520,
    "totalCash": 27932,
    "cashInHand": 24747
  },
  {
    "date": "2026-05-26",
    "openingCash": 24747,
    "kitchenSale": 0,
    "coffeeShop": 5537,
    "officialCr": 985,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 985
      }
    ],
    "personalCr": 90,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 90,
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
      "Bread/Butter": 340,
      "Cold Drink/Cashew Nut": 2000,
      "Egg/Non-veg": 190,
      "Paneer": 340,
      "Misc/Repair": 200,
      "Conveyance": 200,
      "Travel Expense": 3270
    },
    "cashExpenses": 3270,
    "totalSale": 5537,
    "totalCash": 30284,
    "cashInHand": 27014
  },
  {
    "date": "2026-05-27",
    "openingCash": 27014,
    "kitchenSale": 0,
    "coffeeShop": 4747,
    "officialCr": 1420,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1420
      }
    ],
    "personalCr": 20,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 20,
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
      "Milk/Curd": 150,
      "Bread/Butter": 455,
      "Egg/Non-veg": 120,
      "Paneer": 160,
      "Ration": 30,
      "Misc/Repair": 1380,
      "Travel Expense": 2295
    },
    "cashExpenses": 2295,
    "totalSale": 4747,
    "totalCash": 31761,
    "cashInHand": 29466
  },
  {
    "date": "2026-05-28",
    "openingCash": 29466,
    "kitchenSale": 0,
    "coffeeShop": 0,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 0,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {},
    "cashExpenses": 0,
    "totalSale": 0,
    "totalCash": 29466,
    "cashInHand": 29466
  },
  {
    "date": "2026-05-29",
    "openingCash": 29466,
    "kitchenSale": 0,
    "coffeeShop": 0,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 0,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {},
    "cashExpenses": 0,
    "totalSale": 0,
    "totalCash": 29466,
    "cashInHand": 29466
  },
  {
    "date": "2026-05-30",
    "openingCash": 29466,
    "kitchenSale": 0,
    "coffeeShop": 0,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 0,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {},
    "cashExpenses": 0,
    "totalSale": 0,
    "totalCash": 29466,
    "cashInHand": 29466
  },
  {
    "date": "2026-05-31",
    "openingCash": 29466,
    "kitchenSale": 0,
    "coffeeShop": 0,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 0,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {},
    "cashExpenses": 0,
    "totalSale": 0,
    "totalCash": 29466,
    "cashInHand": 29466
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
    console.log(`Deleted ${deletedDaybook.deletedCount} existing daybook entries for Ujala Cygnus Moradabad UP`);

    const docs = rawEntries.map(buildEntry);
    const result = await DayBook.insertMany(docs, { ordered: true });
    console.log(`Inserted ${result.length} daybook entries for Ujala Cygnus Moradabad UP`);

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
      console.log(`Inserted ${txnResult.length} partner transactions for Ujala Cygnus Moradabad UP`);
    } else {
      console.log("No partner transactions found in source data for Ujala Cygnus Moradabad UP");
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
