import express from "express";
import { protect, isSuperAdmin } from "../middlewares/authMiddleware.js";
import { getPnl } from "../controllers/pnlController.js";

const router = express.Router();

router.use(protect, isSuperAdmin);
router.get("/", getPnl);

export default router;