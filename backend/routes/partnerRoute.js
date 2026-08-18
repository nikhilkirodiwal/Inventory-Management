import express from "express";
import { protect, isSuperAdmin } from "../middlewares/authMiddleware.js";
import {
  getPartners,
  createPartner,
  updatePartner,
  deletePartner,
  getPartnerDetail,
  getPartnerOverview,
  getPartnerShops,
  getPartnerShopTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../controllers/partnerController.js";

const router = express.Router();

router.use(protect, isSuperAdmin);

router.route("/").get(getPartners).post(createPartner);

// all shops + full all-time transaction history grouped per site
router.get("/:id/overview", getPartnerOverview);

// level 2: shop/site summary for a partner (?month=YYYY-MM, defaults to current month)
router.get("/:id/shops", getPartnerShops);
// level 3: day-wise transactions for a partner scoped to one shop ("unassigned" allowed)
router.get("/:id/shops/:shopId", getPartnerShopTransactions);

router.route("/:id").get(getPartnerDetail).put(updatePartner).delete(deletePartner);
router.route("/:id/transactions").post(createTransaction);
router.route("/:id/transactions/:txnId").put(updateTransaction).delete(deleteTransaction);

export default router;