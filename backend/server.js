import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import { connectDB } from "./db/dbconnection.js";

import authRoute from "./routes/authRoute.js";
import dayBookRoute from "./routes/dayBookRoute.js";
import shopRoute from "./routes/shopRoute.js";
import partnerRoute from "./routes/partnerRoute.js";
import ledgerRoute from "./routes/ledgerRoute.js";
import pnlRoute from "./routes/pnlRoute.js";
import User from "./models/user.js";
import Partner from "./models/partner.js";
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();

connectDB();

// Ensure a default superadmin exists (email and password from env)
const ensureSuperAdmin = async () => {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!email || !password) return;

    const existing = await User.findOne({ email: email.toLowerCase() });

    if (existing) {
      if (existing.role !== "superadmin") {
        existing.role = "superadmin";
        await existing.save();
      }
      return;
    }

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      name: "Super Admin",
      email: email.toLowerCase(),
      password: hashed,
      role: "superadmin",
    });
    console.log("Default superadmin created or ensured.");
  } catch (err) {
    console.error("Error ensuring superadmin:", err.message);
  }
};

// Ensure the three initial business partners exist
// const ensurePartners = async () => {
//   const names = ["Vijayant Kohli", "Shishir Arora", "S K Pahuja"];
//   try {
//     for (const name of names) {
//       const existing = await Partner.findOne({ name });
//       if (!existing) await Partner.create({ name });
//     }
//     console.log("Initial partners ensured.");
//   } catch (err) {
//     console.error("Error ensuring partners:", err.message);
//   }
// };

const startServer = async () => {
  await ensureSuperAdmin();
  // await ensurePartners();

  app.use(express.json());

  app.use(
    cors({
      origin: process.env.FRONTEND_URL,
      credentials: true,
    }),
  );

  app.use("/api/auth", authRoute);
  app.use("/api/daybook", dayBookRoute);
  app.use("/api/shops", shopRoute);
  app.use("/api/partners", partnerRoute);
  app.use("/api/ledger", ledgerRoute);
  app.use("/api/pnl", pnlRoute);

  app.get("/", (req, res) => {
    res.send("API Running");
  });

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });
};

startServer();