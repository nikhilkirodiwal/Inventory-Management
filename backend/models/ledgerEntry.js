import mongoose from "mongoose";

const personEntrySchema = new mongoose.Schema(
  { name: { type: String, required: true }, amount: { type: Number, default: 0 } },
  { _id: false },
);

/* One shared collection for the three global, business-wide ledgers:
   'salary', 'adminExpense', 'patientBill'. Each is day-wise, with an
   optional by-person/by-category breakdown (same pattern as the daybook's
   sub-tabs) or a single direct amount. */
const ledgerEntrySchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ["salary", "adminExpense", "patientBill"], required: true },
    date: { type: Date, required: true },
    entries: [personEntrySchema],
    directAmount: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }, // computed total — entries sum, or directAmount
    note: { type: String, default: "" },
  },
  { timestamps: true },
);

ledgerEntrySchema.index({ kind: 1, date: 1 }, { unique: true });

export default mongoose.model("LedgerEntry", ledgerEntrySchema);