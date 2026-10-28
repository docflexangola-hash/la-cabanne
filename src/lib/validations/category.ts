import { z } from 'zod';

export const categorySchema = z.object({
  groupId: z.string().uuid({ message: 'Grupo inválido' }),
  name: z
    .string()
    .trim()
    .min(1, { message: 'O nome da categoria é obrigatório' })
    .max(60, { message: 'O nome não pode exceder 60 caracteres' }),
  slug: z
    .string()
    .trim()
    .min(1, { message: 'O slug é obrigatório' })
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
      message: 'Slug inválido. Deve conter apenas letras minúsculas, números e hífens',
    }),
  displayOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  imagePath: z.string().trim().nullable().optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
