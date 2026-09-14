import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.middlewares.js';
import { Wallet } from '../models/wallet.model.js';
import { Transaction } from '../models/transaction.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

export const getWallet = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('دسترسی غیرمجاز', 401);
  }

  const wallet = await Wallet.findOne({ user: req.user.id });
  if (!wallet) {
    throw new AppError('کیف پول پیدا نشد', 404);
  }

  res.json(wallet);
});

export const getTransactions = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('دسترسی غیرمجاز', 401);
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    Transaction.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Transaction.countDocuments({ user: req.user.id }),
  ]);

  res.json({
    transactions,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

 