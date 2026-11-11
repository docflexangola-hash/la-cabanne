import { z } from 'zod';

const uuidSchema = z.string().uuid();

export const orderItemSchema = z.object({
  productId: uuidSchema,
  variantIds: z.array(uuidSchema).max(10).default([]),
  quantity: z.coerce.number().int().min(1).max(99),
  unitPrice: z.coerce.number().min(0).max(10_000_000),
  productName: z.string().trim().min(1).max(120),
  variantLabel: z
    .string()
    .trim()
    .max(120)
    .nullable()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
});

export const orderSchema = z.object({
  clientOrderId: uuidSchema,
  deviceId: uuidSchema,
  sessionId: uuidSchema,
  roundNumber: z.coerce.number().int().min(1).max(999),
  tableLabel: z
    .string()
    .trim()
    .max(20)
    .nullable()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  items: z.array(orderItemSchema).min(1).max(50),
  sourcePath: z.string().trim().max(200).optional(),
  website: z.string().optional(), // honeypot
});

export type OrderInput = z.infer<typeof orderSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
