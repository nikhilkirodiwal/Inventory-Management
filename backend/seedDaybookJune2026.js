import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./db/dbconnection.js";
import DayBook from "./models/dayBook.js";

dotenv.config();

// ── The shop these entries belong to ──
const SHOP_ID = "6a68569a6c2ddfbfb6fc2e1e";

// Full June 2026 (1st–30th)
const entries = [
  {
    "date": "2026-06-01",
    "openingCash": 7500,
    "kitchenSale": 17200,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          { "name": "nik1", "amount": 8200 },
          { "name": "nik2", "amount": 9000 }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      { "name": "nik1", "amount": 8200 },
      { "name": "nik2", "amount": 9000 }
    ],
    "coffeeShop": 16500,
    "coffeeShopSale": 16500,
    "coffeeSubTabs": [
      { "name": "Coffee Shop", "entries": [], "directAmount": 16500 }
    ],
    "coffeeShopEntries": [],
    "officialCr": 3100,
    "officialCrEntries": [{ "name": "nik3", "amount": 3100 }],
    "personalCr": 11200,
    "personalCrEntries": [
      { "name": "raj", "amount": 6000 },
      { "name": "nik1", "amount": 5200 }
    ],
    "upiReceived": 9200,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 33700,
    "totalCash": 18000,
    "cashToOffice": 4000,
    "cashToOfficeEntries": [{ "name": "nik2", "amount": 4000 }],
    "expenseEntries": {
      "Ration": 800,
      "Paneer": 450,
      "Bread": 850,
      "Juice": 900,
      "Biscuits/Chips": 1100,
      "Room Rent": 1000,
      "LPG": 1200,
      "Salary": 700
    },
    "cashExpenses": 7000,
    "cashInHand": 14500,
    "closingCash": 14500,
    "expenses": {
      "ration": 0, "paneer": 0, "veg": 0, "bread": 0, "milk": 0,
      "roomRent": 0, "lpg": 0, "egg": 0, "hk": 0, "metro": 0,
      "misc": 0, "salary": 0, "vendor": 0, "advance": 0, "grandTotal": 0
    }
  },
  {
    "date": "2026-06-02",
    "openingCash": 14500,
    "kitchenSale": 19100,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          { "name": "nik2", "amount": 9500 },
          { "name": "amit", "amount": 9600 }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      { "name": "nik2", "amount": 9500 },
      { "name": "amit", "amount": 9600 }
    ],
    "coffeeShop": 21000,
    "coffeeShopSale": 21000,
    "coffeeSubTabs": [
      { "name": "Coffee Shop", "entries": [], "directAmount": 21000 }
    ],
    "coffeeShopEntries": [],
    "officialCr": 7500,
    "officialCrEntries": [{ "name": "nik1", "amount": 7500 }],
    "personalCr": 6200,
    "personalCrEntries": [
      { "name": "raj", "amount": 3100 },
      { "name": "amit", "amount": 3100 }
    ],
    "upiReceived": 8400,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 40100,
    "totalCash": 23400,
    "cashToOffice": 5000,
    "cashToOfficeEntries": [{ "name": "nik2", "amount": 5000 }],
    "expenseEntries": {
      "Ration": 900,
      "Bread": 1100,
      "Juice": 800,
      "Biscuits/Chips": 1200,
      "LPG": 1000,
      "Mobile/Petrol": 1100,
      "Salary": 500
    },
    "cashExpenses": 6600,
    "cashInHand": 26300,
    "closingCash": 26300,
    "expenses": {
      "ration": 0, "paneer": 0, "veg": 0, "bread": 0, "milk": 0,
      "roomRent": 0, "lpg": 0, "egg": 0, "hk": 0, "metro": 0,
      "misc": 0, "salary": 0, "vendor": 0, "advance": 0, "grandTotal": 0
    }
  },
  {
    "date": "2026-06-03",
    "openingCash": 26300,
    "kitchenSale": 22400,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          { "name": "amit", "amount": 11000 },
          { "name": "raj", "amount": 11400 }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      { "name": "amit", "amount": 11000 },
      { "name": "raj", "amount": 11400 }
    ],
    "coffeeShop": 20100,
    "coffeeShopSale": 20100,
    "coffeeSubTabs": [
      { "name": "Coffee Shop", "entries": [], "directAmount": 20100 }
    ],
    "coffeeShopEntries": [],
    "officialCr": 8200,
    "officialCrEntries": [{ "name": "nik3", "amount": 8200 }],
    "personalCr": 10500,
    "personalCrEntries": [
      { "name": "amit", "amount": 5500 },
      { "name": "raj", "amount": 5000 }
    ],
    "upiReceived": 13000,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 42500,
    "totalCash": 20800,
    "cashToOffice": 12000,
    "cashToOfficeEntries": [{ "name": "amit", "amount": 12000 }],
    "expenseEntries": {
      "Ration": 500,
      "Veg": 300,
      "Milk": 400,
      "LPG": 400,
      "Travel Exp": 500
    },
    "cashExpenses": 2100,
    "cashInHand": 33000,
    "closingCash": 33000,
    "expenses": {
      "ration": 0, "paneer": 0, "veg": 0, "bread": 0, "milk": 0,
      "roomRent": 0, "lpg": 0, "egg": 0, "hk": 0, "metro": 0,
      "misc": 0, "salary": 0, "vendor": 0, "advance": 0, "grandTotal": 0
    }
  },
  {
    "date": "2026-06-04",
    "openingCash": 33000,
    "kitchenSale": 21000,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          { "name": "nik1", "amount": 10500 },
          { "name": "nik3", "amount": 10500 }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      { "name": "nik1", "amount": 10500 },
      { "name": "nik3", "amount": 10500 }
    ],
    "coffeeShop": 19500,
    "coffeeShopSale": 19500,
    "coffeeSubTabs": [
      { "name": "Coffee Shop", "entries": [], "directAmount": 19500 }
    ],
    "coffeeShopEntries": [],
    "officialCr": 8900,
    "officialCrEntries": [{ "name": "nik2", "amount": 8900 }],
    "personalCr": 7800,
    "personalCrEntries": [
      { "name": "nik2", "amount": 3800 },
      { "name": "raj", "amount": 4000 }
    ],
    "upiReceived": 7200,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 40500,
    "totalCash": 26600,
    "cashToOffice": 15000,
    "cashToOfficeEntries": [{ "name": "amit", "amount": 15000 }],
    "expenseEntries": {
      "Veg": 1500,
      "Bread": 1200,
      "Juice": 700,
      "Biscuits/Chips": 800,
      "Mobile/Petrol": 900
    },
    "cashExpenses": 5100,
    "cashInHand": 39500,
    "closingCash": 39500,
    "expenses": {
      "ration": 0, "paneer": 0, "veg": 0, "bread": 0, "milk": 0,
      "roomRent": 0, "lpg": 0, "egg": 0, "hk": 0, "metro": 0,
      "misc": 0, "salary": 0, "vendor": 0, "advance": 0, "grandTotal": 0
    }
  },
  {
    "date": "2026-06-05",
    "openingCash": 39500,
    "kitchenSale": 24000,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          { "name": "amit", "amount": 12000 },
          { "name": "nik2", "amount": 12000 }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      { "name": "amit", "amount": 12000 },
      { "name": "nik2", "amount": 12000 }
    ],
    "coffeeShop": 18000,
    "coffeeShopSale": 18000,
    "coffeeSubTabs": [
      { "name": "Coffee Shop", "entries": [], "directAmount": 18000 }
    ],
    "coffeeShopEntries": [],
    "officialCr": 6500,
    "officialCrEntries": [{ "name": "nik1", "amount": 6500 }],
    "personalCr": 8100,
    "personalCrEntries": [
      { "name": "nik1", "amount": 4100 },
      { "name": "nik2", "amount": 4000 }
    ],
    "upiReceived": 11000,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 42000,
    "totalCash": 24400,
    "cashToOffice": 20000,
    "cashToOfficeEntries": [{ "name": "nik2", "amount": 20000 }],
    "expenseEntries": {
      "Paneer": 900,
      "Juice": 1400,
      "Milk": 800,
      "Room Rent": 800,
      "Salary": 500
    },
    "cashExpenses": 4400,
    "cashInHand": 39500,
    "closingCash": 39500,
    "expenses": {
      "ration": 0, "paneer": 0, "veg": 0, "bread": 0, "milk": 0,
      "roomRent": 0, "lpg": 0, "egg": 0, "hk": 0, "metro": 0,
      "misc": 0, "salary": 0, "vendor": 0, "advance": 0, "grandTotal": 0
    }
  },
  {
    "date": "2026-06-06",
    "openingCash": 39500,
    "kitchenSale": 21500,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          { "name": "nik2", "amount": 11500 },
          { "name": "amit", "amount": 10000 }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      { "name": "nik2", "amount": 11500 },
      { "name": "amit", "amount": 10000 }
    ],
    "coffeeShop": 25000,
    "coffeeShopSale": 25000,
    "coffeeSubTabs": [
      { "name": "Coffee Shop", "entries": [], "directAmount": 25000 }
    ],
    "coffeeShopEntries": [],
    "officialCr": 5000,
    "officialCrEntries": [{ "name": "nik2", "amount": 5000 }],
    "personalCr": 7500,
    "personalCrEntries": [
      { "name": "amit", "amount": 3500 },
      { "name": "raj", "amount": 4000 }
    ],
    "upiReceived": 10500,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 46500,
    "totalCash": 31000,
    "cashToOffice": 18000,
    "cashToOfficeEntries": [{ "name": "amit", "amount": 18000 }],
    "expenseEntries": {
      "Ration": 600,
      "Paneer": 500,
      "Veg": 700,
      "Disposable": 600,
      "Milk": 500
    },
    "cashExpenses": 2900,
    "cashInHand": 49600,
    "closingCash": 49600,
    "expenses": {
      "ration": 0, "paneer": 0, "veg": 0, "bread": 0, "milk": 0,
      "roomRent": 0, "lpg": 0, "egg": 0, "hk": 0, "metro": 0,
      "misc": 0, "salary": 0, "vendor": 0, "advance": 0, "grandTotal": 0
    }
  },
  {
    "date": "2026-06-07",
    "openingCash": 49600,
    "kitchenSale": 22000,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          { "name": "raj", "amount": 8000 },
          { "name": "nik1", "amount": 14000 }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      { "name": "raj", "amount": 8000 },
      { "name": "nik1", "amount": 14000 }
    ],
    "coffeeShop": 23000,
    "coffeeShopSale": 23000,
    "coffeeSubTabs": [
      { "name": "Coffee Shop", "entries": [], "directAmount": 23000 }
    ],
    "coffeeShopEntries": [],
    "officialCr": 9000,
    "officialCrEntries": [{ "name": "nik3", "amount": 9000 }],
    "personalCr": 11000,
    "personalCrEntries": [
      { "name": "nik2", "amount": 8000 },
      { "name": "raj", "amount": 3000 }
    ],
    "upiReceived": 4000,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 45000,
    "totalCash": 32000,
    "cashToOffice": 25000,
    "cashToOfficeEntries": [{ "name": "nik2", "amount": 25000 }],
    "expenseEntries": {
      "Ration": 400,
      "Veg": 600,
      "Juice": 900,
      "Milk": 1000,
      "LPG": 1100
    },
    "cashExpenses": 4000,
    "cashInHand": 52600,
    "closingCash": 52600,
    "expenses": {
      "ration": 0, "paneer": 0, "veg": 0, "bread": 0, "milk": 0,
      "roomRent": 0, "lpg": 0, "egg": 0, "hk": 0, "metro": 0,
      "misc": 0, "salary": 0, "vendor": 0, "advance": 0, "grandTotal": 0
    }
  },
  {
    "date": "2026-06-08",
    "openingCash": 52600,
    "kitchenSale": 20000,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          { "name": "nik2", "amount": 5000 },
          { "name": "nik3", "amount": 15000 }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      { "name": "nik2", "amount": 5000 },
      { "name": "nik3", "amount": 15000 }
    ],
    "coffeeShop": 18000,
    "coffeeShopSale": 18000,
    "coffeeSubTabs": [
      { "name": "Coffee Shop", "entries": [], "directAmount": 18000 }
    ],
    "coffeeShopEntries": [],
    "officialCr": 6000,
    "officialCrEntries": [{ "name": "raj", "amount": 6000 }],
    "personalCr": 9000,
    "personalCrEntries": [
      { "name": "nik2", "amount": 3000 },
      { "name": "nik3", "amount": 6000 }
    ],
    "upiReceived": 8000,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 38000,
    "totalCash": 27000,
    "cashToOffice": 30000,
    "cashToOfficeEntries": [{ "name": "amit", "amount": 30000 }],
    "expenseEntries": {
      "Ration": 300,
      "Veg": 1200,
      "Bread": 1000,
      "Milk": 300,
      "Mobile/Petrol": 1200
    },
    "cashExpenses": 4000,
    "cashInHand": 45600,
    "closingCash": 45600,
    "expenses": {
      "ration": 0, "paneer": 0, "veg": 0, "bread": 0, "milk": 0,
      "roomRent": 0, "lpg": 0, "egg": 0, "hk": 0, "metro": 0,
      "misc": 0, "salary": 0, "vendor": 0, "advance": 0, "grandTotal": 0
    }
  },
  {
    "date": "2026-06-09",
    "openingCash": 45600,
    "kitchenSale": 19000,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          { "name": "nik2", "amount": 9000 },
          { "name": "nik2", "amount": 10000 }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      { "name": "nik2", "amount": 9000 },
      { "name": "nik2", "amount": 10000 }
    ],
    "coffeeShop": 23000,
    "coffeeShopSale": 23000,
    "coffeeSubTabs": [
      { "name": "Coffee Shop", "entries": [], "directAmount": 23000 }
    ],
    "coffeeShopEntries": [],
    "officialCr": 10000,
    "officialCrEntries": [{ "name": "nik3", "amount": 10000 }],
    "personalCr": 10000,
    "personalCrEntries": [
      { "name": "nik2", "amount": 3000 },
      { "name": "nik3", "amount": 7000 }
    ],
    "upiReceived": 9000,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 42000,
    "totalCash": 23000,
    "cashToOffice": 25000,
    "cashToOfficeEntries": [{ "name": "nik1", "amount": 25000 }],
    "expenseEntries": {
      "Ration": 1500,
      "Paneer": 700,
      "Veg": 500,
      "Juice": 1500,
      "Milk": 1300
    },
    "cashExpenses": 5500,
    "cashInHand": 38100,
    "closingCash": 38100,
    "expenses": {
      "ration": 0, "paneer": 0, "veg": 0, "bread": 0, "milk": 0,
      "roomRent": 0, "lpg": 0, "egg": 0, "hk": 0, "metro": 0,
      "misc": 0, "salary": 0, "vendor": 0, "advance": 0, "grandTotal": 0
    }
  },
  {
    "date": "2026-06-10",
    "openingCash": 38100,
    "kitchenSale": 22000,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          { "name": "raj", "amount": 7000 },
          { "name": "nik3", "amount": 15000 }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      { "name": "raj", "amount": 7000 },
      { "name": "nik3", "amount": 15000 }
    ],
    "coffeeShop": 22000,
    "coffeeShopSale": 22000,
    "coffeeSubTabs": [
      { "name": "Coffee Shop", "entries": [], "directAmount": 22000 }
    ],
    "coffeeShopEntries": [],
    "officialCr": 7000,
    "officialCrEntries": [{ "name": "nik2", "amount": 7000 }],
    "personalCr": 8000,
    "personalCrEntries": [
      { "name": "nik2", "amount": 5000 },
      { "name": "nik2", "amount": 3000 }
    ],
    "upiReceived": 3000,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 44000,
    "totalCash": 32000,
    "cashToOffice": 20000,
    "cashToOfficeEntries": [{ "name": "nik2", "amount": 20000 }],
    "expenseEntries": {
      "Ration": 900,
      "Paneer": 600,
      "Veg": 700,
      "Bread": 400,
      "LPG": 400
    },
    "cashExpenses": 3000,
    "cashInHand": 47100,
    "closingCash": 47100,
    "expenses": {
      "ration": 0, "paneer": 0, "veg": 0, "bread": 0, "milk": 0,
      "roomRent": 0, "lpg": 0, "egg": 0, "hk": 0, "metro": 0,
      "misc": 0, "salary": 0, "vendor": 0, "advance": 0, "grandTotal": 0
    }
  },
  {
    "date": "2026-06-11",
    "openingCash": 47100,
    "kitchenSale": 18000,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          { "name": "nik3", "amount": 8000 },
          { "name": "nik2", "amount": 10000 }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      { "name": "nik3", "amount": 8000 },
      { "name": "nik2", "amount": 10000 }
    ],
    "coffeeShop": 17000,
    "coffeeShopSale": 17000,
    "coffeeSubTabs": [
      { "name": "Coffee Shop", "entries": [], "directAmount": 17000 }
    ],
    "coffeeShopEntries": [],
    "officialCr": 6000,
    "officialCrEntries": [{ "name": "amit", "amount": 6000 }],
    "personalCr": 11000,
    "personalCrEntries": [
      { "name": "raj", "amount": 5000 },
      { "name": "nik1", "amount": 6000 }
    ],
    "upiReceived": 2000,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 35000,
    "totalCash": 30000,
    "cashToOffice": 25000,
    "cashToOfficeEntries": [{ "name": "nik2", "amount": 25000 }],
    "expenseEntries": {
      "Ration": 500,
      "Paneer": 500,
      "Bread": 500,
      "Disposable": 500,
      "LPG": 600
    },
    "cashExpenses": 2600,
    "cashInHand": 49500,
    "closingCash": 49500,
    "expenses": {
      "ration": 0, "paneer": 0, "veg": 0, "bread": 0, "milk": 0,
      "roomRent": 0, "lpg": 0, "egg": 0, "hk": 0, "metro": 0,
      "misc": 0, "salary": 0, "vendor": 0, "advance": 0, "grandTotal": 0
    }
  },
  {
    "date": "2026-06-12",
    "openingCash": 49500,
    "kitchenSale": 20000,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          { "name": "nik2", "amount": 6000 },
          { "name": "nik3", "amount": 14000 }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      { "name": "nik2", "amount": 6000 },
      { "name": "nik3", "amount": 14000 }
    ],
    "coffeeShop": 17000,
    "coffeeShopSale": 17000,
    "coffeeSubTabs": [
      { "name": "Coffee Shop", "entries": [], "directAmount": 17000 }
    ],
    "coffeeShopEntries": [],
    "officialCr": 10000,
    "officialCrEntries": [{ "name": "nik1", "amount": 10000 }],
    "personalCr": 5000,
    "personalCrEntries": [
      { "name": "nik2", "amount": 4000 },
      { "name": "amit", "amount": 1000 }
    ],
    "upiReceived": 4000,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 37000,
    "totalCash": 32000,
    "cashToOffice": 30000,
    "cashToOfficeEntries": [{ "name": "raj", "amount": 30000 }],
    "expenseEntries": {
      "Paneer": 100,
      "Veg": 100,
      "Bread": 300,
      "Juice": 100,
      "Milk": 300
    },
    "cashExpenses": 900,
    "cashInHand": 50600,
    "closingCash": 50600,
    "expenses": {
      "ration": 0, "paneer": 0, "veg": 0, "bread": 0, "milk": 0,
      "roomRent": 0, "lpg": 0, "egg": 0, "hk": 0, "metro": 0,
      "misc": 0, "salary": 0, "vendor": 0, "advance": 0, "grandTotal": 0
    }
  },
  {
    "date": "2026-06-13",
    "openingCash": 50600,
    "kitchenSale": 20000,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          { "name": "nik2", "amount": 6000 },
          { "name": "nik3", "amount": 14000 }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      { "name": "nik2", "amount": 6000 },
      { "name": "nik3", "amount": 14000 }
    ],
    "coffeeShop": 19000,
    "coffeeShopSale": 19000,
    "coffeeSubTabs": [
      { "name": "Coffee Shop", "entries": [], "directAmount": 19000 }
    ],
    "coffeeShopEntries": [],
    "officialCr": 11000,
    "officialCrEntries": [{ "name": "nik1", "amount": 11000 }],
    "personalCr": 6000,
    "personalCrEntries": [
      { "name": "nik3", "amount": 5000 },
      { "name": "amit", "amount": 1000 }
    ],
    "upiReceived": 4000,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 39000,
    "totalCash": 32000,
    "cashToOffice": 20000,
    "cashToOfficeEntries": [{ "name": "nik2", "amount": 20000 }],
    "expenseEntries": {
      "Ration": 2000,
      "Paneer": 1200,
      "Veg": 2200,
      "Disposable": 2500,
      "LPG": 500
    },
    "cashExpenses": 8400,
    "cashInHand": 54200,
    "closingCash": 54200,
    "expenses": {
      "ration": 0, "paneer": 0, "veg": 0, "bread": 0, "milk": 0,
      "roomRent": 0, "lpg": 0, "egg": 0, "hk": 0, "metro": 0,
      "misc": 0, "salary": 0, "vendor": 0, "advance": 0, "grandTotal": 0
    }
  },
  {
    "date": "2026-06-14",
    "openingCash": 54200,
    "kitchenSale": 16000,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          { "name": "nik1", "amount": 11000 },
          { "name": "raj", "amount": 5000 }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      { "name": "nik1", "amount": 11000 },
      { "name": "raj", "amount": 5000 }
    ],
    "coffeeShop": 15000,
    "coffeeShopSale": 15000,
    "coffeeSubTabs": [
      { "name": "Coffee Shop", "entries": [], "directAmount": 15000 }
    ],
    "coffeeShopEntries": [],
    "officialCr": 3000,
    "officialCrEntries": [{ "name": "amit", "amount": 3000 }],
    "personalCr": 6000,
    "personalCrEntries": [
      { "name": "nik2", "amount": 4000 },
      { "name": "nik2", "amount": 2000 }
    ],
    "upiReceived": 11000,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 31000,
    "totalCash": 22000,
    "cashToOffice": 20000,
    "cashToOfficeEntries": [{ "name": "nik2", "amount": 20000 }],
    "expenseEntries": {
      "Ration": 400,
      "Veg": 1300,
      "Milk": 1000,
      "LPG": 1000
    },
    "cashExpenses": 3700,
    "cashInHand": 52500,
    "closingCash": 52500,
    "expenses": {
      "ration": 0, "paneer": 0, "veg": 0, "bread": 0, "milk": 0,
      "roomRent": 0, "lpg": 0, "egg": 0, "hk": 0, "metro": 0,
      "misc": 0, "salary": 0, "vendor": 0, "advance": 0, "grandTotal": 0
    }
  },
  {
    "date": "2026-06-15",
    "openingCash": 52500,
    "kitchenSale": 22000,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          { "name": "nik3", "amount": 7000 },
          { "name": "amit", "amount": 15000 }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      { "name": "nik3", "amount": 7000 },
      { "name": "amit", "amount": 15000 }
    ],
    "coffeeShop": 19000,
    "coffeeShopSale": 19000,
    "coffeeSubTabs": [
      { "name": "Coffee Shop", "entries": [], "directAmount": 19000 }
    ],
    "coffeeShopEntries": [],
    "officialCr": 10000,
    "officialCrEntries": [{ "name": "amit", "amount": 10000 }],
    "personalCr": 7000,
    "personalCrEntries": [
      { "name": "nik2", "amount": 5000 },
      { "name": "nik3", "amount": 2000 }
    ],
    "upiReceived": 10000,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 41000,
    "totalCash": 21000,
    "cashToOffice": 15000,
    "cashToOfficeEntries": [{ "name": "amit", "amount": 15000 }],
    "expenseEntries": {
      "Ration": 300,
      "Paneer": 900,
      "Veg": 500,
      "Bread": 300,
      "Juice": 300,
      "Salary": 800
    },
    "cashExpenses": 3100,
    "cashInHand": 55400,
    "closingCash": 55400,
    "expenses": {
      "ration": 0, "paneer": 0, "veg": 0, "bread": 0, "milk": 0,
      "roomRent": 0, "lpg": 0, "egg": 0, "hk": 0, "metro": 0,
      "misc": 0, "salary": 0, "vendor": 0, "advance": 0, "grandTotal": 0
    }
  },
  {
    "date": "2026-06-16",
    "openingCash": 55400,
    "kitchenSale": 17000,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          { "name": "nik1", "amount": 7000 },
          { "name": "nik2", "amount": 10000 }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      { "name": "nik1", "amount": 7000 },
      { "name": "nik2", "amount": 10000 }
    ],
    "coffeeShop": 25000,
    "coffeeShopSale": 25000,
    "coffeeSubTabs": [
      { "name": "Coffee Shop", "entries": [], "directAmount": 25000 }
    ],
    "coffeeShopEntries": [],
    "officialCr": 6000,
    "officialCrEntries": [{ "name": "amit", "amount": 6000 }],
    "personalCr": 7000,
    "personalCrEntries": [
      { "name": "nik1", "amount": 2000 },
      { "name": "amit", "amount": 5000 }
    ],
    "upiReceived": 9000,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 42000,
    "totalCash": 30000,
    "cashToOffice": 20000,
    "cashToOfficeEntries": [{ "name": "raj", "amount": 20000 }],
    "expenseEntries": {
      "Ration": 700,
      "Veg": 800,
      "Bread": 1800,
      "Milk": 800,
      "Salary": 1700
    },
    "cashExpenses": 5800,
    "cashInHand": 59600,
    "closingCash": 59600,
    "expenses": {
      "ration": 0, "paneer": 0, "veg": 0, "bread": 0, "milk": 0,
      "roomRent": 0, "lpg": 0, "egg": 0, "hk": 0, "metro": 0,
      "misc": 0, "salary": 0, "vendor": 0, "advance": 0, "grandTotal": 0
    }
  },
  {
    "date": "2026-06-17",
    "openingCash": 59600,
    "kitchenSale": 21000,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          { "name": "nik2", "amount": 6000 },
          { "name": "nik1", "amount": 15000 }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      { "name": "nik2", "amount": 6000 },
      { "name": "nik1", "amount": 15000 }
    ],
    "coffeeShop": 15000,
    "coffeeShopSale": 15000,
    "coffeeSubTabs": [
      { "name": "Coffee Shop", "entries": [], "directAmount": 15000 }
    ],
    "coffeeShopEntries": [],
    "officialCr": 5000,
    "officialCrEntries": [{ "name": "nik3", "amount": 5000 }],
    "personalCr": 13000,
    "personalCrEntries": [
      { "name": "raj", "amount": 8000 },
      { "name": "raj", "amount": 5000 }
    ],
    "upiReceived": 8000,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 36000,
    "totalCash": 23000,
    "cashToOffice": 20000,
    "cashToOfficeEntries": [{ "name": "raj", "amount": 20000 }],
    "expenseEntries": {
      "Ration": 200,
      "Paneer": 500,
      "Veg": 700,
      "Bread": 300,
      "Juice": 400
    },
    "cashExpenses": 2100,
    "cashInHand": 60500,
    "closingCash": 60500,
    "expenses": {
      "ration": 0, "paneer": 0, "veg": 0, "bread": 0, "milk": 0,
      "roomRent": 0, "lpg": 0, "egg": 0, "hk": 0, "metro": 0,
      "misc": 0, "salary": 0, "vendor": 0, "advance": 0, "grandTotal": 0
    }
  },
  {
    "date": "2026-06-18",
    "openingCash": 60500,
    "kitchenSale": 18000,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          { "name": "nik1", "amount": 7000 },
          { "name": "amit", "amount": 11000 }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      { "name": "nik1", "amount": 7000 },
      { "name": "amit", "amount": 11000 }
    ],
    "coffeeShop": 16000,
    "coffeeShopSale": 16000,
    "coffeeSubTabs": [
      { "name": "Coffee Shop", "entries": [], "directAmount": 16000 }
    ],
    "coffeeShopEntries": [],
    "officialCr": 6000,
    "officialCrEntries": [{ "name": "nik2", "amount": 6000 }],
    "personalCr": 7000,
    "personalCrEntries": [
      { "name": "raj", "amount": 4000 },
      { "name": "amit", "amount": 3000 }
    ],
    "upiReceived": 7000,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 34000,
    "totalCash": 25000,
    "cashToOffice": 25000,
    "cashToOfficeEntries": [{ "name": "nik2", "amount": 25000 }],
    "expenseEntries": {
      "Ration": 100,
      "Juice": 200,
      "Biscuits/Chips": 400,
      "Milk": 200,
      "Salary": 300
    },
    "cashExpenses": 1200,
    "cashInHand": 59300,
    "closingCash": 59300,
    "expenses": {
      "ration": 0, "paneer": 0, "veg": 0, "bread": 0, "milk": 0,
      "roomRent": 0, "lpg": 0, "egg": 0, "hk": 0, "metro": 0,
      "misc": 0, "salary": 0, "vendor": 0, "advance": 0, "grandTotal": 0
    }
  },
  {
    "date": "2026-06-19",
    "openingCash": 59300,
    "kitchenSale": 15000,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          { "name": "amit", "amount": 7000 },
          { "name": "amit", "amount": 8000 }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      { "name": "amit", "amount": 7000 },
      { "name": "amit", "amount": 8000 }
    ],
    "coffeeShop": 23000,
    "coffeeShopSale": 23000,
    "coffeeSubTabs": [
      { "name": "Coffee Shop", "entries": [], "directAmount": 23000 }
    ],
    "coffeeShopEntries": [],
    "officialCr": 11000,
    "officialCrEntries": [{ "name": "nik3", "amount": 11000 }],
    "personalCr": 11000,
    "personalCrEntries": [
      { "name": "nik1", "amount": 7000 },
      { "name": "nik2", "amount": 4000 }
    ],
    "upiReceived": 8000,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 38000,
    "totalCash": 24000,
    "cashToOffice": 30000,
    "cashToOfficeEntries": [{ "name": "nik1", "amount": 30000 }],
    "expenseEntries": {
      "Veg": 100,
      "Juice": 500,
      "LPG": 600,
      "Mobile/Petrol": 200
    },
    "cashExpenses": 1400,
    "cashInHand": 51900,
    "closingCash": 51900,
    "expenses": {
      "ration": 0, "paneer": 0, "veg": 0, "bread": 0, "milk": 0,
      "roomRent": 0, "lpg": 0, "egg": 0, "hk": 0, "metro": 0,
      "misc": 0, "salary": 0, "vendor": 0, "advance": 0, "grandTotal": 0
    }
  },
  {
    "date": "2026-06-20",
    "openingCash": 51900,
    "kitchenSale": 21000,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          { "name": "nik2", "amount": 10000 },
          { "name": "nik1", "amount": 11000 }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      { "name": "nik2", "amount": 10000 },
      { "name": "nik1", "amount": 11000 }
    ],
    "coffeeShop": 16000,
    "coffeeShopSale": 16000,
    "coffeeSubTabs": [
      { "name": "Coffee Shop", "entries": [], "directAmount": 16000 }
    ],
    "coffeeShopEntries": [],
    "officialCr": 8000,
    "officialCrEntries": [{ "name": "amit", "amount": 8000 }],
    "personalCr": 6000,
    "personalCrEntries": [
      { "name": "nik1", "amount": 1000 },
      { "name": "nik3", "amount": 5000 }
    ],
    "upiReceived": 5000,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 37000,
    "totalCash": 32000,
    "cashToOffice": 20000,
    "cashToOfficeEntries": [{ "name": "nik3", "amount": 20000 }],
    "expenseEntries": {
      "Paneer": 2000,
      "Veg": 1800,
      "Milk": 1100,
      "LPG": 2000,
      "Salary": 1400
    },
    "cashExpenses": 8300,
    "cashInHand": 55600,
    "closingCash": 55600,
    "expenses": {
      "ration": 0, "paneer": 0, "veg": 0, "bread": 0, "milk": 0,
      "roomRent": 0, "lpg": 0, "egg": 0, "hk": 0, "metro": 0,
      "misc": 0, "salary": 0, "vendor": 0, "advance": 0, "grandTotal": 0
    }
  },
  {
    "date": "2026-06-21",
    "openingCash": 55600,
    "kitchenSale": 21000,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          { "name": "nik1", "amount": 12000 },
          { "name": "amit", "amount": 9000 }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      { "name": "nik1", "amount": 12000 },
      { "name": "amit", "amount": 9000 }
    ],
    "coffeeShop": 21000,
    "coffeeShopSale": 21000,
    "coffeeSubTabs": [
      { "name": "Coffee Shop", "entries": [], "directAmount": 21000 }
    ],
    "coffeeShopEntries": [],
    "officialCr": 6000,
    "officialCrEntries": [{ "name": "raj", "amount": 6000 }],
    "personalCr": 3000,
    "personalCrEntries": [
      { "name": "amit", "amount": 1000 },
      { "name": "nik3", "amount": 2000 }
    ],
    "upiReceived": 9000,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 42000,
    "totalCash": 39000,
    "cashToOffice": 30000,
    "cashToOfficeEntries": [{ "name": "nik1", "amount": 30000 }],
    "expenseEntries": {
      "Paneer": 200,
      "Bread": 400,
      "Biscuits/Chips": 900,
      "Milk": 500,
      "LPG": 700
    },
    "cashExpenses": 2700,
    "cashInHand": 61900,
    "closingCash": 61900,
    "expenses": {
      "ration": 0, "paneer": 0, "veg": 0, "bread": 0, "milk": 0,
      "roomRent": 0, "lpg": 0, "egg": 0, "hk": 0, "metro": 0,
      "misc": 0, "salary": 0, "vendor": 0, "advance": 0, "grandTotal": 0
    }
  },
  {
    "date": "2026-06-22",
    "openingCash": 61900,
    "kitchenSale": 15000,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          { "name": "nik1", "amount": 3000 },
          { "name": "nik3", "amount": 12000 }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      { "name": "nik1", "amount": 3000 },
      { "name": "nik3", "amount": 12000 }
    ],
    "coffeeShop": 22000,
    "coffeeShopSale": 22000,
    "coffeeSubTabs": [
      { "name": "Coffee Shop", "entries": [], "directAmount": 22000 }
    ],
    "coffeeShopEntries": [],
    "officialCr": 8000,
    "officialCrEntries": [{ "name": "nik1", "amount": 8000 }],
    "personalCr": 9000,
    "personalCrEntries": [
      { "name": "amit", "amount": 5000 },
      { "name": "nik1", "amount": 4000 }
    ],
    "upiReceived": 7000,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 37000,
    "totalCash": 34000,
    "cashToOffice": 35000,
    "cashToOfficeEntries": [{ "name": "nik3", "amount": 35000 }],
    "expenseEntries": {
      "Paneer": 600,
      "Veg": 700,
      "Biscuits/Chips": 500,
      "Milk": 300,
      "Mobile/Petrol": 600
    },
    "cashExpenses": 2700,
    "cashInHand": 58200,
    "closingCash": 58200,
    "expenses": {
      "ration": 0, "paneer": 0, "veg": 0, "bread": 0, "milk": 0,
      "roomRent": 0, "lpg": 0, "egg": 0, "hk": 0, "metro": 0,
      "misc": 0, "salary": 0, "vendor": 0, "advance": 0, "grandTotal": 0
    }
  },
  {
    "date": "2026-06-23",
    "openingCash": 58200,
    "kitchenSale": 20000,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          { "name": "raj", "amount": 12000 },
          { "name": "raj", "amount": 8000 }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      { "name": "raj", "amount": 12000 },
      { "name": "raj", "amount": 8000 }
    ],
    "coffeeShop": 16000,
    "coffeeShopSale": 16000,
    "coffeeSubTabs": [
      { "name": "Coffee Shop", "entries": [], "directAmount": 16000 }
    ],
    "coffeeShopEntries": [],
    "officialCr": 9000,
    "officialCrEntries": [{ "name": "nik3", "amount": 9000 }],
    "personalCr": 7000,
    "personalCrEntries": [
      { "name": "amit", "amount": 5000 },
      { "name": "nik2", "amount": 2000 }
    ],
    "upiReceived": 7000,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 36000,
    "totalCash": 29000,
    "cashToOffice": 25000,
    "cashToOfficeEntries": [{ "name": "raj", "amount": 25000 }],
    "expenseEntries": {
      "Veg": 1500,
      "Bread": 2000,
      "Juice": 700,
      "Biscuits/Chips": 1000,
      "Salary": 2000
    },
    "cashExpenses": 7200,
    "cashInHand": 55000,
    "closingCash": 55000,
    "expenses": {
      "ration": 0, "paneer": 0, "veg": 0, "bread": 0, "milk": 0,
      "roomRent": 0, "lpg": 0, "egg": 0, "hk": 0, "metro": 0,
      "misc": 0, "salary": 0, "vendor": 0, "advance": 0, "grandTotal": 0
    }
  },
  {
    "date": "2026-06-24",
    "openingCash": 55000,
    "kitchenSale": 22000,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          { "name": "nik3", "amount": 14000 },
          { "name": "nik1", "amount": 8000 }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      { "name": "nik3", "amount": 14000 },
      { "name": "nik1", "amount": 8000 }
    ],
    "coffeeShop": 23000,
    "coffeeShopSale": 23000,
    "coffeeSubTabs": [
      { "name": "Coffee Shop", "entries": [], "directAmount": 23000 }
    ],
    "coffeeShopEntries": [],
    "officialCr": 11000,
    "officialCrEntries": [{ "name": "nik3", "amount": 11000 }],
    "personalCr": 3000,
    "personalCrEntries": [
      { "name": "raj", "amount": 1000 },
      { "name": "nik2", "amount": 2000 }
    ],
    "upiReceived": 14000,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 45000,
    "totalCash": 31000,
    "cashToOffice": 25000,
    "cashToOfficeEntries": [{ "name": "raj", "amount": 25000 }],
    "expenseEntries": {
      "Paneer": 1000,
      "Veg": 2500,
      "Milk": 1200,
      "Salary": 2500
    },
    "cashExpenses": 7200,
    "cashInHand": 53800,
    "closingCash": 53800,
    "expenses": {
      "ration": 0, "paneer": 0, "veg": 0, "bread": 0, "milk": 0,
      "roomRent": 0, "lpg": 0, "egg": 0, "hk": 0, "metro": 0,
      "misc": 0, "salary": 0, "vendor": 0, "advance": 0, "grandTotal": 0
    }
  },
  {
    "date": "2026-06-25",
    "openingCash": 53800,
    "kitchenSale": 15000,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          { "name": "raj", "amount": 3000 },
          { "name": "nik1", "amount": 12000 }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      { "name": "raj", "amount": 3000 },
      { "name": "nik1", "amount": 12000 }
    ],
    "coffeeShop": 21000,
    "coffeeShopSale": 21000,
    "coffeeSubTabs": [
      { "name": "Coffee Shop", "entries": [], "directAmount": 21000 }
    ],
    "coffeeShopEntries": [],
    "officialCr": 3000,
    "officialCrEntries": [{ "name": "nik3", "amount": 3000 }],
    "personalCr": 10000,
    "personalCrEntries": [
      { "name": "raj", "amount": 5000 },
      { "name": "amit", "amount": 5000 }
    ],
    "upiReceived": 4000,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 36000,
    "totalCash": 29000,
    "cashToOffice": 20000,
    "cashToOfficeEntries": [{ "name": "nik3", "amount": 20000 }],
    "expenseEntries": {
      "Paneer": 700,
      "Juice": 1500,
      "Biscuits/Chips": 1500,
      "Milk": 400,
      "Salary": 800
    },
    "cashExpenses": 4900,
    "cashInHand": 57900,
    "closingCash": 57900,
    "expenses": {
      "ration": 0, "paneer": 0, "veg": 0, "bread": 0, "milk": 0,
      "roomRent": 0, "lpg": 0, "egg": 0, "hk": 0, "metro": 0,
      "misc": 0, "salary": 0, "vendor": 0, "advance": 0, "grandTotal": 0
    }
  },
  {
    "date": "2026-06-26",
    "openingCash": 57900,
    "kitchenSale": 21000,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          { "name": "amit", "amount": 11000 },
          { "name": "nik2", "amount": 10000 }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      { "name": "amit", "amount": 11000 },
      { "name": "nik2", "amount": 10000 }
    ],
    "coffeeShop": 21000,
    "coffeeShopSale": 21000,
    "coffeeSubTabs": [
      { "name": "Coffee Shop", "entries": [], "directAmount": 21000 }
    ],
    "coffeeShopEntries": [],
    "officialCr": 13000,
    "officialCrEntries": [{ "name": "nik3", "amount": 13000 }],
    "personalCr": 7000,
    "personalCrEntries": [
      { "name": "nik3", "amount": 4000 },
      { "name": "nik3", "amount": 3000 }
    ],
    "upiReceived": 4000,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 42000,
    "totalCash": 31000,
    "cashToOffice": 30000,
    "cashToOfficeEntries": [{ "name": "nik3", "amount": 30000 }],
    "expenseEntries": {
      "Ration": 2000,
      "Paneer": 2000,
      "Room Rent": 1500,
      "LPG": 1500,
      "Salary": 500
    },
    "cashExpenses": 7500,
    "cashInHand": 51400,
    "closingCash": 51400,
    "expenses": {
      "ration": 0, "paneer": 0, "veg": 0, "bread": 0, "milk": 0,
      "roomRent": 0, "lpg": 0, "egg": 0, "hk": 0, "metro": 0,
      "misc": 0, "salary": 0, "vendor": 0, "advance": 0, "grandTotal": 0
    }
  },
  {
    "date": "2026-06-27",
    "openingCash": 51400,
    "kitchenSale": 15000,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          { "name": "amit", "amount": 6000 },
          { "name": "nik2", "amount": 9000 }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      { "name": "amit", "amount": 6000 },
      { "name": "nik2", "amount": 9000 }
    ],
    "coffeeShop": 18000,
    "coffeeShopSale": 18000,
    "coffeeSubTabs": [
      { "name": "Coffee Shop", "entries": [], "directAmount": 18000 }
    ],
    "coffeeShopEntries": [],
    "officialCr": 8000,
    "officialCrEntries": [{ "name": "amit", "amount": 8000 }],
    "personalCr": 5000,
    "personalCrEntries": [
      { "name": "nik2", "amount": 2000 },
      { "name": "nik2", "amount": 3000 }
    ],
    "upiReceived": 2000,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 33000,
    "totalCash": 26000,
    "cashToOffice": 20000,
    "cashToOfficeEntries": [{ "name": "nik1", "amount": 20000 }],
    "expenseEntries": {
      "Ration": 1000,
      "Paneer": 300,
      "Veg": 1400,
      "Bread": 600,
      "Juice": 500,
      "Salary": 1000
    },
    "cashExpenses": 4800,
    "cashInHand": 52600,
    "closingCash": 52600,
    "expenses": {
      "ration": 0, "paneer": 0, "veg": 0, "bread": 0, "milk": 0,
      "roomRent": 0, "lpg": 0, "egg": 0, "hk": 0, "metro": 0,
      "misc": 0, "salary": 0, "vendor": 0, "advance": 0, "grandTotal": 0
    }
  },
  {
    "date": "2026-06-28",
    "openingCash": 52600,
    "kitchenSale": 16000,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          { "name": "raj", "amount": 8000 },
          { "name": "amit", "amount": 8000 }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      { "name": "raj", "amount": 8000 },
      { "name": "amit", "amount": 8000 }
    ],
    "coffeeShop": 24000,
    "coffeeShopSale": 24000,
    "coffeeSubTabs": [
      { "name": "Coffee Shop", "entries": [], "directAmount": 24000 }
    ],
    "coffeeShopEntries": [],
    "officialCr": 2000,
    "officialCrEntries": [{ "name": "amit", "amount": 2000 }],
    "personalCr": 10000,
    "personalCrEntries": [
      { "name": "nik2", "amount": 7000 },
      { "name": "nik1", "amount": 3000 }
    ],
    "upiReceived": 5000,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 40000,
    "totalCash": 35000,
    "cashToOffice": 30000,
    "cashToOfficeEntries": [{ "name": "amit", "amount": 30000 }],
    "expenseEntries": {
      "Paneer": 700,
      "Juice": 600,
      "Biscuits/Chips": 500,
      "Milk": 600,
      "LPG": 200
    },
    "cashExpenses": 2600,
    "cashInHand": 55000,
    "closingCash": 55000,
    "expenses": {
      "ration": 0, "paneer": 0, "veg": 0, "bread": 0, "milk": 0,
      "roomRent": 0, "lpg": 0, "egg": 0, "hk": 0, "metro": 0,
      "misc": 0, "salary": 0, "vendor": 0, "advance": 0, "grandTotal": 0
    }
  },
  {
    "date": "2026-06-29",
    "openingCash": 55000,
    "kitchenSale": 18000,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          { "name": "nik1", "amount": 9000 },
          { "name": "nik2", "amount": 9000 }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      { "name": "nik1", "amount": 9000 },
      { "name": "nik2", "amount": 9000 }
    ],
    "coffeeShop": 20000,
    "coffeeShopSale": 20000,
    "coffeeSubTabs": [
      { "name": "Coffee Shop", "entries": [], "directAmount": 20000 }
    ],
    "coffeeShopEntries": [],
    "officialCr": 4000,
    "officialCrEntries": [{ "name": "nik3", "amount": 4000 }],
    "personalCr": 8000,
    "personalCrEntries": [
      { "name": "raj", "amount": 4000 },
      { "name": "amit", "amount": 4000 }
    ],
    "upiReceived": 6000,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 38000,
    "totalCash": 32000,
    "cashToOffice": 35000,
    "cashToOfficeEntries": [{ "name": "nik2", "amount": 35000 }],
    "expenseEntries": {
      "Ration": 800,
      "Veg": 1000,
      "Juice": 600,
      "Milk": 600
    },
    "cashExpenses": 3000,
    "cashInHand": 49000,
    "closingCash": 49000,
    "expenses": {
      "ration": 0, "paneer": 0, "veg": 0, "bread": 0, "milk": 0,
      "roomRent": 0, "lpg": 0, "egg": 0, "hk": 0, "metro": 0,
      "misc": 0, "salary": 0, "vendor": 0, "advance": 0, "grandTotal": 0
    }
  },
  {
    "date": "2026-06-30",
    "openingCash": 49000,
    "kitchenSale": 20000,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          { "name": "nik2", "amount": 10000 },
          { "name": "nik3", "amount": 10000 }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      { "name": "nik2", "amount": 10000 },
      { "name": "nik3", "amount": 10000 }
    ],
    "coffeeShop": 22000,
    "coffeeShopSale": 22000,
    "coffeeSubTabs": [
      { "name": "Coffee Shop", "entries": [], "directAmount": 22000 }
    ],
    "coffeeShopEntries": [],
    "officialCr": 5000,
    "officialCrEntries": [{ "name": "nik1", "amount": 5000 }],
    "personalCr": 6000,
    "personalCrEntries": [
      { "name": "nik1", "amount": 3000 },
      { "name": "nik2", "amount": 3000 }
    ],
    "upiReceived": 8000,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 42000,
    "totalCash": 34000,
    "cashToOffice": 40000,
    "cashToOfficeEntries": [{ "name": "nik2", "amount": 40000 }],
    "expenseEntries": {
      "Ration": 1000,
      "Paneer": 1000,
      "Veg": 1000,
      "LPG": 1000,
      "Salary": 1000
    },
    "cashExpenses": 5000,
    "cashInHand": 38000,
    "closingCash": 38000,
    "expenses": {
      "ration": 0, "paneer": 0, "veg": 0, "bread": 0, "milk": 0,
      "roomRent": 0, "lpg": 0, "egg": 0, "hk": 0, "metro": 0,
      "misc": 0, "salary": 0, "vendor": 0, "advance": 0, "grandTotal": 0
    }
  }
];

