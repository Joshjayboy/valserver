// models/Competitor.js
import mongoose from "mongoose";

const CompetitorSchema = new mongoose.Schema({
  // ✅ Link this competitor to a specific connected Shopify store/user
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "UserStore", required: true },

  name: { type: String, required: true },
  url: { type: String, required: true },
  lastSnapshot: { type: String }, // cached text version of last scan
  lastChecked: { type: Date, default: Date.now },
});

export default mongoose.models.Competitor ||
  mongoose.model("Competitor", CompetitorSchema);
