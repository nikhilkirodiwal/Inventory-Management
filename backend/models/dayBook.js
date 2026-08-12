import mongoose from "mongoose";

const personEntrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    amount: { type: Number, default: 0 },
  },
  { _id: false },
);

/* Personal Cr. entries need one more thing than a plain person-entry: how
   much of that amount has actually been credited/settled back so far. Kept
   as its own schema (rather than bolting onto personEntrySchema) so Official
   Cr., Cash to Office, Salary and Advance — which don't need this — stay
   unaffected. creditedAmount is clamped server-side to [0, amount]. */
const personalCrEntrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    amount: { type: Number, default: 0 },
    creditedAmount: { type: Number, default: 0 }, // how much of `amount` has been credited so far
  },
  { _id: false },
);

/* A "sale sub-tab" — e.g. under Kitchen Sale: "Kitchen Sale", "Lunch Special";
   under Coffee Shop: "Coffee Shop", "Café Sale", "Café Night", or any custom name.
   Each tab is either a single direct amount OR a by-person breakdown. */
const saleSubTabSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    entries: [personEntrySchema],
    directAmount: { type: Number, default: 0 },
  },
  { _id: false },
);

const dayBookSchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", default: null },
    date: { type: Date, required: true },

    // ① Opening Cash — auto-filled from previous day's Cash In Hand
    openingCash: { type: Number, default: 0 },

    // ② Kitchen Sale — flexible sub-tabs (replaces the old single kitchenSale field)
    kitchenSale: { type: Number, default: 0 },
    kitchenSubTabs: [saleSubTabSchema],
    kitchenSaleEntries: [personEntrySchema], // legacy by-person breakdown, kept for old records

    // ③ Coffee Shop — flexible sub-tabs (replaces Café Sale / Café Night as fixed fields)
    coffeeShop: { type: Number, default: 0 },
    coffeeShopSale: { type: Number, default: 0 }, // legacy alias
    coffeeSubTabs: [saleSubTabSchema],
    coffeeShopEntries: [personEntrySchema], // legacy flat breakdown, kept for old records

    // ⑤ ⑥ Credits
    officialCr: { type: Number, default: 0 },
    officialCrEntries: [personEntrySchema],
    personalCr: { type: Number, default: 0 },
    personalCrEntries: [personalCrEntrySchema], // by-person, each markable as credited or not

    // ⑦ UPI Received
    upiReceived: { type: Number, default: 0 },

    // Legacy fields — no longer written to by new entries, kept so old records still read fine
    cafeSale: { type: Number, default: 0 },
    cafeNight: { type: Number, default: 0 },

    // ④ Total Sale = Kitchen Sale + Coffee Shop (incl. all sub-tabs)
    totalSale: { type: Number, default: 0 },
    // ⑧ Total Cash = Opening Cash + Total Sale − Official Cr − Personal Cr − UPI Received
    totalCash: { type: Number, default: 0 },

    // ⑨ Cash to Office
    cashToOffice: { type: Number, default: 0 },
    cashToOfficeEntries: [personEntrySchema],

    // Salary — pulled out of the generic expense map into its own by-person
    // breakdown (who was paid, how much), while still counting toward Cash
    // Expenses as a whole.
    salary: { type: Number, default: 0 },
    salaryEntries: [personEntrySchema],

    // Advance — same treatment as Salary: own by-person breakdown, still
    // rolled into Cash Expenses.
    advance: { type: Number, default: 0 },
    advanceEntries: [personEntrySchema],

    // ⑩ Cash Expenses — the generic category map (Salary/Advance no longer
    // live as keys in here; they're tracked above and added on top).
    expenseEntries: { type: Map, of: Number, default: {} },
    cashExpenses: { type: Number, default: 0 }, // = sum(expenseEntries) + salary + advance

    // ⑪ Cash In Hand = Total Cash − Cash Expenses − Cash to Office
    // becomes next day's Opening Cash
    cashInHand: { type: Number, default: 0 },
    closingCash: { type: Number, default: 0 }, // alias, kept for backward compatibility

    // Legacy expense breakdown (kept for backward compat, no longer written to)
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

dayBookSchema.index({ shop: 1, date: 1 }, { unique: true });

export default mongoose.model("DayBook", dayBookSchema);
