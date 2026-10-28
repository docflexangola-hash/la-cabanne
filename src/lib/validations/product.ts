import { z } from 'zod';

export const productStatusSchema = z.enum([
  'draft',
  'published',
  'unavailable',
  'archived',
]);

export const variantOptionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .trim()
    .min(1, { message: 'Nome da variante obrigatório' })
    .max(60, { message: 'Máximo 60 caracteres' }),
  price: z.coerce
    .number({ error: 'Preço inválido' })
    .min(0, { message: 'O preço não pode ser negativo' }),
  displayOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const variantGroupSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .trim()
    .min(1, { message: 'Nome do grupo de variantes obrigatório' })
    .max(60, { message: 'Máximo 60 caracteres' }),
  displayOrder: z.coerce.number().int().default(0),
  isRequired: z.boolean().default(true),
  variants: z
    .array(variantOptionSchema)
    .min(1, { message: 'O grupo de variantes deve ter pelo menos uma opção' }),
});

export const productSchema = z
  .object({
    categoryId: z.string().uuid({ message: 'Selecione uma categoria válida' }),
    name: z
      .string()
      .trim()
      .min(1, { message: 'O nome do produto é obrigatório' })
      .max(120, { message: 'O nome não pode exceder 120 caracteres' }),
    slug: z
      .string()
      .trim()
      .min(1, { message: 'O slug é obrigatório' })
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
        message: 'Slug inválido (apenas minúsculas, números e hífens)',
      }),
    description: z.string().trim().nullable().optional(),
    basePrice: z.coerce
      .number({ error: 'Preço inválido' })
      .min(0, { message: 'O preço base não pode ser negativo' })
      .nullable()
      .optional(),
    priceNote: z.string().trim().nullable().optional(),
    imagePath: z.string().trim().nullable().optional(),
    imageAlt: z.string().trim().nullable().optional(),
    tags: z.array(z.string().trim()).default([]),
    allergens: z.array(z.string().trim()).default([]),
    serves: z.string().trim().nullable().optional(),
    status: productStatusSchema.default('draft'),
    displayOrder: z.coerce.number().int().default(0),
    variantGroups: z.array(variantGroupSchema).default([]),
  })
  .refine(
    (data) => {
      // Must have either basePrice or priceNote or variantGroups with options
      const hasBasePrice = data.basePrice !== null && data.basePrice !== undefined;
      const hasPriceNote = Boolean(data.priceNote && data.priceNote.trim().length > 0);
      const hasVariants = data.variantGroups.length > 0;
      return hasBasePrice || hasPriceNote || hasVariants;
    },
    {
      message: 'O produto deve ter um preço base, nota de preço ou variantes configuradas.',
      path: ['basePrice'],
    },
  )
  .refine(
    (data) => {
      // If imagePath is provided, imageAlt is required according to Phase 3.5
      if (data.imagePath && data.imagePath.trim().length > 0) {
        return Boolean(data.imageAlt && data.imageAlt.trim().length > 0);
      }
      return true;
    },
    {
      message: 'O texto alternativo da imagem é obrigatório quando existe imagem.',
      path: ['imageAlt'],
    },
  );

export type ProductInput = z.infer<typeof productSchema>;
export type VariantGroupInput = z.infer<typeof variantGroupSchema>;
export type VariantOptionInput = z.infer<typeof variantOptionSchema>;
