import { validate } from '../middlewares/validate.middleware.js';
import { tradeSchema } from '../validators/trade.validator.js';
import { Router } from 'express';
import {buy,sell,getPrice,getPriceHistoryController,} from '../controllers/trade.controller.js';
import { getWallet, getTransactions } from '../controllers/wallet.controller.js';
import { protect } from '../middlewares/auth.middlewares.js';

const router = Router();

router.get('/price', getPrice);
router.get('/price/history', getPriceHistoryController);
router.get('/wallet', protect, getWallet);
router.get('/transactions', protect, getTransactions);
router.post('/buy', protect, validate(tradeSchema), buy);
router.post('/sell', protect, validate(tradeSchema), sell);
export default router;
