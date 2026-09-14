import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route handler so any thrown error (or rejected Promise)
 * is automatically passed to Express's error-handling middleware via next(),
 * instead of needing a try/catch in every controller.
 */
export const asyncHandler = (fn: RequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};