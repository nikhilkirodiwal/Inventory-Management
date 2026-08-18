import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./db/dbconnection.js";
import DayBook from "./models/dayBook.js";

dotenv.config();

// The shop these entries belong to. Replace with the real shop _id if needed.
const SHOP_ID = "6a68569a6c2ddfbfb6fc2e1e";

// Updated July plus August till today in this workspace: 2026-08-12.
const RANGE_START = new Date("2026-07-01T00:00:00.000Z");
const RANGE_END = new Date("2026-08-13T00:00:00.000Z");

const staff = ["nik1", "nik2", "nik3", "amit", "raj"];
const creditNames = ["nik1", "nik2", "nik3", "amit", "raj"];
const expenseCategories = [
  "Ration",
  "Paneer",
  "Veg",
  "Bread",
  "Juice",
  "Disposable",
  "Biscuits/Chips",
  "Sweets/Snacks",
  "Milk",
  "Room Rent",
  "LPG",
  "Egg",
  "Mobile/Petrol",
  "Travel Exp",
  "Salary",
];

const legacyExpenses = {
  ration: 0,
  paneer: 0,
  veg: 0,
  bread: 0,
  milk: 0,
  roomRent: 0,
  lpg: 0,
  egg: 0,
  hk: 0,
  metro: 0,
  misc: 0,
  salary: 0,
  vendor: 0,
  advance: 0,
  grandTotal: 0,
};

const makeRand = (seed) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const amount = (rand, min, max) => Math.round(min + rand() * (max - min));

const splitAmount = (total, names, rand) => {
  const first = amount(rand, Math.round(total * 0.35), Math.round(total * 0.68));
  return [
    { name: names[Math.floor(rand() * names.length)], amount: first },
    { name: names[Math.floor(rand() * names.length)], amount: total - first },
  ];
};

const makeExpenseEntries = (rand, dayOfMonth, isWeekend) => {
  const selected = expenseCategories.filter((_, index) => {
    if (dayOfMonth % 7 === 0 && ["Room Rent", "Salary", "LPG"].includes(expenseCategories[index])) return true;
    return rand() > (isWeekend ? 0.35 : 0.42);
  });

  const entries = {};
  for (const category of selected) {
    const highValue = ["Room Rent", "LPG", "Salary", "Sweets/Snacks"].includes(category);
    entries[category] = amount(rand, highValue ? 550 : 140, highValue ? 3600 : 1750);
  }
  return entries;
};

const datesBetween = (start, endExclusive) => {
  const dates = [];
  for (let d = new Date(start); d < endExclusive; d.setUTCDate(d.getUTCDate() + 1)) {
    dates.push(new Date(d));
  }
  return dates;
};

const buildEntries = () => {
  let openingCash = 8000;

  return datesBetween(RANGE_START, RANGE_END).map((date, index) => {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    const dateText = `${y}-${m}-${d}`;
    const rand = makeRand(Number(`${y}${m}${d}`));
    const isWeekend = [0, 6].includes(date.getUTCDay());
    const augustLift = date.getUTCMonth() === 7 ? 900 : 0;

    const kitchenSale = amount(rand, isWeekend ? 21000 : 16000, isWeekend ? 31000 : 26500) + augustLift;
    const coffeeShop = amount(rand, isWeekend ? 22500 : 17500, isWeekend ? 30500 : 27500) + Math.round(augustLift * 0.75);
    const officialCr = amount(rand, 2600, 13500);
    const personalCr = amount(rand, 3000, 12500);
    const upiReceived = amount(rand, 2500, 17000);
    const totalSale = kitchenSale + coffeeShop;
    const totalCash = openingCash + totalSale - officialCr - personalCr - upiReceived;
    const expenseEntries = makeExpenseEntries(rand, date.getUTCDate(), isWeekend);
    const cashExpenses = Object.values(expenseEntries).reduce((sum, value) => sum + value, 0);
    const cashToOffice = amount(rand, 3000, Math.max(4500, Math.min(15500, totalCash - cashExpenses - 3500)));
    const cashInHand = Math.max(1800, totalCash - cashExpenses - cashToOffice);

    const kitchenSaleEntries = splitAmount(kitchenSale, staff, rand);
    const officialCrEntries = [{ name: creditNames[Math.floor(rand() * creditNames.length)], amount: officialCr }];
    const personalCrEntries = splitAmount(personalCr, creditNames, rand).map((entry) => ({
      ...entry,
      creditedAmount: 0,
    }));
    const cashToOfficeEntries = [{ name: staff[Math.floor(rand() * staff.length)], amount: cashToOffice }];

    const entry = {
      date: dateText,
      openingCash,
      kitchenSale,
      kitchenSubTabs: [{ name: "Kitchen Sale", entries: kitchenSaleEntries, directAmount: null }],
      kitchenSaleEntries,
      coffeeShop,
      coffeeShopSale: coffeeShop,
      coffeeSubTabs: [{ name: "Coffee Shop", entries: [], directAmount: coffeeShop }],
      coffeeShopEntries: [],
      officialCr,
      officialCrEntries,
      personalCr,
      personalCrEntries,
      upiReceived,
      cafeSale: 0,
      cafeNight: 0,
      totalSale,
      totalCash,
      cashToOffice,
      cashToOfficeEntries,
      expenseEntries,
      cashExpenses,
      cashInHand,
      closingCash: cashInHand,
      expenses: legacyExpenses,
    };

    openingCash = cashInHand;

    // Keep a few lower days in the run so the data is not a perfect climb.
    if ([10, 18, 27, 35].includes(index)) openingCash = Math.max(2500, openingCash - amount(rand, 2500, 6500));

    return entry;
  });
};

const entries = buildEntries();

const run = async () => {
  await connectDB();

  try {
    const deleted = await DayBook.deleteMany({
      shop: SHOP_ID,
      date: { $gte: RANGE_START, $lt: RANGE_END },
    });
    console.log(`Deleted ${deleted.deletedCount} existing daybook entries from July 1 to August 12 for shop ${SHOP_ID}`);

    const docs = entries.map((entry) => ({ ...entry, shop: SHOP_ID }));
    const result = await DayBook.insertMany(docs, { ordered: true });

    const first = result[0];
    const last = result[result.length - 1];
    const lossDays = result.filter((row) => row.cashInHand < row.openingCash).length;
    console.log(`Inserted ${result.length} daybook entries for shop ${SHOP_ID}`);
    console.log(`Opening cash on ${first.date.toDateString()}: Rs ${first.openingCash}`);
    console.log(`Closing cash on ${last.date.toDateString()}: Rs ${last.cashInHand}`);
    console.log(`Loss days: ${lossDays}/${result.length}`);
    console.log(`Net movement: Rs ${last.cashInHand - first.openingCash}`);
  } catch (err) {
    console.error("Reseed failed:", err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

run();
