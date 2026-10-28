'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin, requireStaff } from '@/lib/auth/guard';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import {
  changePasswordSchema,
  inviteUserSchema,
  updateProfileSchema,
  type ChangePasswordInput,
  type InviteUserInput,
  type UpdateProfileInput,
} from '@/lib/validations/user';
import type { ActionResponse } from './categories';

export async function inviteUser(input: InviteUserInput): Promise<ActionResponse> {
  await requireAdmin();

  const parsed = inviteUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Dados de convite inválidos',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const adminClient = createAdminClient();

  // Invite user by email using Supabase Auth Admin
  const { data: authData, error: inviteError } =
    await adminClient.auth.admin.inviteUserByEmail(parsed.data.email, {
      data: { display_name: parsed.data.displayName },
    });

  if (inviteError || !authData.user) {
    return {
      success: false,
      message: inviteError?.message || 'Erro ao convidar utilizador',
    };
  }

  // Ensure admin profile has requested role and is active
  const { error: profileError } = await adminClient
    .from('admin_profiles')
    .upsert({
      id: authData.user.id,
      display_name: parsed.data.displayName,
      role: parsed.data.role,
      is_active: true,
    });

  if (profileError) {
    return {
      success: false,
      message: 'Utilizador convidado, mas houve erro ao definir perfil',
    };
  }

  revalidatePath('/admin/users');
  return { success: true, message: `Convite enviado para ${parsed.data.email}` };
}

export async function updateUserProfile(
  id: string,
  input: UpdateProfileInput,
): Promise<ActionResponse> {
  await requireAdmin();

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Dados de perfil inválidos',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('admin_profiles')
    .update({
      display_name: parsed.data.displayName,
      ...(parsed.data.role ? { role: parsed.data.role } : {}),
      ...(parsed.data.isActive !== undefined ? { is_active: parsed.data.isActive } : {}),
    })
    .eq('id', id);

  if (error) {
    return { success: false, message: error.message || 'Erro ao actualizar utilizador' };
  }

  revalidatePath('/admin/users');
  return { success: true, message: 'Perfil actualizado com sucesso' };
}

export async function toggleUserActive(
  id: string,
  isActive: boolean,
): Promise<ActionResponse> {
  const currentStaff = await requireAdmin();

  if (currentStaff.id === id && !isActive) {
    return {
      success: false,
      message: 'Não pode desactivar a sua própria conta de administrador',
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('admin_profiles')
    .update({ is_active: isActive })
    .eq('id', id);

  if (error) {
    return { success: false, message: 'Erro ao alterar estado do utilizador' };
  }

  revalidatePath('/admin/users');
  return {
    success: true,
    message: isActive ? 'Utilizador activado' : 'Utilizador desactivado',
  };
}

export async function changeUserPassword(
  input: ChangePasswordInput,
): Promise<ActionResponse> {
  await requireStaff();

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Dados inválidos',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { success: false, message: 'Sessão inválida' };
  }

  // Verify current password by attempting sign in
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });

  if (verifyError) {
    return {
      success: false,
      message: 'A palavra-passe actual está incorreta',
      errors: { currentPassword: ['Palavra-passe actual incorreta'] },
    };
  }

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (updateError) {
    return {
      success: false,
      message: updateError.message || 'Erro ao alterar palavra-passe',
    };
  }

  return { success: true, message: 'Palavra-passe alterada com sucesso' };
}
