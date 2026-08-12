import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { isSuperAdmin } from "../middlewares/authMiddleware.js";
import {
  createShop,
  getShops,
  getShop,
  getMyShop,
  updateShop,
  deleteShop,
  setShopAdmin,
  updateShopAdmin,
  getShopMonthlyPnl,
} from "../controllers/shopController.js";

const router = express.Router();

router.use(protect);

router.route("/").get(isSuperAdmin, getShops).post(isSuperAdmin, createShop);
router.route("/me").get(getMyShop);
router
  .route("/:id")
  .get(isSuperAdmin, getShop)
  .put(isSuperAdmin, updateShop)
  .delete(isSuperAdmin, deleteShop);
router.get("/:id/pnl", isSuperAdmin, getShopMonthlyPnl);
router.route("/:id/admin").post(isSuperAdmin, setShopAdmin);
router.route("/:id/admin/:adminId").put(isSuperAdmin, updateShopAdmin);

export default router;
