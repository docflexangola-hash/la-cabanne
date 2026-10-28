import { z } from 'zod';

export const feedbackSchema = z.object({
  type: z.enum(['compliment', 'suggestion', 'complaint', 'other']),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(10, 'Mínimo 10 caracteres').max(2000, 'Máximo 2000 caracteres'),
  name: z.string().trim().max(80).optional().or(z.literal('')),
  contact: z.string().trim().max(120).optional().or(z.literal('')),
  website: z.string().optional(), // honeypot
  elapsed: z.coerce.number().int().min(0).optional(), // tempo mínimo
  source_path: z.string().max(200).optional(),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;
