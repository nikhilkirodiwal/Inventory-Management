import express from "express";
import { protect, isSuperAdmin } from "../middlewares/authMiddleware.js";
import {
  getPartners,
  createPartner,
  updatePartner,
  deletePartner,
  getPartnerDetail,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../controllers/partnerController.js";

const router = express.Router();

router.use(protect, isSuperAdmin);

router.route("/").get(getPartners).post(createPartner);
router.route("/:id").get(getPartnerDetail).put(updatePartner).delete(deletePartner);
router.route("/:id/transactions").post(createTransaction);
router.route("/:id/transactions/:txnId").put(updateTransaction).delete(deleteTransaction);

export default router;