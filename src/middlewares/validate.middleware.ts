import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../utils/AppError.js';

/**
 * Returns a middleware that validates req.body against the given Zod schema.
 * If validation fails, throws an AppError with a 400 status.
 */
export const validate = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues.map((issue) => issue.message).join(', ');
      throw new AppError(message, 400);
    }

    req.body = result.data;
    next();
  };
};