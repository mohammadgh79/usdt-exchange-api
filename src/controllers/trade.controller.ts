import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.middlewares.js';
import { Wallet } from '../models/wallet.model.js';
import { Transaction } from '../models/transaction.model.js';
import { getUsdtPrice } from '../services/price.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { getPriceHistory } from '../services/price.service.js';
export const buy = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('دسترسی غیرمجاز', 401);
  }

  const userId = req.user.id;
  const { amount } = req.body;

  const price = await getUsdtPrice();
  const totalToman = amount * price;

  const wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    throw new AppError('کیف پول پیدا نشد', 404);
  }

  if (wallet.tomanBalance < totalToman) {
    throw new AppError('موجودی تومانی کافی نیست', 400);
  }

  wallet.tomanBalance -= totalToman;
  wallet.tetherBalance += amount;
  await wallet.save();

  const transaction = await Transaction.create({
    user: userId,
    type: 'buy',
    amount,
    pricePerUnit: price,
    totalToman,
  });

  res.status(201).json({ wallet, transaction });
});

export const sell = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('دسترسی غیرمجاز', 401);
  }

  const userId = req.user.id;
  const { amount } = req.body;

  const price = await getUsdtPrice();
  const totalToman = amount * price;

  const wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    throw new AppError('کیف پول پیدا نشد', 404);
  }

  if (wallet.tetherBalance < amount) {
    throw new AppError('موجودی تتر کافی نیست', 400);
  }

  wallet.tetherBalance -= amount;
  wallet.tomanBalance += totalToman;
  await wallet.save();

  const transaction = await Transaction.create({
    user: userId,
    type: 'sell',
    amount,
    pricePerUnit: price,
    totalToman,
  });

  res.status(201).json({ wallet, transaction });
});

export const getPrice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const price = await getUsdtPrice();
  res.json({ price });
});

export const getPriceHistoryController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const history = await getPriceHistory();

    res.json({
      history,
    });
  }
);