/**
 * Custom error class that carries an HTTP status code alongside the message.
 * Thrown from controllers/services instead of manually calling res.status().json().
 */
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}