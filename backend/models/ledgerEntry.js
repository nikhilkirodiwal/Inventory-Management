import mongoose from "mongoose";

const personEntrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    amount: { type: Number, default: 0 },
  },
  { _id: false },
);

/* One shared collection for the three global ledgers: 'salary',
   'adminExpense', 'patientBill'.
     - 'salary' and 'patientBill' are SITE-SCOPED: every entry belongs to a
       shop, so you pick a site first, then see that site's day-wise entries.
     - 'adminExpense' stays business-wide (shop is always null) — any admin
       can log into the same shared ledger, it isn't tied to one site.
   Each entry is day-wise, with an optional by-person/by-category breakdown
   (same pattern as the daybook's sub-tabs) or a single direct amount. */
const ledgerEntrySchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ["salary", "adminExpense", "patientBill"],
      required: true,
    },
    // Required for 'salary' / 'patientBill'; always null for 'adminExpense'.
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", default: null },
    date: { type: Date, required: true },
    entries: [personEntrySchema],
    directAmount: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }, // computed total — entries sum, or directAmount
    note: { type: String, default: "" },
  },
  { timestamps: true },
);

// One entry per (kind, shop, date). For adminExpense, shop is always null,
// so this still enforces "one entry per day" for that ledger, same as before.
ledgerEntrySchema.index({ kind: 1, shop: 1, date: 1 }, { unique: true });

export default mongoose.model("LedgerEntry", ledgerEntrySchema);
