import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { tradeSchema } from "../validators/trade.validator.js";
import {
  buy,
  sell,
  getPrice,
  getPriceHistoryController,
} from "../controllers/trade.controller.js";
import {
  getWallet,
  getTransactions,
  getDailySummary,
} from "../controllers/wallet.controller.js";
import { protect } from "../middlewares/auth.middlewares.js";

const router = Router();

router.get("/price", getPrice);
router.get("/price/history", getPriceHistoryController);
router.get("/wallet", protect, getWallet);
router.get("/transactions", protect, getTransactions);
router.get("/transactions/daily-summary", protect, getDailySummary);
router.post("/buy", protect, validate(tradeSchema), buy);
router.post("/sell", protect, validate(tradeSchema), sell);

export default router;
