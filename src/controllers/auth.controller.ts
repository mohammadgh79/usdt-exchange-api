import type { Request, Response } from 'express';
import { Wallet } from '../models/wallet.model.js';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

/**
 * Generates a signed JWT containing the user's id.
 *
 * @param {string} userId - MongoDB document id of the user.
 * @returns {string} Signed JWT, valid for 7 days.
 */
const generateToken = (userId: string) => {
  const secret = process.env.JWT_SECRET as string;
  return jwt.sign({ id: userId }, secret, { expiresIn: '7d' });
};

/**
 * Registers a new user and returns an auth token.
 *
 * Route: POST /auth/register
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'این ایمیل قبلاً ثبت‌نام شده' });
    }
    
    const user = await User.create({ name, email, password });
    await Wallet.create({ user: user.id, tomanBalance: 0, tetherBalance: 0 });
    const token = generateToken(user.id);

    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (error) {
    res.status(400).json({ message: 'خطا در ثبت‌نام', error });
  }
};

/**
 * Logs in an existing user and returns an auth token.
 *
 * Route: POST /auth/login
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'ایمیل یا رمز عبور اشتباه است' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'ایمیل یا رمز عبور اشتباه است' });
    }

    const token = generateToken(user.id);

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'خطا در ورود', error });
  }
};


import type { AuthRequest } from '../middlewares/auth.middlewares.js';

/**
 * Returns the currently authenticated user's profile.
 * Requires the `protect` middleware to run first (populates req.user).
 *
 * Route: GET /auth/me
 */
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'کاربر پیدا نشد' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'خطا در دریافت پروفایل', error });
  }
};

