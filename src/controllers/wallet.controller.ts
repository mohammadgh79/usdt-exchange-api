import type { Response } from "express";
import { Types } from "mongoose";
import type { AuthRequest } from "../middlewares/auth.middlewares.js";
import { Wallet } from "../models/wallet.model.js";
import { Transaction } from "../models/transaction.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

export const getWallet = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError("دسترسی غیرمجاز", 401);
    }

    const wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      throw new AppError("کیف پول پیدا نشد", 404);
    }

    res.json(wallet);
  },
);

export const getTransactions = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError("دسترسی غیرمجاز", 401);
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 5, 1),
      100,
    );

    const skip = (page - 1) * limit;

    const filter = {
      user: req.user.id,
    };

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Transaction.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      transactions,
      page,
      limit,
      total,
      totalPages,
    });
  },
);
export const getDailySummary = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError("دسترسی غیرمجاز", 401);
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = 5;

    const summary = await Transaction.aggregate([
      {
        $match: {
          user: new Types.ObjectId(req.user.id),
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          buy: {
            $sum: {
              $cond: [{ $eq: ["$type", "buy"] }, "$totalToman", 0],
            },
          },
          sell: {
            $sum: {
              $cond: [{ $eq: ["$type", "sell"] }, "$totalToman", 0],
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);
    if (summary.length === 0) {
      return res.json({
        days: [],
        page: 1,
        limit,
        total: 0,
        totalPages: 1,
      });
    }

    const firstDate = new Date(summary[0]._id);
    const lastDate = new Date(summary[summary.length - 1]._id);

    const dailyMap = new Map(
      summary.map((entry) => [
        entry._id,
        {
          date: entry._id,
          buy: entry.buy,
          sell: entry.sell,
        },
      ]),
    );

    const allDays = [];

    for (
      let date = new Date(firstDate);
      date <= lastDate;
      date.setDate(date.getDate() + 1)
    ) {
      const dateKey = date.toISOString().slice(0, 10);

      allDays.push(
        dailyMap.get(dateKey) || {
          date: dateKey,
          buy: 0,
          sell: 0,
        },
      );
    }

    allDays.reverse();

    const total = allDays.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const paginatedDays = allDays.slice(skip, skip + limit);

    res.json({
      days: paginatedDays,
      page,
      limit,
      total,
      totalPages,
    });
  },
);
