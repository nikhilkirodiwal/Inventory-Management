import express from "express";
import { protect, isSuperAdmin } from "../middlewares/authMiddleware.js";
import {
  getLedgerEntries,
  getLedgerSummary,
  createLedgerEntry,
  updateLedgerEntry,
  deleteLedgerEntry,
} from "../controllers/ledgerController.js";

const router = express.Router();

router.use(protect, isSuperAdmin);

// :kind must be one of 'salary' | 'adminExpense' | 'patientBill'
router.get("/:kind/summary", getLedgerSummary);
router.route("/:kind").get(getLedgerEntries).post(createLedgerEntry);
router.route("/:kind/:id").put(updateLedgerEntry).delete(deleteLedgerEntry);

export default router;