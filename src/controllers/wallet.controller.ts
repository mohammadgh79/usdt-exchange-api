import type { Response } from 'express';
import { Types } from 'mongoose';
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

  const transactions = await Transaction.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(100);

  res.json({ transactions });
});

export const getDailySummary = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('دسترسی غیرمجاز', 401);
  }

  const daysCount = 7;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (daysCount - 1));
  startDate.setHours(0, 0, 0, 0);

  const summary = await Transaction.aggregate([
    {
      $match: {
        user: new Types.ObjectId(req.user.id),
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        buy: {
          $sum: {
            $cond: [{ $eq: ['$type', 'buy'] }, '$totalToman', 0],
          },
        },
        sell: {
          $sum: {
            $cond: [{ $eq: ['$type', 'sell'] }, '$totalToman', 0],
          },
        },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  res.json({ days: summary.map((entry) => ({ date: entry._id, buy: entry.buy, sell: entry.sell })) });
});