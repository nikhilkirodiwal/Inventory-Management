import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./db/dbconnection.js";
import DayBook from "./models/dayBook.js";

dotenv.config();

// ── The shop these entries belong to — replace with your real shop's _id ──
const SHOP_ID = "6a68569a6c2ddfbfb6fc2e1e";

// Full July 2026 (1st–28th) — a realistic mix of up and down days.
// Some days lose money (higher expenses/credits than sales), some days
// profit, but the month as a whole closes modestly ahead.
const entries = 
[
  {
    "date": "2026-07-01",
    "openingCash": 8000,
    "kitchenSale": 16370,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          {
            "name": "nik2",
            "amount": 8406
          },
          {
            "name": "nik2",
            "amount": 7964
          }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      {
        "name": "nik2",
        "amount": 8406
      },
      {
        "name": "nik2",
        "amount": 7964
      }
    ],
    "coffeeShop": 17773,
    "coffeeShopSale": 17773,
    "coffeeSubTabs": [
      {
        "name": "Coffee Shop",
        "entries": [],
        "directAmount": 17773
      }
    ],
    "coffeeShopEntries": [],
    "officialCr": 2735,
    "officialCrEntries": [
      {
        "name": "nik3",
        "amount": 2735
      }
    ],
    "personalCr": 13159,
    "personalCrEntries": [
      {
        "name": "raj",
        "amount": 7088
      },
      {
        "name": "nik1",
        "amount": 6071
      }
    ],
    "upiReceived": 8561,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 34143,
    "totalCash": 17688,
    "cashToOffice": 3075,
    "cashToOfficeEntries": [
      {
        "name": "nik2",
        "amount": 3075
      }
    ],
    "expenseEntries": {
      "Ration": 708,
      "Paneer": 399,
      "Bread": 948,
      "Juice": 992,
      "Biscuits/Chips": 1042,
      "Sweets/Snacks": 1019,
      "Room Rent": 972,
      "LPG": 1327,
      "Mobile/Petrol": 1150,
      "Travel Exp": 825,
      "Salary": 645
    },
    "cashExpenses": 10027,
    "cashInHand": 4586,
    "closingCash": 4586,
    "expenses": {
      "ration": 0,
      "paneer": 0,
      "veg": 0,
      "bread": 0,
      "milk": 0,
      "roomRent": 0,
      "lpg": 0,
      "egg": 0,
      "hk": 0,
      "metro": 0,
      "misc": 0,
      "salary": 0,
      "vendor": 0,
      "advance": 0,
      "grandTotal": 0
    }
  },
  {
    "date": "2026-07-02",
    "openingCash": 4586,
    "kitchenSale": 18565,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          {
            "name": "nik1",
            "amount": 5236
          },
          {
            "name": "nik3",
            "amount": 13329
          }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      {
        "name": "nik1",
        "amount": 5236
      },
      {
        "name": "nik3",
        "amount": 13329
      }
    ],
    "coffeeShop": 23261,
    "coffeeShopSale": 23261,
    "coffeeSubTabs": [
      {
        "name": "Coffee Shop",
        "entries": [],
        "directAmount": 23261
      }
    ],
    "coffeeShopEntries": [],
    "officialCr": 8991,
    "officialCrEntries": [
      {
        "name": "nik1",
        "amount": 8991
      }
    ],
    "personalCr": 5480,
    "personalCrEntries": [
      {
        "name": "amit",
        "amount": 2719
      },
      {
        "name": "raj",
        "amount": 2761
      }
    ],
    "upiReceived": 7713,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 41826,
    "totalCash": 24228,
    "cashToOffice": 2302,
    "cashToOfficeEntries": [
      {
        "name": "nik2",
        "amount": 2302
      }
    ],
    "expenseEntries": {
      "Ration": 952,
      "Bread": 1250,
      "Juice": 860,
      "Disposable": 279,
      "Biscuits/Chips": 1460,
      "Room Rent": 1111,
      "LPG": 1035,
      "Egg": 454,
      "Mobile/Petrol": 1151,
      "Travel Exp": 1368,
      "Salary": 310
    },
    "cashExpenses": 10230,
    "cashInHand": 11696,
    "closingCash": 11696,
    "expenses": {
      "ration": 0,
      "paneer": 0,
      "veg": 0,
      "bread": 0,
      "milk": 0,
      "roomRent": 0,
      "lpg": 0,
      "egg": 0,
      "hk": 0,
      "metro": 0,
      "misc": 0,
      "salary": 0,
      "vendor": 0,
      "advance": 0,
      "grandTotal": 0
    }
  },
  {
    "date": "2026-07-03",
    "openingCash": 11696,
    "kitchenSale": 25697,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          {
            "name": "amit",
            "amount": 10335
          },
          {
            "name": "raj",
            "amount": 15362
          }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      {
        "name": "amit",
        "amount": 10335
      },
      {
        "name": "raj",
        "amount": 15362
      }
    ],
    "coffeeShop": 22459,
    "coffeeShopSale": 22459,
    "coffeeSubTabs": [
      {
        "name": "Coffee Shop",
        "entries": [],
        "directAmount": 22459
      }
    ],
    "coffeeShopEntries": [],
    "officialCr": 9545,
    "officialCrEntries": [
      {
        "name": "nik3",
        "amount": 9545
      }
    ],
    "personalCr": 12384,
    "personalCrEntries": [
      {
        "name": "amit",
        "amount": 6980
      },
      {
        "name": "raj",
        "amount": 5404
      }
    ],
    "upiReceived": 15322,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 48156,
    "totalCash": 22601,
    "cashToOffice": 10932,
    "cashToOfficeEntries": [
      {
        "name": "amit",
        "amount": 10932
      }
    ],
    "expenseEntries": {
      "Ration": 434,
      "Paneer": 145,
      "Veg": 244,
      "Juice": 227,
      "Disposable": 326,
      "Biscuits/Chips": 301,
      "Milk": 384,
      "LPG": 335,
      "Mobile/Petrol": 439,
      "Travel Exp": 350,
      "Salary": 159
    },
    "cashExpenses": 3344,
    "cashInHand": 8325,
    "closingCash": 8325,
    "expenses": {
      "ration": 0,
      "paneer": 0,
      "veg": 0,
      "bread": 0,
      "milk": 0,
      "roomRent": 0,
      "lpg": 0,
      "egg": 0,
      "hk": 0,
      "metro": 0,
      "misc": 0,
      "salary": 0,
      "vendor": 0,
      "advance": 0,
      "grandTotal": 0
    }
  },
  {
    "date": "2026-07-04",
    "openingCash": 8325,
    "kitchenSale": 23599,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          {
            "name": "amit",
            "amount": 17059
          },
          {
            "name": "nik1",
            "amount": 6540
          }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      {
        "name": "amit",
        "amount": 17059
      },
      {
        "name": "nik1",
        "amount": 6540
      }
    ],
    "coffeeShop": 22954,
    "coffeeShopSale": 22954,
    "coffeeSubTabs": [
      {
        "name": "Coffee Shop",
        "entries": [],
        "directAmount": 22954
      }
    ],
    "coffeeShopEntries": [],
    "officialCr": 9895,
    "officialCrEntries": [
      {
        "name": "nik2",
        "amount": 9895
      }
    ],
    "personalCr": 9115,
    "personalCrEntries": [
      {
        "name": "nik2",
        "amount": 3567
      },
      {
        "name": "raj",
        "amount": 5548
      }
    ],
    "upiReceived": 6483,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 46553,
    "totalCash": 29385,
    "cashToOffice": 6724,
    "cashToOfficeEntries": [
      {
        "name": "amit",
        "amount": 6724
      }
    ],
    "expenseEntries": {
      "Veg": 1780,
      "Bread": 1487,
      "Juice": 839,
      "Disposable": 1455,
      "Biscuits/Chips": 747,
      "Sweets/Snacks": 1112,
      "Room Rent": 1816,
      "Egg": 868,
      "Mobile/Petrol": 973
    },
    "cashExpenses": 11077,
    "cashInHand": 11584,
    "closingCash": 11584,
    "expenses": {
      "ration": 0,
      "paneer": 0,
      "veg": 0,
      "bread": 0,
      "milk": 0,
      "roomRent": 0,
      "lpg": 0,
      "egg": 0,
      "hk": 0,
      "metro": 0,
      "misc": 0,
      "salary": 0,
      "vendor": 0,
      "advance": 0,
      "grandTotal": 0
    }
  },
  {
    "date": "2026-07-05",
    "openingCash": 11584,
    "kitchenSale": 22938,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          {
            "name": "amit",
            "amount": 12984
          },
          {
            "name": "nik2",
            "amount": 9954
          }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      {
        "name": "amit",
        "amount": 12984
      },
      {
        "name": "nik2",
        "amount": 9954
      }
    ],
    "coffeeShop": 16397,
    "coffeeShopSale": 16397,
    "coffeeSubTabs": [
      {
        "name": "Coffee Shop",
        "entries": [],
        "directAmount": 16397
      }
    ],
    "coffeeShopEntries": [],
    "officialCr": 7246,
    "officialCrEntries": [
      {
        "name": "nik1",
        "amount": 7246
      }
    ],
    "personalCr": 7993,
    "personalCrEntries": [
      {
        "name": "nik1",
        "amount": 4391
      },
      {
        "name": "nik1",
        "amount": 3602
      }
    ],
    "upiReceived": 10287,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 39335,
    "totalCash": 25393,
    "cashToOffice": 9181,
    "cashToOfficeEntries": [
      {
        "name": "nik2",
        "amount": 9181
      }
    ],
    "expenseEntries": {
      "Paneer": 872,
      "Juice": 1586,
      "Milk": 885,
      "Room Rent": 776,
      "LPG": 1722,
      "Travel Exp": 297,
      "Salary": 457
    },
    "cashExpenses": 6595,
    "cashInHand": 9617,
    "closingCash": 9617,
    "expenses": {
      "ration": 0,
      "paneer": 0,
      "veg": 0,
      "bread": 0,
      "milk": 0,
      "roomRent": 0,
      "lpg": 0,
      "egg": 0,
      "hk": 0,
      "metro": 0,
      "misc": 0,
      "salary": 0,
      "vendor": 0,
      "advance": 0,
      "grandTotal": 0
    }
  },
  {
    "date": "2026-07-06",
    "openingCash": 9617,
    "kitchenSale": 23386,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          {
            "name": "nik2",
            "amount": 13855
          },
          {
            "name": "amit",
            "amount": 9531
          }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      {
        "name": "nik2",
        "amount": 13855
      },
      {
        "name": "amit",
        "amount": 9531
      }
    ],
    "coffeeShop": 27306,
    "coffeeShopSale": 27306,
    "coffeeSubTabs": [
      {
        "name": "Coffee Shop",
        "entries": [],
        "directAmount": 27306
      }
    ],
    "coffeeShopEntries": [],
    "officialCr": 5792,
    "officialCrEntries": [
      {
        "name": "nik2",
        "amount": 5792
      }
    ],
    "personalCr": 8450,
    "personalCrEntries": [
      {
        "name": "amit",
        "amount": 2834
      },
      {
        "name": "amit",
        "amount": 5616
      }
    ],
    "upiReceived": 11876,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 50692,
    "totalCash": 34191,
    "cashToOffice": 11916,
    "cashToOfficeEntries": [
      {
        "name": "amit",
        "amount": 11916
      }
    ],
    "expenseEntries": {
      "Ration": 526,
      "Paneer": 561,
      "Veg": 605,
      "Juice": 590,
      "Disposable": 610,
      "Biscuits/Chips": 471,
      "Sweets/Snacks": 350,
      "Milk": 510,
      "Room Rent": 144,
      "LPG": 282,
      "Egg": 516,
      "Mobile/Petrol": 557,
      "Travel Exp": 346
    },
    "cashExpenses": 6068,
    "cashInHand": 16207,
    "closingCash": 16207,
    "expenses": {
      "ration": 0,
      "paneer": 0,
      "veg": 0,
      "bread": 0,
      "milk": 0,
      "roomRent": 0,
      "lpg": 0,
      "egg": 0,
      "hk": 0,
      "metro": 0,
      "misc": 0,
      "salary": 0,
      "vendor": 0,
      "advance": 0,
      "grandTotal": 0
    }
  },
  {
    "date": "2026-07-07",
    "openingCash": 16207,
    "kitchenSale": 23670,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          {
            "name": "raj",
            "amount": 8295
          },
          {
            "name": "nik1",
            "amount": 15375
          }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      {
        "name": "raj",
        "amount": 8295
      },
      {
        "name": "nik1",
        "amount": 15375
      }
    ],
    "coffeeShop": 25002,
    "coffeeShopSale": 25002,
    "coffeeSubTabs": [
      {
        "name": "Coffee Shop",
        "entries": [],
        "directAmount": 25002
      }
    ],
    "coffeeShopEntries": [],
    "officialCr": 10839,
    "officialCrEntries": [
      {
        "name": "nik3",
        "amount": 10839
      }
    ],
    "personalCr": 12622,
    "personalCrEntries": [
      {
        "name": "nik2",
        "amount": 9457
      },
      {
        "name": "raj",
        "amount": 3165
      }
    ],
    "upiReceived": 2817,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 48672,
    "totalCash": 38601,
    "cashToOffice": 9120,
    "cashToOfficeEntries": [
      {
        "name": "nik2",
        "amount": 9120
      }
    ],
    "expenseEntries": {
      "Ration": 339,
      "Veg": 529,
      "Juice": 996,
      "Disposable": 1014,
      "Biscuits/Chips": 1155,
      "Sweets/Snacks": 1309,
      "Milk": 1071,
      "Room Rent": 1285,
      "LPG": 1244,
      "Mobile/Petrol": 547,
      "Travel Exp": 865
    },
    "cashExpenses": 10354,
    "cashInHand": 19127,
    "closingCash": 19127,
    "expenses": {
      "ration": 0,
      "paneer": 0,
      "veg": 0,
      "bread": 0,
      "milk": 0,
      "roomRent": 0,
      "lpg": 0,
      "egg": 0,
      "hk": 0,
      "metro": 0,
      "misc": 0,
      "salary": 0,
      "vendor": 0,
      "advance": 0,
      "grandTotal": 0
    }
  },
  {
    "date": "2026-07-08",
    "openingCash": 19127,
    "kitchenSale": 21695,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          {
            "name": "nik2",
            "amount": 5194
          },
          {
            "name": "nik3",
            "amount": 16501
          }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      {
        "name": "nik2",
        "amount": 5194
      },
      {
        "name": "nik3",
        "amount": 16501
      }
    ],
    "coffeeShop": 19934,
    "coffeeShopSale": 19934,
    "coffeeSubTabs": [
      {
        "name": "Coffee Shop",
        "entries": [],
        "directAmount": 19934
      }
    ],
    "coffeeShopEntries": [],
    "officialCr": 7307,
    "officialCrEntries": [
      {
        "name": "raj",
        "amount": 7307
      }
    ],
    "personalCr": 10194,
    "personalCrEntries": [
      {
        "name": "nik2",
        "amount": 3415
      },
      {
        "name": "nik3",
        "amount": 6779
      }
    ],
    "upiReceived": 9371,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 41629,
    "totalCash": 33884,
    "cashToOffice": 9055,
    "cashToOfficeEntries": [
      {
        "name": "amit",
        "amount": 9055
      }
    ],
    "expenseEntries": {
      "Ration": 334,
      "Veg": 1355,
      "Bread": 1176,
      "Disposable": 848,
      "Biscuits/Chips": 588,
      "Sweets/Snacks": 812,
      "Milk": 323,
      "Egg": 698,
      "Mobile/Petrol": 1551,
      "Travel Exp": 931
    },
    "cashExpenses": 8616,
    "cashInHand": 16213,
    "closingCash": 16213,
    "expenses": {
      "ration": 0,
      "paneer": 0,
      "veg": 0,
      "bread": 0,
      "milk": 0,
      "roomRent": 0,
      "lpg": 0,
      "egg": 0,
      "hk": 0,
      "metro": 0,
      "misc": 0,
      "salary": 0,
      "vendor": 0,
      "advance": 0,
      "grandTotal": 0
    }
  },
  {
    "date": "2026-07-09",
    "openingCash": 16213,
    "kitchenSale": 20699,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          {
            "name": "nik2",
            "amount": 9720
          },
          {
            "name": "nik2",
            "amount": 10979
          }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      {
        "name": "nik2",
        "amount": 9720
      },
      {
        "name": "nik2",
        "amount": 10979
      }
    ],
    "coffeeShop": 25161,
    "coffeeShopSale": 25161,
    "coffeeSubTabs": [
      {
        "name": "Coffee Shop",
        "entries": [],
        "directAmount": 25161
      }
    ],
    "coffeeShopEntries": [],
    "officialCr": 11446,
    "officialCrEntries": [
      {
        "name": "nik3",
        "amount": 11446
      }
    ],
    "personalCr": 11047,
    "personalCrEntries": [
      {
        "name": "nik2",
        "amount": 3685
      },
      {
        "name": "nik3",
        "amount": 7362
      }
    ],
    "upiReceived": 10312,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 45860,
    "totalCash": 29268,
    "cashToOffice": 8912,
    "cashToOfficeEntries": [
      {
        "name": "nik1",
        "amount": 8912
      }
    ],
    "expenseEntries": {
      "Ration": 1671,
      "Paneer": 810,
      "Veg": 609,
      "Juice": 1815,
      "Biscuits/Chips": 653,
      "Sweets/Snacks": 1142,
      "Milk": 1521,
      "Room Rent": 517,
      "LPG": 908
    },
    "cashExpenses": 9646,
    "cashInHand": 10710,
    "closingCash": 10710,
    "expenses": {
      "ration": 0,
      "paneer": 0,
      "veg": 0,
      "bread": 0,
      "milk": 0,
      "roomRent": 0,
      "lpg": 0,
      "egg": 0,
      "hk": 0,
      "metro": 0,
      "misc": 0,
      "salary": 0,
      "vendor": 0,
      "advance": 0,
      "grandTotal": 0
    }
  },
  {
    "date": "2026-07-10",
    "openingCash": 10710,
    "kitchenSale": 24099,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          {
            "name": "raj",
            "amount": 7581
          },
          {
            "name": "nik3",
            "amount": 16518
          }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      {
        "name": "raj",
        "amount": 7581
      },
      {
        "name": "nik3",
        "amount": 16518
      }
    ],
    "coffeeShop": 24003,
    "coffeeShopSale": 24003,
    "coffeeSubTabs": [
      {
        "name": "Coffee Shop",
        "entries": [],
        "directAmount": 24003
      }
    ],
    "coffeeShopEntries": [],
    "officialCr": 8244,
    "officialCrEntries": [
      {
        "name": "nik2",
        "amount": 8244
      }
    ],
    "personalCr": 9164,
    "personalCrEntries": [
      {
        "name": "nik2",
        "amount": 5785
      },
      {
        "name": "nik2",
        "amount": 3379
      }
    ],
    "upiReceived": 4379,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 48102,
    "totalCash": 37025,
    "cashToOffice": 10097,
    "cashToOfficeEntries": [
      {
        "name": "nik2",
        "amount": 10097
      }
    ],
    "expenseEntries": {
      "Ration": 1045,
      "Paneer": 693,
      "Veg": 764,
      "Bread": 499,
      "Disposable": 219,
      "Biscuits/Chips": 703,
      "Sweets/Snacks": 1067,
      "LPG": 493,
      "Mobile/Petrol": 561,
      "Travel Exp": 1044,
      "Salary": 953
    },
    "cashExpenses": 8041,
    "cashInHand": 18887,
    "closingCash": 18887,
    "expenses": {
      "ration": 0,
      "paneer": 0,
      "veg": 0,
      "bread": 0,
      "milk": 0,
      "roomRent": 0,
      "lpg": 0,
      "egg": 0,
      "hk": 0,
      "metro": 0,
      "misc": 0,
      "salary": 0,
      "vendor": 0,
      "advance": 0,
      "grandTotal": 0
    }
  },
  {
    "date": "2026-07-11",
    "openingCash": 18887,
    "kitchenSale": 19228,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          {
            "name": "nik3",
            "amount": 8407
          },
          {
            "name": "nik2",
            "amount": 10821
          }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      {
        "name": "nik3",
        "amount": 8407
      },
      {
        "name": "nik2",
        "amount": 10821
      }
    ],
    "coffeeShop": 18020,
    "coffeeShopSale": 18020,
    "coffeeSubTabs": [
      {
        "name": "Coffee Shop",
        "entries": [],
        "directAmount": 18020
      }
    ],
    "coffeeShopEntries": [],
    "officialCr": 6863,
    "officialCrEntries": [
      {
        "name": "amit",
        "amount": 6863
      }
    ],
    "personalCr": 12348,
    "personalCrEntries": [
      {
        "name": "raj",
        "amount": 5408
      },
      {
        "name": "nik1",
        "amount": 6940
      }
    ],
    "upiReceived": 2732,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 37248,
    "totalCash": 34192,
    "cashToOffice": 11169,
    "cashToOfficeEntries": [
      {
        "name": "nik2",
        "amount": 11169
      }
    ],
    "expenseEntries": {
      "Ration": 542,
      "Paneer": 595,
      "Bread": 601,
      "Disposable": 628,
      "Biscuits/Chips": 917,
      "Milk": 304,
      "Room Rent": 798,
      "LPG": 653,
      "Mobile/Petrol": 852,
      "Travel Exp": 464,
      "Salary": 389
    },
    "cashExpenses": 6743,
    "cashInHand": 16280,
    "closingCash": 16280,
    "expenses": {
      "ration": 0,
      "paneer": 0,
      "veg": 0,
      "bread": 0,
      "milk": 0,
      "roomRent": 0,
      "lpg": 0,
      "egg": 0,
      "hk": 0,
      "metro": 0,
      "misc": 0,
      "salary": 0,
      "vendor": 0,
      "advance": 0,
      "grandTotal": 0
    }
  },
  {
    "date": "2026-07-12",
    "openingCash": 16280,
    "kitchenSale": 21650,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          {
            "name": "nik2",
            "amount": 6794
          },
          {
            "name": "nik3",
            "amount": 14856
          }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      {
        "name": "nik2",
        "amount": 6794
      },
      {
        "name": "nik3",
        "amount": 14856
      }
    ],
    "coffeeShop": 18096,
    "coffeeShopSale": 18096,
    "coffeeSubTabs": [
      {
        "name": "Coffee Shop",
        "entries": [],
        "directAmount": 18096
      }
    ],
    "coffeeShopEntries": [],
    "officialCr": 10895,
    "officialCrEntries": [
      {
        "name": "nik1",
        "amount": 10895
      }
    ],
    "personalCr": 5907,
    "personalCrEntries": [
      {
        "name": "nik2",
        "amount": 4646
      },
      {
        "name": "amit",
        "amount": 1261
      }
    ],
    "upiReceived": 5032,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 39746,
    "totalCash": 34192,
    "cashToOffice": 14157,
    "cashToOfficeEntries": [
      {
        "name": "raj",
        "amount": 14157
      }
    ],
    "expenseEntries": {
      "Paneer": 54,
      "Veg": 183,
      "Bread": 302,
      "Juice": 139,
      "Disposable": 158,
      "Biscuits/Chips": 245,
      "Milk": 310,
      "Room Rent": 250,
      "LPG": 87,
      "Egg": 258,
      "Mobile/Petrol": 259,
      "Travel Exp": 84,
      "Salary": 234
    },
    "cashExpenses": 2563,
    "cashInHand": 17472,
    "closingCash": 17472,
    "expenses": {
      "ration": 0,
      "paneer": 0,
      "veg": 0,
      "bread": 0,
      "milk": 0,
      "roomRent": 0,
      "lpg": 0,
      "egg": 0,
      "hk": 0,
      "metro": 0,
      "misc": 0,
      "salary": 0,
      "vendor": 0,
      "advance": 0,
      "grandTotal": 0
    }
  },
  {
    "date": "2026-07-13",
    "openingCash": 17472,
    "kitchenSale": 21463,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          {
            "name": "nik2",
            "amount": 6921
          },
          {
            "name": "nik3",
            "amount": 14542
          }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      {
        "name": "nik2",
        "amount": 6921
      },
      {
        "name": "nik3",
        "amount": 14542
      }
    ],
    "coffeeShop": 20330,
    "coffeeShopSale": 20330,
    "coffeeSubTabs": [
      {
        "name": "Coffee Shop",
        "entries": [],
        "directAmount": 20330
      }
    ],
    "coffeeShopEntries": [],
    "officialCr": 12570,
    "officialCrEntries": [
      {
        "name": "nik1",
        "amount": 12570
      }
    ],
    "personalCr": 7249,
    "personalCrEntries": [
      {
        "name": "nik3",
        "amount": 5433
      },
      {
        "name": "amit",
        "amount": 1816
      }
    ],
    "upiReceived": 4554,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 41793,
    "totalCash": 34892,
    "cashToOffice": 8802,
    "cashToOfficeEntries": [
      {
        "name": "nik2",
        "amount": 8802
      }
    ],
    "expenseEntries": {
      "Ration": 2112,
      "Paneer": 1374,
      "Veg": 2486,
      "Disposable": 2864,
      "LPG": 550,
      "Mobile/Petrol": 2325,
      "Travel Exp": 1504
    },
    "cashExpenses": 13215,
    "cashInHand": 12875,
    "closingCash": 12875,
    "expenses": {
      "ration": 0,
      "paneer": 0,
      "veg": 0,
      "bread": 0,
      "milk": 0,
      "roomRent": 0,
      "lpg": 0,
      "egg": 0,
      "hk": 0,
      "metro": 0,
      "misc": 0,
      "salary": 0,
      "vendor": 0,
      "advance": 0,
      "grandTotal": 0
    }
  },
  {
    "date": "2026-07-14",
    "openingCash": 12875,
    "kitchenSale": 17804,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          {
            "name": "nik1",
            "amount": 12567
          },
          {
            "name": "raj",
            "amount": 5237
          }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      {
        "name": "nik1",
        "amount": 12567
      },
      {
        "name": "raj",
        "amount": 5237
      }
    ],
    "coffeeShop": 16731,
    "coffeeShopSale": 16731,
    "coffeeSubTabs": [
      {
        "name": "Coffee Shop",
        "entries": [],
        "directAmount": 16731
      }
    ],
    "coffeeShopEntries": [],
    "officialCr": 3056,
    "officialCrEntries": [
      {
        "name": "amit",
        "amount": 3056
      }
    ],
    "personalCr": 6480,
    "personalCrEntries": [
      {
        "name": "nik2",
        "amount": 4109
      },
      {
        "name": "nik2",
        "amount": 2371
      }
    ],
    "upiReceived": 12061,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 34535,
    "totalCash": 25813,
    "cashToOffice": 10024,
    "cashToOfficeEntries": [
      {
        "name": "nik2",
        "amount": 10024
      }
    ],
    "expenseEntries": {
      "Ration": 412,
      "Veg": 1465,
      "Juice": 547,
      "Disposable": 619,
      "Milk": 1049,
      "Room Rent": 981,
      "LPG": 1047,
      "Egg": 593
    },
    "cashExpenses": 6713,
    "cashInHand": 9076,
    "closingCash": 9076,
    "expenses": {
      "ration": 0,
      "paneer": 0,
      "veg": 0,
      "bread": 0,
      "milk": 0,
      "roomRent": 0,
      "lpg": 0,
      "egg": 0,
      "hk": 0,
      "metro": 0,
      "misc": 0,
      "salary": 0,
      "vendor": 0,
      "advance": 0,
      "grandTotal": 0
    }
  },
  {
    "date": "2026-07-15",
    "openingCash": 9076,
    "kitchenSale": 23976,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          {
            "name": "nik3",
            "amount": 7704
          },
          {
            "name": "amit",
            "amount": 16272
          }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      {
        "name": "nik3",
        "amount": 7704
      },
      {
        "name": "amit",
        "amount": 16272
      }
    ],
    "coffeeShop": 20988,
    "coffeeShopSale": 20988,
    "coffeeSubTabs": [
      {
        "name": "Coffee Shop",
        "entries": [],
        "directAmount": 20988
      }
    ],
    "coffeeShopEntries": [],
    "officialCr": 11685,
    "officialCrEntries": [
      {
        "name": "amit",
        "amount": 11685
      }
    ],
    "personalCr": 8210,
    "personalCrEntries": [
      {
        "name": "nik2",
        "amount": 5312
      },
      {
        "name": "nik3",
        "amount": 2898
      }
    ],
    "upiReceived": 11227,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 44964,
    "totalCash": 22918,
    "cashToOffice": 4827,
    "cashToOfficeEntries": [
      {
        "name": "amit",
        "amount": 4827
      }
    ],
    "expenseEntries": {
      "Ration": 329,
      "Paneer": 985,
      "Veg": 584,
      "Bread": 386,
      "Juice": 369,
      "Disposable": 751,
      "Biscuits/Chips": 439,
      "Sweets/Snacks": 462,
      "Milk": 271,
      "Room Rent": 397,
      "LPG": 283,
      "Egg": 632,
      "Mobile/Petrol": 509,
      "Salary": 819
    },
    "cashExpenses": 7216,
    "cashInHand": 10875,
    "closingCash": 10875,
    "expenses": {
      "ration": 0,
      "paneer": 0,
      "veg": 0,
      "bread": 0,
      "milk": 0,
      "roomRent": 0,
      "lpg": 0,
      "egg": 0,
      "hk": 0,
      "metro": 0,
      "misc": 0,
      "salary": 0,
      "vendor": 0,
      "advance": 0,
      "grandTotal": 0
    }
  },
  {
    "date": "2026-07-16",
    "openingCash": 10875,
    "kitchenSale": 18531,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          {
            "name": "nik1",
            "amount": 7141
          },
          {
            "name": "nik2",
            "amount": 11390
          }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      {
        "name": "nik1",
        "amount": 7141
      },
      {
        "name": "nik2",
        "amount": 11390
      }
    ],
    "coffeeShop": 27274,
    "coffeeShopSale": 27274,
    "coffeeSubTabs": [
      {
        "name": "Coffee Shop",
        "entries": [],
        "directAmount": 27274
      }
    ],
    "coffeeShopEntries": [],
    "officialCr": 6465,
    "officialCrEntries": [
      {
        "name": "amit",
        "amount": 6465
      }
    ],
    "personalCr": 7560,
    "personalCrEntries": [
      {
        "name": "nik1",
        "amount": 2522
      },
      {
        "name": "amit",
        "amount": 5038
      }
    ],
    "upiReceived": 10209,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 45805,
    "totalCash": 32446,
    "cashToOffice": 2354,
    "cashToOfficeEntries": [
      {
        "name": "raj",
        "amount": 2354
      }
    ],
    "expenseEntries": {
      "Ration": 703,
      "Veg": 812,
      "Bread": 1814,
      "Disposable": 673,
      "Sweets/Snacks": 1636,
      "Milk": 887,
      "Room Rent": 1207,
      "LPG": 616,
      "Egg": 1330,
      "Travel Exp": 1338,
      "Salary": 1788
    },
    "cashExpenses": 12804,
    "cashInHand": 17288,
    "closingCash": 17288,
    "expenses": {
      "ration": 0,
      "paneer": 0,
      "veg": 0,
      "bread": 0,
      "milk": 0,
      "roomRent": 0,
      "lpg": 0,
      "egg": 0,
      "hk": 0,
      "metro": 0,
      "misc": 0,
      "salary": 0,
      "vendor": 0,
      "advance": 0,
      "grandTotal": 0
    }
  },
  {
    "date": "2026-07-17",
    "openingCash": 17288,
    "kitchenSale": 23204,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          {
            "name": "nik2",
            "amount": 6802
          },
          {
            "name": "nik1",
            "amount": 16402
          }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      {
        "name": "nik2",
        "amount": 6802
      },
      {
        "name": "nik1",
        "amount": 16402
      }
    ],
    "coffeeShop": 17150,
    "coffeeShopSale": 17150,
    "coffeeSubTabs": [
      {
        "name": "Coffee Shop",
        "entries": [],
        "directAmount": 17150
      }
    ],
    "coffeeShopEntries": [],
    "officialCr": 6335,
    "officialCrEntries": [
      {
        "name": "nik3",
        "amount": 6335
      }
    ],
    "personalCr": 15221,
    "personalCrEntries": [
      {
        "name": "raj",
        "amount": 9611
      },
      {
        "name": "raj",
        "amount": 5610
      }
    ],
    "upiReceived": 9975,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 40354,
    "totalCash": 26111,
    "cashToOffice": 7677,
    "cashToOfficeEntries": [
      {
        "name": "raj",
        "amount": 7677
      }
    ],
    "expenseEntries": {
      "Ration": 212,
      "Paneer": 541,
      "Veg": 722,
      "Bread": 305,
      "Juice": 413,
      "Biscuits/Chips": 241,
      "Sweets/Snacks": 342,
      "LPG": 257,
      "Egg": 471,
      "Salary": 870
    },
    "cashExpenses": 4374,
    "cashInHand": 14060,
    "closingCash": 14060,
    "expenses": {
      "ration": 0,
      "paneer": 0,
      "veg": 0,
      "bread": 0,
      "milk": 0,
      "roomRent": 0,
      "lpg": 0,
      "egg": 0,
      "hk": 0,
      "metro": 0,
      "misc": 0,
      "salary": 0,
      "vendor": 0,
      "advance": 0,
      "grandTotal": 0
    }
  },
  {
    "date": "2026-07-18",
    "openingCash": 14060,
    "kitchenSale": 19528,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          {
            "name": "nik1",
            "amount": 7722
          },
          {
            "name": "amit",
            "amount": 11806
          }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      {
        "name": "nik1",
        "amount": 7722
      },
      {
        "name": "amit",
        "amount": 11806
      }
    ],
    "coffeeShop": 17222,
    "coffeeShopSale": 17222,
    "coffeeSubTabs": [
      {
        "name": "Coffee Shop",
        "entries": [],
        "directAmount": 17222
      }
    ],
    "coffeeShopEntries": [],
    "officialCr": 7003,
    "officialCrEntries": [
      {
        "name": "nik2",
        "amount": 7003
      }
    ],
    "personalCr": 8123,
    "personalCrEntries": [
      {
        "name": "raj",
        "amount": 5014
      },
      {
        "name": "amit",
        "amount": 3109
      }
    ],
    "upiReceived": 7912,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 36750,
    "totalCash": 27772,
    "cashToOffice": 7152,
    "cashToOfficeEntries": [
      {
        "name": "nik2",
        "amount": 7152
      }
    ],
    "expenseEntries": {
      "Ration": 100,
      "Juice": 256,
      "Disposable": 108,
      "Biscuits/Chips": 485,
      "Sweets/Snacks": 456,
      "Milk": 297,
      "Room Rent": 199,
      "LPG": 241,
      "Salary": 375
    },
    "cashExpenses": 2517,
    "cashInHand": 18103,
    "closingCash": 18103,
    "expenses": {
      "ration": 0,
      "paneer": 0,
      "veg": 0,
      "bread": 0,
      "milk": 0,
      "roomRent": 0,
      "lpg": 0,
      "egg": 0,
      "hk": 0,
      "metro": 0,
      "misc": 0,
      "salary": 0,
      "vendor": 0,
      "advance": 0,
      "grandTotal": 0
    }
  },
  {
    "date": "2026-07-19",
    "openingCash": 18103,
    "kitchenSale": 16408,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          {
            "name": "amit",
            "amount": 7597
          },
          {
            "name": "amit",
            "amount": 8811
          }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      {
        "name": "amit",
        "amount": 7597
      },
      {
        "name": "amit",
        "amount": 8811
      }
    ],
    "coffeeShop": 25589,
    "coffeeShopSale": 25589,
    "coffeeSubTabs": [
      {
        "name": "Coffee Shop",
        "entries": [],
        "directAmount": 25589
      }
    ],
    "coffeeShopEntries": [],
    "officialCr": 12340,
    "officialCrEntries": [
      {
        "name": "nik3",
        "amount": 12340
      }
    ],
    "personalCr": 12436,
    "personalCrEntries": [
      {
        "name": "nik1",
        "amount": 8575
      },
      {
        "name": "nik2",
        "amount": 3861
      }
    ],
    "upiReceived": 9018,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 41997,
    "totalCash": 26306,
    "cashToOffice": 6648,
    "cashToOfficeEntries": [
      {
        "name": "nik1",
        "amount": 6648
      }
    ],
    "expenseEntries": {
      "Veg": 167,
      "Juice": 554,
      "Disposable": 292,
      "Biscuits/Chips": 485,
      "Room Rent": 150,
      "LPG": 645,
      "Egg": 537,
      "Mobile/Petrol": 291,
      "Travel Exp": 114
    },
    "cashExpenses": 3235,
    "cashInHand": 16423,
    "closingCash": 16423,
    "expenses": {
      "ration": 0,
      "paneer": 0,
      "veg": 0,
      "bread": 0,
      "milk": 0,
      "roomRent": 0,
      "lpg": 0,
      "egg": 0,
      "hk": 0,
      "metro": 0,
      "misc": 0,
      "salary": 0,
      "vendor": 0,
      "advance": 0,
      "grandTotal": 0
    }
  },
  {
    "date": "2026-07-20",
    "openingCash": 16423,
    "kitchenSale": 23592,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          {
            "name": "nik2",
            "amount": 11789
          },
          {
            "name": "nik1",
            "amount": 11803
          }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      {
        "name": "nik2",
        "amount": 11789
      },
      {
        "name": "nik1",
        "amount": 11803
      }
    ],
    "coffeeShop": 18207,
    "coffeeShopSale": 18207,
    "coffeeSubTabs": [
      {
        "name": "Coffee Shop",
        "entries": [],
        "directAmount": 18207
      }
    ],
    "coffeeShopEntries": [],
    "officialCr": 9657,
    "officialCrEntries": [
      {
        "name": "amit",
        "amount": 9657
      }
    ],
    "personalCr": 7149,
    "personalCrEntries": [
      {
        "name": "nik1",
        "amount": 1309
      },
      {
        "name": "nik3",
        "amount": 5840
      }
    ],
    "upiReceived": 6616,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 41799,
    "totalCash": 34800,
    "cashToOffice": 5407,
    "cashToOfficeEntries": [
      {
        "name": "nik3",
        "amount": 5407
      }
    ],
    "expenseEntries": {
      "Paneer": 2063,
      "Veg": 1809,
      "Disposable": 703,
      "Milk": 1186,
      "Room Rent": 1869,
      "LPG": 2000,
      "Egg": 666,
      "Salary": 1420
    },
    "cashExpenses": 11716,
    "cashInHand": 17677,
    "closingCash": 17677,
    "expenses": {
      "ration": 0,
      "paneer": 0,
      "veg": 0,
      "bread": 0,
      "milk": 0,
      "roomRent": 0,
      "lpg": 0,
      "egg": 0,
      "hk": 0,
      "metro": 0,
      "misc": 0,
      "salary": 0,
      "vendor": 0,
      "advance": 0,
      "grandTotal": 0
    }
  },
  {
    "date": "2026-07-21",
    "openingCash": 17677,
    "kitchenSale": 23656,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          {
            "name": "nik1",
            "amount": 14321
          },
          {
            "name": "amit",
            "amount": 9335
          }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      {
        "name": "nik1",
        "amount": 14321
      },
      {
        "name": "amit",
        "amount": 9335
      }
    ],
    "coffeeShop": 23564,
    "coffeeShopSale": 23564,
    "coffeeSubTabs": [
      {
        "name": "Coffee Shop",
        "entries": [],
        "directAmount": 23564
      }
    ],
    "coffeeShopEntries": [],
    "officialCr": 7385,
    "officialCrEntries": [
      {
        "name": "raj",
        "amount": 7385
      }
    ],
    "personalCr": 3313,
    "personalCrEntries": [
      {
        "name": "amit",
        "amount": 1144
      },
      {
        "name": "nik3",
        "amount": 2169
      }
    ],
    "upiReceived": 10114,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 47220,
    "totalCash": 44085,
    "cashToOffice": 14610,
    "cashToOfficeEntries": [
      {
        "name": "nik1",
        "amount": 14610
      }
    ],
    "expenseEntries": {
      "Paneer": 246,
      "Bread": 429,
      "Biscuits/Chips": 943,
      "Sweets/Snacks": 845,
      "Milk": 503,
      "LPG": 706,
      "Egg": 650,
      "Travel Exp": 444,
      "Salary": 421
    },
    "cashExpenses": 5187,
    "cashInHand": 24288,
    "closingCash": 24288,
    "expenses": {
      "ration": 0,
      "paneer": 0,
      "veg": 0,
      "bread": 0,
      "milk": 0,
      "roomRent": 0,
      "lpg": 0,
      "egg": 0,
      "hk": 0,
      "metro": 0,
      "misc": 0,
      "salary": 0,
      "vendor": 0,
      "advance": 0,
      "grandTotal": 0
    }
  },
  {
    "date": "2026-07-22",
    "openingCash": 24288,
    "kitchenSale": 17212,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          {
            "name": "nik1",
            "amount": 3090
          },
          {
            "name": "nik3",
            "amount": 14122
          }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      {
        "name": "nik1",
        "amount": 3090
      },
      {
        "name": "nik3",
        "amount": 14122
      }
    ],
    "coffeeShop": 25059,
    "coffeeShopSale": 25059,
    "coffeeSubTabs": [
      {
        "name": "Coffee Shop",
        "entries": [],
        "directAmount": 25059
      }
    ],
    "coffeeShopEntries": [],
    "officialCr": 9387,
    "officialCrEntries": [
      {
        "name": "nik1",
        "amount": 9387
      }
    ],
    "personalCr": 10192,
    "personalCrEntries": [
      {
        "name": "amit",
        "amount": 5538
      },
      {
        "name": "nik1",
        "amount": 4654
      }
    ],
    "upiReceived": 8062,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 42271,
    "totalCash": 38918,
    "cashToOffice": 13797,
    "cashToOfficeEntries": [
      {
        "name": "nik3",
        "amount": 13797
      }
    ],
    "expenseEntries": {
      "Paneer": 616,
      "Veg": 785,
      "Disposable": 149,
      "Biscuits/Chips": 557,
      "Sweets/Snacks": 343,
      "Milk": 322,
      "Room Rent": 800,
      "Mobile/Petrol": 643
    },
    "cashExpenses": 4215,
    "cashInHand": 20906,
    "closingCash": 20906,
    "expenses": {
      "ration": 0,
      "paneer": 0,
      "veg": 0,
      "bread": 0,
      "milk": 0,
      "roomRent": 0,
      "lpg": 0,
      "egg": 0,
      "hk": 0,
      "metro": 0,
      "misc": 0,
      "salary": 0,
      "vendor": 0,
      "advance": 0,
      "grandTotal": 0
    }
  },
  {
    "date": "2026-07-23",
    "openingCash": 20906,
    "kitchenSale": 22779,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          {
            "name": "raj",
            "amount": 13703
          },
          {
            "name": "raj",
            "amount": 9076
          }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      {
        "name": "raj",
        "amount": 13703
      },
      {
        "name": "raj",
        "amount": 9076
      }
    ],
    "coffeeShop": 18374,
    "coffeeShopSale": 18374,
    "coffeeSubTabs": [
      {
        "name": "Coffee Shop",
        "entries": [],
        "directAmount": 18374
      }
    ],
    "coffeeShopEntries": [],
    "officialCr": 10519,
    "officialCrEntries": [
      {
        "name": "nik3",
        "amount": 10519
      }
    ],
    "personalCr": 8615,
    "personalCrEntries": [
      {
        "name": "amit",
        "amount": 6546
      },
      {
        "name": "nik2",
        "amount": 2069
      }
    ],
    "upiReceived": 8431,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 41153,
    "totalCash": 34494,
    "cashToOffice": 6238,
    "cashToOfficeEntries": [
      {
        "name": "raj",
        "amount": 6238
      }
    ],
    "expenseEntries": {
      "Veg": 1675,
      "Bread": 2546,
      "Juice": 761,
      "Disposable": 990,
      "Biscuits/Chips": 1059,
      "Mobile/Petrol": 509,
      "Travel Exp": 942,
      "Salary": 2572
    },
    "cashExpenses": 11054,
    "cashInHand": 17202,
    "closingCash": 17202,
    "expenses": {
      "ration": 0,
      "paneer": 0,
      "veg": 0,
      "bread": 0,
      "milk": 0,
      "roomRent": 0,
      "lpg": 0,
      "egg": 0,
      "hk": 0,
      "metro": 0,
      "misc": 0,
      "salary": 0,
      "vendor": 0,
      "advance": 0,
      "grandTotal": 0
    }
  },
  {
    "date": "2026-07-24",
    "openingCash": 17202,
    "kitchenSale": 24402,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          {
            "name": "nik3",
            "amount": 15539
          },
          {
            "name": "nik1",
            "amount": 8863
          }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      {
        "name": "nik3",
        "amount": 15539
      },
      {
        "name": "nik1",
        "amount": 8863
      }
    ],
    "coffeeShop": 25649,
    "coffeeShopSale": 25649,
    "coffeeSubTabs": [
      {
        "name": "Coffee Shop",
        "entries": [],
        "directAmount": 25649
      }
    ],
    "coffeeShopEntries": [],
    "officialCr": 12586,
    "officialCrEntries": [
      {
        "name": "nik3",
        "amount": 12586
      }
    ],
    "personalCr": 3857,
    "personalCrEntries": [
      {
        "name": "raj",
        "amount": 959
      },
      {
        "name": "nik2",
        "amount": 2898
      }
    ],
    "upiReceived": 16040,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 50051,
    "totalCash": 34770,
    "cashToOffice": 8270,
    "cashToOfficeEntries": [
      {
        "name": "raj",
        "amount": 8270
      }
    ],
    "expenseEntries": {
      "Paneer": 1134,
      "Veg": 2925,
      "Juice": 1081,
      "Sweets/Snacks": 4148,
      "Milk": 1502,
      "Egg": 800,
      "Salary": 3214
    },
    "cashExpenses": 14804,
    "cashInHand": 11696,
    "closingCash": 11696,
    "expenses": {
      "ration": 0,
      "paneer": 0,
      "veg": 0,
      "bread": 0,
      "milk": 0,
      "roomRent": 0,
      "lpg": 0,
      "egg": 0,
      "hk": 0,
      "metro": 0,
      "misc": 0,
      "salary": 0,
      "vendor": 0,
      "advance": 0,
      "grandTotal": 0
    }
  },
  {
    "date": "2026-07-25",
    "openingCash": 11696,
    "kitchenSale": 17238,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          {
            "name": "raj",
            "amount": 3436
          },
          {
            "name": "nik1",
            "amount": 13802
          }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      {
        "name": "raj",
        "amount": 3436
      },
      {
        "name": "nik1",
        "amount": 13802
      }
    ],
    "coffeeShop": 23735,
    "coffeeShopSale": 23735,
    "coffeeSubTabs": [
      {
        "name": "Coffee Shop",
        "entries": [],
        "directAmount": 23735
      }
    ],
    "coffeeShopEntries": [],
    "officialCr": 3296,
    "officialCrEntries": [
      {
        "name": "nik3",
        "amount": 3296
      }
    ],
    "personalCr": 11787,
    "personalCrEntries": [
      {
        "name": "raj",
        "amount": 5625
      },
      {
        "name": "amit",
        "amount": 6162
      }
    ],
    "upiReceived": 5108,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 40973,
    "totalCash": 32478,
    "cashToOffice": 4272,
    "cashToOfficeEntries": [
      {
        "name": "nik3",
        "amount": 4272
      }
    ],
    "expenseEntries": {
      "Paneer": 803,
      "Juice": 1611,
      "Disposable": 1478,
      "Biscuits/Chips": 1692,
      "Sweets/Snacks": 1649,
      "Milk": 453,
      "LPG": 476,
      "Egg": 1529,
      "Travel Exp": 586,
      "Salary": 907
    },
    "cashExpenses": 11184,
    "cashInHand": 17022,
    "closingCash": 17022,
    "expenses": {
      "ration": 0,
      "paneer": 0,
      "veg": 0,
      "bread": 0,
      "milk": 0,
      "roomRent": 0,
      "lpg": 0,
      "egg": 0,
      "hk": 0,
      "metro": 0,
      "misc": 0,
      "salary": 0,
      "vendor": 0,
      "advance": 0,
      "grandTotal": 0
    }
  },
  {
    "date": "2026-07-26",
    "openingCash": 17022,
    "kitchenSale": 23717,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          {
            "name": "amit",
            "amount": 13139
          },
          {
            "name": "nik2",
            "amount": 10578
          }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      {
        "name": "amit",
        "amount": 13139
      },
      {
        "name": "nik2",
        "amount": 10578
      }
    ],
    "coffeeShop": 23280,
    "coffeeShopSale": 23280,
    "coffeeSubTabs": [
      {
        "name": "Coffee Shop",
        "entries": [],
        "directAmount": 23280
      }
    ],
    "coffeeShopEntries": [],
    "officialCr": 15243,
    "officialCrEntries": [
      {
        "name": "nik3",
        "amount": 15243
      }
    ],
    "personalCr": 8655,
    "personalCrEntries": [
      {
        "name": "nik3",
        "amount": 4637
      },
      {
        "name": "nik3",
        "amount": 4018
      }
    ],
    "upiReceived": 4444,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 46997,
    "totalCash": 35677,
    "cashToOffice": 12552,
    "cashToOfficeEntries": [
      {
        "name": "nik3",
        "amount": 12552
      }
    ],
    "expenseEntries": {
      "Ration": 2345,
      "Paneer": 2412,
      "Room Rent": 1905,
      "LPG": 1614,
      "Egg": 999,
      "Mobile/Petrol": 914,
      "Salary": 614
    },
    "cashExpenses": 10803,
    "cashInHand": 12322,
    "closingCash": 12322,
    "expenses": {
      "ration": 0,
      "paneer": 0,
      "veg": 0,
      "bread": 0,
      "milk": 0,
      "roomRent": 0,
      "lpg": 0,
      "egg": 0,
      "hk": 0,
      "metro": 0,
      "misc": 0,
      "salary": 0,
      "vendor": 0,
      "advance": 0,
      "grandTotal": 0
    }
  },
  {
    "date": "2026-07-27",
    "openingCash": 12322,
    "kitchenSale": 16279,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          {
            "name": "amit",
            "amount": 6400
          },
          {
            "name": "nik2",
            "amount": 9879
          }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      {
        "name": "amit",
        "amount": 6400
      },
      {
        "name": "nik2",
        "amount": 9879
      }
    ],
    "coffeeShop": 19594,
    "coffeeShopSale": 19594,
    "coffeeSubTabs": [
      {
        "name": "Coffee Shop",
        "entries": [],
        "directAmount": 19594
      }
    ],
    "coffeeShopEntries": [],
    "officialCr": 9777,
    "officialCrEntries": [
      {
        "name": "amit",
        "amount": 9777
      }
    ],
    "personalCr": 6561,
    "personalCrEntries": [
      {
        "name": "nik2",
        "amount": 2903
      },
      {
        "name": "nik2",
        "amount": 3658
      }
    ],
    "upiReceived": 2049,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 35873,
    "totalCash": 29808,
    "cashToOffice": 4239,
    "cashToOfficeEntries": [
      {
        "name": "nik1",
        "amount": 4239
      }
    ],
    "expenseEntries": {
      "Ration": 1134,
      "Paneer": 313,
      "Veg": 1551,
      "Bread": 666,
      "Juice": 575,
      "Disposable": 788,
      "Biscuits/Chips": 592,
      "Room Rent": 1579,
      "Mobile/Petrol": 904,
      "Travel Exp": 723,
      "Salary": 1193
    },
    "cashExpenses": 10018,
    "cashInHand": 15551,
    "closingCash": 15551,
    "expenses": {
      "ration": 0,
      "paneer": 0,
      "veg": 0,
      "bread": 0,
      "milk": 0,
      "roomRent": 0,
      "lpg": 0,
      "egg": 0,
      "hk": 0,
      "metro": 0,
      "misc": 0,
      "salary": 0,
      "vendor": 0,
      "advance": 0,
      "grandTotal": 0
    }
  },
  {
    "date": "2026-07-28",
    "openingCash": 15551,
    "kitchenSale": 17837,
    "kitchenSubTabs": [
      {
        "name": "Kitchen Sale",
        "entries": [
          {
            "name": "raj",
            "amount": 9062
          },
          {
            "name": "amit",
            "amount": 8775
          }
        ],
        "directAmount": null
      }
    ],
    "kitchenSaleEntries": [
      {
        "name": "raj",
        "amount": 9062
      },
      {
        "name": "amit",
        "amount": 8775
      }
    ],
    "coffeeShop": 26864,
    "coffeeShopSale": 26864,
    "coffeeSubTabs": [
      {
        "name": "Coffee Shop",
        "entries": [],
        "directAmount": 26864
      }
    ],
    "coffeeShopEntries": [],
    "officialCr": 2810,
    "officialCrEntries": [
      {
        "name": "amit",
        "amount": 2810
      }
    ],
    "personalCr": 12084,
    "personalCrEntries": [
      {
        "name": "nik2",
        "amount": 8958
      },
      {
        "name": "nik1",
        "amount": 3126
      }
    ],
    "upiReceived": 6313,
    "cafeSale": 0,
    "cafeNight": 0,
    "totalSale": 44701,
    "totalCash": 39045,
    "cashToOffice": 11880,
    "cashToOfficeEntries": [
      {
        "name": "amit",
        "amount": 11880
      }
    ],
    "expenseEntries": {
      "Paneer": 804,
      "Juice": 647,
      "Disposable": 396,
      "Biscuits/Chips": 548,
      "Sweets/Snacks": 779,
      "Milk": 728,
      "Room Rent": 177,
      "LPG": 277,
      "Egg": 839,
      "Mobile/Petrol": 373,
      "Travel Exp": 935,
      "Salary": 194
    },
    "cashExpenses": 6697,
    "cashInHand": 20468,
    "closingCash": 20468,
    "expenses": {
      "ration": 0,
      "paneer": 0,
      "veg": 0,
      "bread": 0,
      "milk": 0,
      "roomRent": 0,
      "lpg": 0,
      "egg": 0,
      "hk": 0,
      "metro": 0,
      "misc": 0,
      "salary": 0,
      "vendor": 0,
      "advance": 0,
      "grandTotal": 0
    }
  }
];

const MONTH_START = new Date("2026-07-01T00:00:00.000Z");
const MONTH_END = new Date("2026-08-01T00:00:00.000Z");

const run = async () => {
  await connectDB();

  try {
    // ── Step 1: drop existing July daybook entries for this shop ──
    const deleted = await DayBook.deleteMany({
      shop: SHOP_ID,
      date: { $gte: MONTH_START, $lt: MONTH_END },
    });
    console.log(`🗑️  Deleted ${deleted.deletedCount} existing July entries for shop ${SHOP_ID}`);

    // ── Step 2: insert the fresh, realistic month ──
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