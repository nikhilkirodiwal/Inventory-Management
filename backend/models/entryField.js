import mongoose from "mongoose";

const entryFieldSchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, unique: true },
    names: {
      counterSale: { type: [String], default: [] },
      kitchenSale: { type: [String], default: [] },
      coffeeShop: { type: [String], default: [] },
      officialCr: { type: [String], default: [] },
      personalCr: { type: [String], default: [] },
      upiReceived: { type: [String], default: [] },
      purchaseCredit: { type: [String], default: [] },
      expenseSubnames: { type: Map, of: [String], default: {} },
      overtime: { type: [String], default: [] },
      salary: { type: [String], default: [] },
      advance: { type: [String], default: [] },
    },
    saleTabNames: { type: Map, of: [String], default: {} },
  },
  { timestamps: true },
);

export default mongoose.model("EntryField", entryFieldSchema);