const MONTH_START = new Date("2026-06-01T00:00:00.000Z");
const MONTH_END = new Date("2026-07-01T00:00:00.000Z");

const run = async () => {
  await connectDB();

  try {
    // ── Step 1: drop existing June daybook entries for this shop ──
    const deleted = await DayBook.deleteMany({
      shop: SHOP_ID,
      date: { $gte: MONTH_START, $lt: MONTH_END },
    });
    console.log(`🗑️  Deleted ${deleted.deletedCount} existing June entries for shop ${SHOP_ID}`);

    // ── Step 2: insert the fresh month dataset ──
    const docs = entries.map((e) => ({ ...e, shop: SHOP_ID }));
    const result = await DayBook.insertMany(docs, { ordered: true });

    const first = result[0];
    const last = result[result.length - 1];
    const lossDays = result.filter((d) => d.cashInHand < d.openingCash).length;
    console.log(`✅ Inserted ${result.length} daybook entries for shop ${SHOP_ID}`);
    console.log(`   Opening cash on ${first.date.toDateString()}: ₹${first.openingCash}`);
    console.log(`   Closing cash on ${last.date.toDateString()}: ₹${last.cashInHand}`);
    console.log(`   Loss days: ${lossDays}/${result.length}`);
    console.log(`   Net profit across the month: ₹${last.cashInHand - first.openingCash}`);
  } catch (err) {
    console.error("❌ Reseed failed:", err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

run();