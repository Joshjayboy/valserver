// models/CartInsight.js
import mongoose from "mongoose";

const CartInsightSchema = new mongoose.Schema({
  shop: { type: String, required: true },
  totalCarts: Number,
  totalValue: Number,
  insight: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.CartInsight ||
  mongoose.model("CartInsight", CartInsightSchema);
