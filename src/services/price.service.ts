import { redisClient } from '../config/redis.js';
import { PriceHistory } from '../models/price-history.model.js';

const PRICE_CACHE_KEY = 'price:usdt-toman';
const LAST_PRICE_KEY = 'price:usdt-toman:last';

const CACHE_TTL_SECONDS = 10;

const BASE_PRICE = 60000;
const MAX_FLUCTUATION_PERCENT = 0.5;

const MAX_PRICE_POINTS = 100;

/**
 * Generates a new mock USDT price.
 */
const generateMockPrice = async (): Promise<number> => {
  const lastPriceRaw = await redisClient.get(LAST_PRICE_KEY);

  const lastPrice = lastPriceRaw
    ? Number(lastPriceRaw)
    : BASE_PRICE;

  const changePercent =
    (Math.random() * 2 - 1) * MAX_FLUCTUATION_PERCENT;

  const newPrice = Math.round(
    lastPrice * (1 + changePercent / 100)
  );

  await redisClient.set(LAST_PRICE_KEY, newPrice);

  return newPrice;
};

/**
 * Saves a price point to MongoDB
 * and keeps only the latest 100 points.
 */
const savePriceHistory = async (price: number): Promise<void> => {
  await PriceHistory.create({
    price,
  });

  const oldPrices = await PriceHistory
    .find()
    .sort({ createdAt: -1 })
    .skip(MAX_PRICE_POINTS)
    .select('_id')
    .lean();

  if (oldPrices.length > 0) {
    await PriceHistory.deleteMany({
      _id: {
        $in: oldPrices.map((item) => item._id),
      },
    });
  }
};

export const getUsdtPrice = async (): Promise<number> => {
  const cached = await redisClient.get(PRICE_CACHE_KEY);

  if (cached) {
    const price = Number(cached);

    await savePriceHistory(price);

    return price;
  }

  const price = await generateMockPrice();

  await redisClient.set(
    PRICE_CACHE_KEY,
    price,
    'EX',
    CACHE_TTL_SECONDS
  );

  await savePriceHistory(price);

  return price;
};

/**
 * Returns the latest 100 price points.
 */
export const getPriceHistory = async () => {
  return PriceHistory
    .find()
    .sort({ createdAt: 1 })
    .limit(MAX_PRICE_POINTS)
    .lean();
};