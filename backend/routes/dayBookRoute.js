import express from "express";
import {
  getEntries,
  getEntry,
  createEntry,
  updateEntry,
  deleteEntry,
  getMonthlySummary,
} from "../controllers/dayBookController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/summary/monthly", getMonthlySummary);
router.route("/").get(getEntries).post(createEntry);
router.route("/:id").get(getEntry).put(updateEntry).delete(deleteEntry);

export default router;
