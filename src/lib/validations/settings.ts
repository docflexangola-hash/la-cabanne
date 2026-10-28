import { z } from 'zod';

const timeIntervalSchema = z
  .tuple([
    z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Formato HH:MM inválido' }),
    z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Formato HH:MM inválido' }),
  ])
  .refine(([start, end]) => start <= end, {
    message: 'A hora de início deve ser anterior ou igual à hora de fim',
  });

export const weekHoursSchema = z.record(
  z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
  z.array(timeIntervalSchema).nullable(),
);

export const restaurantSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'O nome do restaurante é obrigatório' })
    .max(80, { message: 'Máximo 80 caracteres' }),
  phone: z.string().trim().nullable().optional(),
  whatsapp: z.string().trim().nullable().optional(),
  email: z
    .string()
    .trim()
    .email({ message: 'Email inválido' })
    .nullable()
    .optional()
    .or(z.literal('')),
  address: z.string().trim().nullable().optional(),
  hours: weekHoursSchema.default({
    mon: null,
    tue: null,
    wed: null,
    thu: null,
    fri: null,
    sat: null,
    sun: null,
  }),
  instagram: z.string().trim().nullable().optional(),
  infoMessage: z.string().trim().nullable().optional(),
  isOpenOverride: z.boolean().nullable().optional(),
});

export type RestaurantSettingsInput = z.infer<typeof restaurantSettingsSchema>;
