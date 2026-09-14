import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';

/**
 * Centralized error-handling middleware. Must be registered last,
 * after all routes, so Express recognizes it as an error handler
 * (identified by having 4 parameters: err, req, res, next).
 */
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  console.error('Unexpected error:', err);
  res.status(500).json({ message: 'خطای داخلی سرور' });
};