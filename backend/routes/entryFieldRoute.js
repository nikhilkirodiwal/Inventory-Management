import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { getEntryFields, updateEntryFields } from "../controllers/entryFieldController.js";

const router = express.Router();

router.use(protect);
router.route("/names").get(getEntryFields).put(updateEntryFields);

export default router;
