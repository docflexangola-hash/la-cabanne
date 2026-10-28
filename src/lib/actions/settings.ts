'use server';

import { revalidatePath } from 'next/cache';
import { requireStaff } from '@/lib/auth/guard';
import { createClient } from '@/lib/supabase/server';
import {
  restaurantSettingsSchema,
  type RestaurantSettingsInput,
} from '@/lib/validations/settings';
import type { ActionResponse } from './categories';

export async function updateRestaurantSettings(
  input: RestaurantSettingsInput,
): Promise<ActionResponse> {
  const staff = await requireStaff();

  const parsed = restaurantSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Dados de configurações inválidos',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  const socials = parsed.data.instagram
    ? { instagram: parsed.data.instagram }
    : {};

  const { error } = await supabase
    .from('restaurant_settings')
    .upsert(
      {
        id: 1,
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        whatsapp: parsed.data.whatsapp || null,
        email: parsed.data.email || null,
        address: parsed.data.address || null,
        hours: parsed.data.hours || {},
        socials,
        info_message: parsed.data.infoMessage || null,
        is_open_override:
          parsed.data.isOpenOverride === undefined
            ? null
            : parsed.data.isOpenOverride,
        updated_by: staff.id,
      },
      { onConflict: 'id' },
    );

  if (error) {
    return {
      success: false,
      message: error.message || 'Erro ao guardar configurações',
    };
  }

  revalidatePath('/');
  revalidatePath('/admin/settings');
  revalidatePath('/admin/dashboard');

  return { success: true, message: 'Configurações guardadas com sucesso' };
}

export async function toggleOpenOverride(
  override: boolean | null,
): Promise<ActionResponse> {
  const staff = await requireStaff();
  const supabase = await createClient();

  const { error } = await supabase
    .from('restaurant_settings')
    .update({
      is_open_override: override,
      updated_by: staff.id,
    })
    .eq('id', 1);

  if (error) {
    return { success: false, message: 'Erro ao alterar estado de abertura' };
  }

  revalidatePath('/');
  revalidatePath('/admin/settings');
  revalidatePath('/admin/dashboard');

  let label = 'Horário automático restaurado';
  if (override === true) label = 'Restaurante forçado para Aberto';
  if (override === false) label = 'Restaurante forçado para Fechado';

  return { success: true, message: label };
}
