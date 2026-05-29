import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import { connectDB } from "./db/dbconnection.js";

import authRoute from "./routes/authRoute.js";
import dayBookRoute from "./routes/dayBookRoute.js";

dotenv.config();

const app = express();

connectDB();

app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use("/api/auth", authRoute);
app.use("/api/daybook", dayBookRoute);

app.get("/", (req, res) => {
  res.send("API Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
