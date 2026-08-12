import mongoose from "mongoose";

const partnerTransactionSchema = new mongoose.Schema(
  {
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      required: true,
    },
    // Site the transaction belongs to. null = "Unassigned" (legacy transactions
    // created before shop-tagging existed, or genuinely business-wide transactions).
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", default: null },
    date: { type: Date, required: true },
    // "transfer" = cash going OUT to the partner (business pays partner)
    // "receive"  = cash coming IN from the partner (partner pays business)
    type: { type: String, enum: ["transfer", "receive"], required: true },
    amount: { type: Number, required: true, min: 0 },
    note: { type: String, default: "" },
  },
  { timestamps: true },
);

partnerTransactionSchema.index({ partner: 1, date: 1 });
partnerTransactionSchema.index({ partner: 1, shop: 1, date: 1 });

export default mongoose.model("PartnerTransaction", partnerTransactionSchema);
