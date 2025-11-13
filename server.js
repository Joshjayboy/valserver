import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { connectDb } from "./config/Db.js";
import userRouter from "./Routers/UserRoute.js";
import { errorHandler } from "./middleware/Error.js";

// ✅ Load environment variables
dotenv.config();

// ✅ Set up Express app
const __dirname = path.resolve();
const app = express();

// ✅ Properly configure allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.warn(`❌ Blocked by CORS: ${origin}`);
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ✅ Parse incoming JSON and URL data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Connect to MongoDB
connectDb();

// ✅ API Routes
app.use("/api/users", userRouter);

// ✅ Error handler
app.use(errorHandler);

// ✅ Simple home route
app.get("/", (req, res) => {
  res.send("🚀 RecoverCart backend is running successfully!");
});

// ✅ Serve frontend (optional, for production)
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});