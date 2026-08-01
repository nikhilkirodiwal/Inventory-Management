import mongoose from "mongoose";

const partnerTransactionSchema = new mongoose.Schema(
  {
    partner: { type: mongoose.Schema.Types.ObjectId, ref: "Partner", required: true },
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

export default mongoose.model("PartnerTransaction", partnerTransactionSchema);