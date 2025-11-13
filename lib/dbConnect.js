import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("❌ MONGODB_URI missing in environment variables");
}

let isConnected = false;

export async function dbConnect() {
  if (isConnected) return;
  const db = await mongoose.connect(MONGODB_URI);
  isConnected = db.connections[0].readyState;
  console.log("✅ MongoDB connected");
}
