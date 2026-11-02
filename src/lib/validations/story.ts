import { z } from 'zod';

export const storyModeSchema = z.enum(['manual', 'auto_all', 'auto_highlight']);

export const storySettingsSchema = z.object({
  enabled: z.boolean(),
  mode: storyModeSchema,
  intervalSeconds: z.coerce.number().int().min(3).max(15).default(5),
});

export const storyImageItemSchema = z.object({
  imagePath: z.string().trim().min(1, { message: 'A imagem é obrigatória' }),
  imageAlt: z
    .string()
    .trim()
    .min(1, { message: 'O texto alternativo é obrigatório' })
    .max(200, { message: 'Máximo 200 caracteres' }),
});

export type StorySettingsInput = z.infer<typeof storySettingsSchema>;
export type StoryImageItemInput = z.infer<typeof storyImageItemSchema>;
