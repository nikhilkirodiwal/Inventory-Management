import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./db/dbconnection.js";
import DayBook from "./models/dayBook.js";
import Partner from "./models/partner.js";
import PartnerTransaction from "./models/partnerTransaction.js";

dotenv.config();

/* ═══════════════════════════════════════════════════════════════════════
   Seed: Sehgal Nursing Home
   Source: sehgal.xlsx (real historical bookkeeping data)
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

const SHOP_ID = "6a82d96c1a779efb71774210";
const RANGE_START = new Date("2026-05-01T00:00:00.000Z");
const RANGE_END = new Date("2026-06-01T00:00:00.000Z");

const rawEntries = [
  {
    "date": "2026-05-01",
    "openingCash": 21438,
    "kitchenSale": 1208,
    "coffeeShop": 11250,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 1279,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1279,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 9000,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 145,
    "advanceEntries": [
      {
        "name": "Staff",
        "amount": 145
      }
    ],
    "expenseEntries": {
      "Milk/Curd": 120,
      "Paneer": 295,
      "Veg/Fruit": 190,
      "Sweet/Icecream": 260,
      "Snacks/Polka": 283,
      "Bread/Butter": 4055,
      "Non-veg/Egg": 200,
      "Ration/Mineral Water": 90,
      "Travel Expense": 5493
    },
    "cashExpenses": 14638,
    "totalSale": 15742,
    "totalCash": 37180,
    "cashInHand": 22542
  },
  {
    "date": "2026-05-02",
    "openingCash": 22542,
    "kitchenSale": 1475,
    "coffeeShop": 10075,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 1460,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1460,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 7530,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 464,
      "Veg/Fruit": 180,
      "Sweet/Icecream": 127,
      "Snacks/Polka": 340,
      "Bread/Butter": 1770,
      "Non-veg/Egg": 200,
      "Ration/Mineral Water": 338,
      "Disposable": 40,
      "Conveyance/Mobile Exp": 20,
      "Travel Expense": 3479
    },
    "cashExpenses": 11009,
    "totalSale": 13127,
    "totalCash": 35669,
    "cashInHand": 24660
  },
  {
    "date": "2026-05-03",
    "openingCash": 24660,
    "kitchenSale": 880,
    "coffeeShop": 9428,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 534,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 534,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 7130,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Veg/Fruit": 180,
      "Bread/Butter": 1456,
      "Cold Drink/Cashew Nut": 100,
      "Ration/Mineral Water": 120,
      "Conveyance/Mobile Exp": 210,
      "Travel Expense": 2066
    },
    "cashExpenses": 9196,
    "totalSale": 11433,
    "totalCash": 36093,
    "cashInHand": 26897
  },
  {
    "date": "2026-05-04",
    "openingCash": 26897,
    "kitchenSale": 1428,
    "coffeeShop": 11092,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 522,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 522,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 8101,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 20000,
    "advanceEntries": [
      {
        "name": "Staff",
        "amount": 20000
      }
    ],
    "expenseEntries": {
      "Milk/Curd": 350,
      "Veg/Fruit": 380,
      "Snacks/Polka": 705,
      "Bread/Butter": 1020,
      "Misc/Repair": 1000,
      "Conveyance/Mobile Exp": 1020,
      "Travel Expense": 4475
    },
    "cashExpenses": 32576,
    "totalSale": 15542,
    "totalCash": 42439,
    "cashInHand": 9863
  },
  {
    "date": "2026-05-05",
    "openingCash": 9863,
    "kitchenSale": 1209,
    "coffeeShop": 11503,
    "officialCr": 959,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 959
      }
    ],
    "personalCr": 283,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 283,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 9077,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Veg/Fruit": 130,
      "Snacks/Polka": 340,
      "Bread/Butter": 1285,
      "Non-veg/Egg": 190,
      "Crockery/Utensil": 130,
      "Misc/Repair": 100,
      "Travel Expense": 2175
    },
    "cashExpenses": 11252,
    "totalSale": 15382,
    "totalCash": 25245,
    "cashInHand": 13993
  },
  {
    "date": "2026-05-06",
    "openingCash": 13993,
    "kitchenSale": 1449,
    "coffeeShop": 9483,
    "officialCr": 420,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 420
      }
    ],
    "personalCr": 1427,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1427,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 6618,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Veg/Fruit": 198,
      "Snacks/Polka": 340,
      "Bread/Butter": 1385,
      "Ration/Mineral Water": 297,
      "Crockery/Utensil": 4000,
      "Misc/Repair": 300,
      "Conveyance/Mobile Exp": 113,
      "Travel Expense": 6633
    },
    "cashExpenses": 13251,
    "totalSale": 13989,
    "totalCash": 27982,
    "cashInHand": 14731
  },
  {
    "date": "2026-05-07",
    "openingCash": 14731,
    "kitchenSale": 1125,
    "coffeeShop": 10941,
    "officialCr": 784,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 784
      }
    ],
    "personalCr": 8964,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1360,
        "creditedAmount": 0
      },
      {
        "name": "Canteen Credit Collected",
        "amount": 7604,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 18180,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Paneer": 104,
      "Veg/Fruit": 110,
      "Bread/Butter": 1290,
      "Cold Drink/Cashew Nut": 85,
      "Crockery/Utensil": 130,
      "Travel Expense": 1719
    },
    "cashExpenses": 19899,
    "totalSale": 22007,
    "totalCash": 36738,
    "cashInHand": 16839
  },
  {
    "date": "2026-05-08",
    "openingCash": 16839,
    "kitchenSale": 1590,
    "coffeeShop": 9704,
    "officialCr": 698,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 698
      }
    ],
    "personalCr": 4838,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 4124,
        "creditedAmount": 0
      },
      {
        "name": "Canteen Credit Collected",
        "amount": 714,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 9579,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Veg/Fruit": 110,
      "Snacks/Polka": 705,
      "Bread/Butter": 1390,
      "Non-veg/Egg": 200,
      "Chips/Biscuit": 70,
      "Stationery": 70,
      "Travel Expense": 2545
    },
    "cashExpenses": 12124,
    "totalSale": 15494,
    "totalCash": 32333,
    "cashInHand": 20209
  },
  {
    "date": "2026-05-09",
    "openingCash": 20209,
    "kitchenSale": 1435,
    "coffeeShop": 12845,
    "officialCr": 250,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 250
      }
    ],
    "personalCr": 1165,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1165,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 9517,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 146,
      "Paneer": 260,
      "Veg/Fruit": 270,
      "Sweet/Icecream": 250,
      "Snacks/Polka": 460,
      "Bread/Butter": 1385,
      "Ration/Mineral Water": 330,
      "Conveyance/Mobile Exp": 20,
      "Travel Expense": 3121
    },
    "cashExpenses": 12638,
    "totalSale": 18103,
    "totalCash": 38312,
    "cashInHand": 25674
  },
  {
    "date": "2026-05-10",
    "openingCash": 25674,
    "kitchenSale": 1301,
    "coffeeShop": 7233,
    "officialCr": 100,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 100
      }
    ],
    "personalCr": 1799,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 400,
        "creditedAmount": 0
      },
      {
        "name": "Canteen Credit Collected",
        "amount": 1399,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 8069,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 174,
      "Veg/Fruit": 110,
      "Bread/Butter": 1285,
      "Ration/Mineral Water": 510,
      "Disposable": 240,
      "Travel Expense": 2319
    },
    "cashExpenses": 10388,
    "totalSale": 10745,
    "totalCash": 36419,
    "cashInHand": 26031
  },
  {
    "date": "2026-05-11",
    "openingCash": 26031,
    "kitchenSale": 1518,
    "coffeeShop": 11005,
    "officialCr": 260,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 260
      }
    ],
    "personalCr": 4392,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1036,
        "creditedAmount": 0
      },
      {
        "name": "Canteen Credit Collected",
        "amount": 3356,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 12582,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 80,
      "Veg/Fruit": 220,
      "Snacks/Polka": 705,
      "Bread/Butter": 1170,
      "Non-veg/Egg": 200,
      "Misc/Repair": 1000,
      "Conveyance/Mobile Exp": 500,
      "Travel Expense": 3875
    },
    "cashExpenses": 16457,
    "totalSale": 19174,
    "totalCash": 45205,
    "cashInHand": 28748
  },
  {
    "date": "2026-05-12",
    "openingCash": 28748,
    "kitchenSale": 1035,
    "coffeeShop": 13026,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 2021,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1381,
        "creditedAmount": 0
      },
      {
        "name": "Canteen Credit Collected",
        "amount": 640,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 10763,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 22000,
    "advanceEntries": [
      {
        "name": "Staff",
        "amount": 22000
      }
    ],
    "expenseEntries": {
      "Veg/Fruit": 390,
      "Sweet/Icecream": 70,
      "Snacks/Polka": 340,
      "Bread/Butter": 1285,
      "Ration/Mineral Water": 135,
      "Conveyance/Mobile Exp": 1500,
      "Travel Expense": 3720
    },
    "cashExpenses": 36483,
    "totalSale": 17291,
    "totalCash": 46039,
    "cashInHand": 9556
  },
  {
    "date": "2026-05-13",
    "openingCash": 9556,
    "kitchenSale": 1534,
    "coffeeShop": 10596,
    "officialCr": 250,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 250
      }
    ],
    "personalCr": 32108,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 759,
        "creditedAmount": 0
      },
      {
        "name": "Canteen Credit Collected",
        "amount": 31349,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 44497,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Veg/Fruit": 465,
      "Sweet/Icecream": 590,
      "Snacks/Polka": 743,
      "Bread/Butter": 1060,
      "Ration/Mineral Water": 90,
      "Travel Expense": 2948
    },
    "cashExpenses": 47445,
    "totalSale": 47134,
    "totalCash": 56690,
    "cashInHand": 9245
  },
  {
    "date": "2026-05-14",
    "openingCash": 9245,
    "kitchenSale": 1064,
    "coffeeShop": 11138,
    "officialCr": 1092,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1092
      }
    ],
    "personalCr": 9375,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1183,
        "creditedAmount": 0
      },
      {
        "name": "Canteen Credit Collected",
        "amount": 8192,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 12130,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 4000,
    "advanceEntries": [
      {
        "name": "Staff",
        "amount": 4000
      }
    ],
    "expenseEntries": {
      "Veg/Fruit": 110,
      "Snacks/Polka": 705,
      "Bread/Butter": 1900,
      "Ration/Mineral Water": 245,
      "Disposable": 900,
      "Travel Expense": 3860
    },
    "cashExpenses": 19990,
    "totalSale": 24186,
    "totalCash": 33431,
    "cashInHand": 13441
  },
  {
    "date": "2026-05-15",
    "openingCash": 13441,
    "kitchenSale": 1651,
    "coffeeShop": 13154,
    "officialCr": 56,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 56
      }
    ],
    "personalCr": 10127,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1295,
        "creditedAmount": 0
      },
      {
        "name": "Canteen Credit Collected",
        "amount": 8832,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 17308,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 550,
      "Veg/Fruit": 1495,
      "Bread/Butter": 340,
      "Non-veg/Egg": 190,
      "Ration/Mineral Water": 600,
      "Travel Expense": 3175
    },
    "cashExpenses": 20483,
    "totalSale": 27067,
    "totalCash": 40508,
    "cashInHand": 20025
  },
  {
    "date": "2026-05-16",
    "openingCash": 20025,
    "kitchenSale": 1770,
    "coffeeShop": 11676,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 1645,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1645,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 14378,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Veg/Fruit": 110,
      "Snacks/Polka": 705,
      "Bread/Butter": 1060,
      "Cold Drink/Cashew Nut": 4000,
      "Travel Expense": 5875
    },
    "cashExpenses": 20253,
    "totalSale": 17960,
    "totalCash": 37985,
    "cashInHand": 17732
  },
  {
    "date": "2026-05-17",
    "openingCash": 17732,
    "kitchenSale": 737,
    "coffeeShop": 8206,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 520,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 520,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 5690,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Veg/Fruit": 110,
      "Bread/Butter": 1625,
      "Non-veg/Egg": 190,
      "Travel Expense": 1925
    },
    "cashExpenses": 7615,
    "totalSale": 9888,
    "totalCash": 27620,
    "cashInHand": 20005
  },
  {
    "date": "2026-05-18",
    "openingCash": 20005,
    "kitchenSale": 1365,
    "coffeeShop": 12767,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 1365,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1365,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 8380,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 12000,
    "advanceEntries": [
      {
        "name": "Staff",
        "amount": 12000
      }
    ],
    "expenseEntries": {
      "Milk/Curd": 80,
      "Paneer": 520,
      "Veg/Fruit": 2322,
      "Sweet/Icecream": 710,
      "Snacks/Polka": 705,
      "Bread/Butter": 1185,
      "Ration/Mineral Water": 100,
      "Conveyance/Mobile Exp": 206,
      "Travel Expense": 5828
    },
    "cashExpenses": 26208,
    "totalSale": 17239,
    "totalCash": 37244,
    "cashInHand": 11036
  },
  {
    "date": "2026-05-19",
    "openingCash": 11036,
    "kitchenSale": 1897,
    "coffeeShop": 11691,
    "officialCr": 40,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 40
      }
    ],
    "personalCr": 1302,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1302,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 8806,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Veg/Fruit": 105,
      "Snacks/Polka": 705,
      "Bread/Butter": 1290,
      "LPG/Fuel": 570,
      "Stationery": 20,
      "Travel Expense": 2690
    },
    "cashExpenses": 11496,
    "totalSale": 17804,
    "totalCash": 28840,
    "cashInHand": 17344
  },
  {
    "date": "2026-05-20",
    "openingCash": 17344,
    "kitchenSale": 1277,
    "coffeeShop": 13213,
    "officialCr": 750,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 750
      }
    ],
    "personalCr": 17578,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1040,
        "creditedAmount": 0
      },
      {
        "name": "Canteen Credit Collected",
        "amount": 16538,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 28221,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 150,
      "Veg/Fruit": 990,
      "Sweet/Icecream": 550,
      "Snacks/Polka": 340,
      "Bread/Butter": 1620,
      "Ration/Mineral Water": 370,
      "Conveyance/Mobile Exp": 60,
      "Travel Expense": 4080
    },
    "cashExpenses": 32301,
    "totalSale": 35577,
    "totalCash": 52921,
    "cashInHand": 20620
  },
  {
    "date": "2026-05-21",
    "openingCash": 20620,
    "kitchenSale": 1820,
    "coffeeShop": 13392,
    "officialCr": 1740,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1740
      }
    ],
    "personalCr": 14271,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1246,
        "creditedAmount": 0
      },
      {
        "name": "Canteen Credit Collected",
        "amount": 13025,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 21571,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Veg/Fruit": 740,
      "Sweet/Icecream": 360,
      "Bread/Butter": 1546,
      "Overtime": 1230,
      "Ration/Mineral Water": 271,
      "Travel Expense": 4147
    },
    "cashExpenses": 25718,
    "totalSale": 31376,
    "totalCash": 51996,
    "cashInHand": 26278
  },
  {
    "date": "2026-05-22",
    "openingCash": 26278,
    "kitchenSale": 1415,
    "coffeeShop": 11355,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 1250,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1250,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 10061,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 15000,
    "advanceEntries": [
      {
        "name": "Staff",
        "amount": 15000
      }
    ],
    "expenseEntries": {
      "Milk/Curd": 221,
      "Veg/Fruit": 768,
      "Bread/Butter": 1610,
      "Non-veg/Egg": 190,
      "Travel Expense": 2789
    },
    "cashExpenses": 27850,
    "totalSale": 17629,
    "totalCash": 43907,
    "cashInHand": 16057
  },
  {
    "date": "2026-05-23",
    "openingCash": 16057,
    "kitchenSale": 1868,
    "coffeeShop": 12459,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 1454,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1454,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 10925,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 4700,
    "advanceEntries": [
      {
        "name": "Staff",
        "amount": 4700
      }
    ],
    "expenseEntries": {
      "Veg/Fruit": 120,
      "Snacks/Polka": 705,
      "Bread/Butter": 1380,
      "Ration/Mineral Water": 206,
      "Crockery/Utensil": 1000,
      "Travel Expense": 3411
    },
    "cashExpenses": 19036,
    "totalSale": 17764,
    "totalCash": 33821,
    "cashInHand": 14785
  },
  {
    "date": "2026-05-24",
    "openingCash": 14815,
    "kitchenSale": 735,
    "coffeeShop": 8400,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 1470,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1470,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 5419,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 68,
      "Paneer": 255,
      "Veg/Fruit": 120,
      "Bread/Butter": 1675,
      "Cold Drink/Cashew Nut": 600,
      "Ration/Mineral Water": 110,
      "Crockery/Utensil": 1000,
      "Conveyance/Mobile Exp": 20,
      "Travel Expense": 3848
    },
    "cashExpenses": 9267,
    "totalSale": 10919,
    "totalCash": 25734,
    "cashInHand": 16467
  },
  {
    "date": "2026-05-25",
    "openingCash": 16467,
    "kitchenSale": 1890,
    "coffeeShop": 10854,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 974,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 974,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 9598,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 10000,
    "advanceEntries": [
      {
        "name": "Staff",
        "amount": 10000
      }
    ],
    "expenseEntries": {
      "Milk/Curd": 300,
      "Veg/Fruit": 160,
      "Snacks/Polka": 705,
      "Bread/Butter": 1630,
      "Conveyance/Mobile Exp": 20,
      "Travel Expense": 2815
    },
    "cashExpenses": 22413,
    "totalSale": 15871,
    "totalCash": 32338,
    "cashInHand": 9925
  },
  {
    "date": "2026-05-26",
    "openingCash": 9925,
    "kitchenSale": 1243,
    "coffeeShop": 15444,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 4520,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1070,
        "creditedAmount": 0
      },
      {
        "name": "Canteen Credit Collected",
        "amount": 3450,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 11036,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Milk/Curd": 460,
      "Veg/Fruit": 673,
      "Sweet/Icecream": 827,
      "Snacks/Polka": 360,
      "Bread/Butter": 1455,
      "Ration/Mineral Water": 140,
      "Conveyance/Mobile Exp": 40,
      "Travel Expense": 3955
    },
    "cashExpenses": 14991,
    "totalSale": 24149,
    "totalCash": 34074,
    "cashInHand": 19083
  },
  {
    "date": "2026-05-27",
    "openingCash": 19083,
    "kitchenSale": 1631,
    "coffeeShop": 13742,
    "officialCr": 500,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 500
      }
    ],
    "personalCr": 2679,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1479,
        "creditedAmount": 0
      },
      {
        "name": "Canteen Credit Collected",
        "amount": 1200,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 9237,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 0,
    "advanceEntries": [],
    "expenseEntries": {
      "Veg/Fruit": 120,
      "Snacks/Polka": 648,
      "Bread/Butter": 1290,
      "Cold Drink/Cashew Nut": 4000,
      "Non-veg/Egg": 200,
      "Ration/Mineral Water": 300,
      "Crockery/Utensil": 2200,
      "Travel Expense": 8758
    },
    "cashExpenses": 17995,
    "totalSale": 19935,
    "totalCash": 39018,
    "cashInHand": 21023
  },
  {
    "date": "2026-05-28",
    "openingCash": 21023,
    "kitchenSale": 1728,
    "coffeeShop": 12944,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 1511,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1511,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 9165,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 5100,
    "advanceEntries": [
      {
        "name": "Staff",
        "amount": 5100
      }
    ],
    "expenseEntries": {
      "Veg/Fruit": 280,
      "Snacks/Polka": 541,
      "Bread/Butter": 1675,
      "Non-veg/Egg": 170,
      "Conveyance/Mobile Exp": 100,
      "Travel Expense": 2766
    },
    "cashExpenses": 17031,
    "totalSale": 18014,
    "totalCash": 39037,
    "cashInHand": 22006
  },
  {
    "date": "2026-05-29",
    "openingCash": 22006,
    "kitchenSale": 1315,
    "coffeeShop": 11476,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 1313,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 1313,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 6384,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 6500,
    "advanceEntries": [
      {
        "name": "Staff",
        "amount": 6500
      }
    ],
    "expenseEntries": {
      "Milk/Curd": 288,
      "Paneer": 255,
      "Veg/Fruit": 120,
      "Bread/Butter": 1210,
      "Conveyance/Mobile Exp": 20,
      "Travel Expense": 1893
    },
    "cashExpenses": 14777,
    "totalSale": 16518,
    "totalCash": 38524,
    "cashInHand": 23747
  },
  {
    "date": "2026-05-30",
    "openingCash": 23943,
    "kitchenSale": 1578,
    "coffeeShop": 12267,
    "officialCr": 0,
    "officialCrEntries": [],
    "personalCr": 0,
    "personalCrEntries": [],
    "upiReceived": 8378,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 567,
    "advanceEntries": [
      {
        "name": "Staff",
        "amount": 567
      }
    ],
    "expenseEntries": {
      "Paneer": 380,
      "Veg/Fruit": 120,
      "Snacks/Polka": 705,
      "Bread/Butter": 1430,
      "Travel Expense": 2635
    },
    "cashExpenses": 11580,
    "totalSale": 18274,
    "totalCash": 42217,
    "cashInHand": 30637
  },
  {
    "date": "2026-05-31",
    "openingCash": 30637,
    "kitchenSale": 832,
    "coffeeShop": 9302,
    "officialCr": 2826,
    "officialCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 2826
      }
    ],
    "personalCr": 690,
    "personalCrEntries": [
      {
        "name": "Kitchen Credit",
        "amount": 690,
        "creditedAmount": 0
      }
    ],
    "upiReceived": 6944,
    "cashToOffice": 0,
    "salary": 0,
    "salaryEntries": [],
    "advance": 2500,
    "advanceEntries": [
      {
        "name": "Staff",
        "amount": 2500
      }
    ],
    "expenseEntries": {
      "Paneer": 255,
      "Veg/Fruit": 80,
      "Bread/Butter": 1540,
      "Non-veg/Egg": 190,
      "Conveyance/Mobile Exp": 20,
      "Travel Expense": 2085
    },
    "cashExpenses": 11529,
    "totalSale": 11601,
    "totalCash": 42238,
    "cashInHand": 30709
  }
];

const partnerTxnsByName = {
  "S K Pahuja": [
    {
      "date": "2026-05-12",
      "type": "transfer",
      "amount": 22000,
      "note": "Cash given to partner (daybook)"
    },
    {
      "date": "2026-05-14",
      "type": "transfer",
      "amount": 4000,
      "note": "Cash given to partner (daybook)"
    },
    {
      "date": "2026-05-18",
      "type": "transfer",
      "amount": 12000,
      "note": "Cash given to partner (daybook)"
    },
    {
      "date": "2026-05-22",
      "type": "transfer",
      "amount": 15000,
      "note": "Cash given to partner (daybook)"
    }
  ],
  "Shishir Arora": [
    {
      "date": "2026-05-25",
      "type": "transfer",
      "amount": 10000,
      "note": "Cash given to partner (daybook)"
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
    console.log(`Deleted ${deletedDaybook.deletedCount} existing daybook entries for Sehgal Nursing Home`);

    const docs = rawEntries.map(buildEntry);
    const result = await DayBook.insertMany(docs, { ordered: true });
    console.log(`Inserted ${result.length} daybook entries for Sehgal Nursing Home`);

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
      console.log(`Inserted ${txnResult.length} partner transactions for Sehgal Nursing Home`);
    } else {
      console.log("No partner transactions found in source data for Sehgal Nursing Home");
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
