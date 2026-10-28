import { z } from 'zod';

export const inviteUserSchema = z.object({
  email: z.string().trim().email({ message: 'Email inválido' }),
  displayName: z
    .string()
    .trim()
    .min(1, { message: 'O nome é obrigatório' })
    .max(80, { message: 'Máximo 80 caracteres' }),
  role: z.enum(['admin', 'manager'], { message: 'Papel inválido' }),
});

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, { message: 'O nome é obrigatório' })
    .max(80, { message: 'Máximo 80 caracteres' }),
  role: z.enum(['admin', 'manager']).optional(),
  isActive: z.boolean().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: 'A palavra-passe actual é obrigatória' }),
    newPassword: z
      .string()
      .min(12, { message: 'A nova palavra-passe deve ter pelo menos 12 caracteres' }),
    confirmPassword: z.string().min(1, { message: 'Confirme a palavra-passe' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As palavras-passe não coincidem',
    path: ['confirmPassword'],
  });

export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
