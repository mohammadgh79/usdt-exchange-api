import { Schema, model } from 'mongoose';

export interface IPriceHistory {
  price: number;
}

const priceHistorySchema = new Schema<IPriceHistory>(
  {
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const PriceHistory = model<IPriceHistory>(
  'PriceHistory',
  priceHistorySchema
);