import mongoose from "mongoose";
 
const partnerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    note: { type: String, default: "" },
  },
  { timestamps: true },
);
 
export default mongoose.model("Partner", partnerSchema);
 