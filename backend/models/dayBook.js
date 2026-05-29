import mongoose from "mongoose";

const dayBookSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, unique: true },
    openingCash: { type: Number, default: 0 },
    kitchenSale: { type: Number, default: 0 },
    coffeeShopSale: { type: Number, default: 0 },
    cafeSale: { type: Number, default: 0 },
    cafeNight: { type: Number, default: 0 },
    totalSale: { type: Number, default: 0 },
    totalCash: { type: Number, default: 0 },
    cashExpenses: { type: Number, default: 0 },
    closingCash: { type: Number, default: 0 },
    // Expense breakdown
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
