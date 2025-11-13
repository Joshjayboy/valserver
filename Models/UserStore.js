// models/UserStore.js
import mongoose from "mongoose";

const UserStoreSchema = new mongoose.Schema({
  shop: { type: String, required: true, unique: true },
  accessToken: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.UserStore ||
  mongoose.model("UserStore", UserStoreSchema);
