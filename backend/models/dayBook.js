import mongoose from "mongoose";

const personEntrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    amount: { type: Number, default: 0 },
  },
  { _id: false },
);

const dayBookSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, unique: true },
    openingCash: { type: Number, default: 0 },
    cashToOffice: { type: Number, default: 0 },
    cashToOfficeEntries: [personEntrySchema],

    // Sales
    kitchenSale: { type: Number, default: 0 },
    kitchenSaleEntries: [personEntrySchema],
    officialCr: { type: Number, default: 0 },
    officialCrEntries: [personEntrySchema],
    personalCr: { type: Number, default: 0 },
    personalCrEntries: [personEntrySchema],

    coffeeShop: { type: Number, default: 0 },
    coffeeShopSale: { type: Number, default: 0 }, // legacy alias
    coffeeShopEntries: [personEntrySchema],

    cafeSale: { type: Number, default: 0 },
    cafeNight: { type: Number, default: 0 },
    upiReceived: { type: Number, default: 0 },

    totalSale: { type: Number, default: 0 },
    totalCash: { type: Number, default: 0 },

    // Expenses
    expenseEntries: { type: Map, of: Number, default: {} },
    cashExpenses: { type: Number, default: 0 },
    closingCash: { type: Number, default: 0 },

    // Legacy expense breakdown (kept for backward compat)
    expenses: {
      ration: { type: Number, default: 0 },
      paneer: { type: Number, default: 0 },
      veg: { type: Number, default: 0 },
      bread: { type: Number, default: 0 },
      milk: { type: Number, default: 0 },
      roomRent: { type: Number, default: 0 },
      lpg: { type: Number, default: 0 },
      egg: { type: Number, default: 0 },
      hk: { type: Number, default: 0 },
      metro: { type: Number, default: 0 },
      misc: { type: Number, default: 0 },
      salary: { type: Number, default: 0 },
      vendor: { type: Number, default: 0 },
      advance: { type: Number, default: 0 },
      grandTotal: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

export default mongoose.model("DayBook", dayBookSchema);
