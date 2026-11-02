'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { requireStaff } from '@/lib/auth/guard';
import { createClient } from '@/lib/supabase/server';
import {
  storyImageItemSchema,
  storySettingsSchema,
  type StoryImageItemInput,
  type StorySettingsInput,
} from '@/lib/validations/story';
import type { ActionResponse } from './categories';

const uuidSchema = z.string().uuid();

function revalidateStories() {
  revalidatePath('/');
  revalidatePath('/admin/stories');
}

export async function updateStorySettings(
  input: StorySettingsInput,
): Promise<ActionResponse> {
  const staff = await requireStaff();
  const parsed = storySettingsSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: 'Configuração inválida',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('story_settings')
    .update({
      enabled: parsed.data.enabled,
      mode: parsed.data.mode,
      interval_seconds: parsed.data.intervalSeconds,
      updated_by: staff.id,
    })
    .eq('id', 1);

  if (error) {
    return { success: false, message: error.message || 'Erro ao guardar configuração' };
  }

  revalidateStories();

  return { success: true, message: 'Configuração guardada' };
}

async function nextSortOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<number> {
  const { data } = await supabase
    .from('story_items')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  return typeof data?.sort_order === 'number' ? data.sort_order + 1 : 0;
}

export async function createStoryProductItem(
  productId: string,
): Promise<ActionResponse<{ id: string }>> {
  await requireStaff();

  const parsedId = uuidSchema.safeParse(productId);

  if (!parsedId.success) {
    return { success: false, message: 'Produto inválido' };
  }

  const supabase = await createClient();

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, name, status, image_path')
    .eq('id', parsedId.data)
    .maybeSingle();

  if (productError || !product) {
    return { success: false, message: 'Produto não encontrado' };
  }

  if (product.status !== 'published') {
    return { success: false, message: 'Só é possível adicionar produtos publicados' };
  }

  if (!product.image_path) {
    return { success: false, message: 'O produto precisa de ter uma fotografia' };
  }

  const { data: existing } = await supabase
    .from('story_items')
    .select('id')
    .eq('item_type', 'product')
    .eq('product_id', parsedId.data)
    .maybeSingle();

  if (existing) {
    return { success: false, message: 'Este produto já está nos stories' };
  }

  const { data: inserted, error } = await supabase
    .from('story_items')
    .insert({
      item_type: 'product',
      product_id: parsedId.data,
      sort_order: await nextSortOrder(supabase),
      is_active: true,
    })
    .select('id')
    .single();

  if (error || !inserted) {
    return { success: false, message: error?.message || 'Erro ao adicionar produto' };
  }

  revalidateStories();

  return {
    success: true,
    message: `"${product.name}" adicionado aos stories`,
    data: { id: inserted.id },
  };
}

export async function createStoryImageItem(
  input: StoryImageItemInput,
): Promise<ActionResponse<{ id: string }>> {
  await requireStaff();
  const parsed = storyImageItemSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: 'Dados da imagem inválidos',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  const { data: inserted, error } = await supabase
    .from('story_items')
    .insert({
      item_type: 'image',
      image_path: parsed.data.imagePath,
      image_alt: parsed.data.imageAlt,
      sort_order: await nextSortOrder(supabase),
      is_active: true,
    })
    .select('id')
    .single();

  if (error || !inserted) {
    return { success: false, message: error?.message || 'Erro ao adicionar imagem' };
  }

  revalidateStories();

  return {
    success: true,
    message: 'Imagem adicionada aos stories',
    data: { id: inserted.id },
  };
}

export async function updateStoryItemActive(
  id: string,
  isActive: boolean,
): Promise<ActionResponse> {
  await requireStaff();

  const parsedId = uuidSchema.safeParse(id);

  if (!parsedId.success || typeof isActive !== 'boolean') {
    return { success: false, message: 'Item inválido' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('story_items')
    .update({ is_active: isActive })
    .eq('id', parsedId.data);

  if (error) {
    return { success: false, message: 'Erro ao actualizar item' };
  }

  revalidateStories();

  return { success: true, message: isActive ? 'Item activado' : 'Item desactivado' };
}

export async function deleteStoryItem(id: string): Promise<ActionResponse> {
  await requireStaff();

  const parsedId = uuidSchema.safeParse(id);

  if (!parsedId.success) {
    return { success: false, message: 'Item inválido' };
  }

  const supabase = await createClient();

  const { data: item } = await supabase
    .from('story_items')
    .select('id, item_type, image_path')
    .eq('id', parsedId.data)
    .maybeSingle();

  if (!item) {
    return { success: false, message: 'Item não encontrado' };
  }

  const { error } = await supabase.from('story_items').delete().eq('id', parsedId.data);

  if (error) {
    return { success: false, message: 'Erro ao remover item' };
  }

  // Remoção do ficheiro é best-effort: o item já saiu da base de dados.
  if (item.item_type === 'image' && item.image_path) {
    await supabase.storage.from('menu-images').remove([item.image_path]);
  }

  revalidateStories();

  return { success: true, message: 'Item removido' };
}

export async function reorderStoryItems(ids: string[]): Promise<ActionResponse> {
  await requireStaff();

  const parsed = z.array(uuidSchema).min(1).max(200).safeParse(ids);

  if (!parsed.success) {
    return { success: false, message: 'Ordem inválida' };
  }

  const supabase = await createClient();

  for (let index = 0; index < parsed.data.length; index += 1) {
    const { error } = await supabase
      .from('story_items')
      .update({ sort_order: index })
      .eq('id', parsed.data[index]);

    if (error) {
      return { success: false, message: 'Erro ao guardar a nova ordem' };
    }
  }

  revalidateStories();

  return { success: true, message: 'Ordem actualizada' };
}
