import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, default: "" },
    contact: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("Shop", shopSchema);
