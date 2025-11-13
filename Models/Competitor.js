// models/Competitor.js
import mongoose from "mongoose";

const CompetitorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "UserStore" },
  name: String,
  url: String,
  lastSnapshot: String,
  lastChecked: Date,
});

export default mongoose.models.Competitor ||
  mongoose.model("Competitor", CompetitorSchema);
