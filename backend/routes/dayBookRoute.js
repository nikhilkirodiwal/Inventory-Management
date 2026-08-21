import express from "express";
import {
  getEntries,
  getEntry,
  createEntry,
  updateEntry,
  deleteEntry,
  getMonthlySummary,
  updatePersonalCrCredit,
  getShopFieldTotals,
} from "../controllers/dayBookController.js";
import { protect, isSuperAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/summary/monthly", getMonthlySummary);
// Superadmin-only: per-shop totals for a DayBook field (salary | officialCr),
// powers the read-only Salary / Patient Bill "pick a site" screens.
router.get("/shop-totals/:field", isSuperAdmin, getShopFieldTotals);
router.route("/").get(getEntries).post(createEntry);
router.route("/:id").get(getEntry).put(updateEntry).delete(deleteEntry);
router.patch("/:id/personal-cr/:index", updatePersonalCrCredit);

export default router;
