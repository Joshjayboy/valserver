import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDb } from "./config/Db.js";
import userRouter from "./Routers/UserRoute.js";
import { errorHandler } from "./middleware/Error.js";
import path from "path";

dotenv.config();
const __dirname = path.resolve();
const app = express();
app.use(cors(process.env.ALLOWED_ORIGINS));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// connect DB
connectDb();

// Other routes
app.use("/api/users", userRouter);

// error handler
app.use(errorHandler);

// home route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Main route
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

const PORT = process.env.PORT || 5000;
// listen
app.listen(PORT, () => {
  console.log(`Server is running in http://localhost:${PORT}`);
});
