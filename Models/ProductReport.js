// models/ProductReport.js
import mongoose from "mongoose";

const ProductReportSchema = new mongoose.Schema({
  shop: String,
  topProducts: [String],
  lowProducts: [String],
  insights: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.ProductReport ||
  mongoose.model("ProductReport", ProductReportSchema);
