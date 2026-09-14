import { Redis } from 'ioredis';
/**
 * Redis client instance, connected using the URL from environment variables.
 * Exported as a singleton so the same connection is reused across the app.
 */
const redisUrl = process.env.REDIS_URL as string;

export const redisClient = new Redis(redisUrl);

redisClient.on('connect', () => {
  console.log('Redis connected successfully');
});

redisClient.on('error', (error) => {
  console.error('Redis connection error:', error);
});