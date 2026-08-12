import express from "express";
import { protect, isSuperAdmin } from "../middlewares/authMiddleware.js";
import {
  getLedgerEntries,
  getLedgerSummary,
  getLedgerShopTotals,
  createLedgerEntry,
  updateLedgerEntry,
  deleteLedgerEntry,
} from "../controllers/ledgerController.js";

const router = express.Router();

router.use(protect);

/* Admin Expense is business-wide but any shop admin can log into the same
   shared ledger. Salary & Patient Bill are the site-wise reporting views —
   those stay superadmin-only, same as this whole router used to be. */
const allowLedgerAccess = (req, res, next) => {
  if (req.params.kind === "adminExpense" && ["admin", "superadmin"].includes(req.user.role)) {
    return next();
  }
  return isSuperAdmin(req, res, next);
};

// :kind must be one of 'salary' | 'adminExpense' | 'patientBill'
router.get("/:kind/shops", allowLedgerAccess, getLedgerShopTotals); // site picker (salary/patientBill only)
router.get("/:kind/summary", allowLedgerAccess, getLedgerSummary);
router.route("/:kind").get(allowLedgerAccess, getLedgerEntries).post(allowLedgerAccess, createLedgerEntry);
router.route("/:kind/:id").put(allowLedgerAccess, updateLedgerEntry).delete(allowLedgerAccess, deleteLedgerEntry);

export default router;