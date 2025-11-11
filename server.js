// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import { connectDb } from "./config/Db.js";
// import userRouter from "./Routers/UserRoute.js";
// import { errorHandler } from "./middleware/Error.js";
// import path from "path";

// dotenv.config();
// const __dirname = path.resolve();
// const app = express();
// app.use(cors(process.env.ALLOWED_ORIGINS));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// // connect DB
// connectDb();

// // Other routes
// app.use("/api/users", userRouter);

// // error handler
// app.use(errorHandler);

// // home route
// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });

// // Main route
// if (process.env.NODE_ENV === "production") {
//   app.use(express.static("client/build"));
//   app.get("*", (req, res) => {
//     res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
//   });
// }

// const PORT = process.env.PORT || 5000;
// // listen
// app.listen(PORT, () => {
//   console.log(`Server is running in http://localhost:${PORT}`);
// });

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

// ✅ Fix: Configure CORS properly
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect DB
connectDb();

// Routes
app.use("/api/users", userRouter);

// Error handler
app.use(errorHandler);

// Home route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Production setup
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
