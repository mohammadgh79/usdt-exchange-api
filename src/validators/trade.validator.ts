import { z } from 'zod';

export const tradeSchema = z.object({
  amount: z.number().positive('مقدار باید یک عدد مثبت باشد'),
});