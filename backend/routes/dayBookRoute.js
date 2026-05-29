import express from "express";
import {
  getEntries,
  getEntry,
  createEntry,
  updateEntry,
  deleteEntry,
  getMonthlySummary,
} from "../controllers/dayBookController.js";

// Attach your auth middleware here if needed:
// import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/summary/monthly", getMonthlySummary);
router.route("/").get(getEntries).post(createEntry);
router.route("/:id").get(getEntry).put(updateEntry).delete(deleteEntry);

export default router;
