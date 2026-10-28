'use server';

import { revalidatePath } from 'next/cache';
import { requireStaff } from '@/lib/auth/guard';
import { createClient } from '@/lib/supabase/server';
import { categorySchema, type CategoryInput } from '@/lib/validations/category';

export type ActionResponse<T = unknown> = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: T;
};

export async function createCategory(input: CategoryInput): Promise<ActionResponse> {
  await requireStaff();

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Dados da categoria inválidos',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  // Check unique slug within group
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('group_id', parsed.data.groupId)
    .eq('slug', parsed.data.slug)
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      message: 'Já existe uma categoria com este slug neste grupo',
      errors: { slug: ['Slug já existente no grupo'] },
    };
  }

  const { error } = await supabase.from('categories').insert({
    group_id: parsed.data.groupId,
    name: parsed.data.name,
    slug: parsed.data.slug,
    display_order: parsed.data.displayOrder,
    is_active: parsed.data.isActive,
    image_path: parsed.data.imagePath || null,
  });

  if (error) {
    return {
      success: false,
      message: error.message || 'Erro ao criar categoria',
    };
  }

  revalidatePath('/');
  revalidatePath('/admin/categories');
  revalidatePath('/admin/products');

  return { success: true, message: 'Categoria criada com sucesso' };
}

export async function updateCategory(
  id: string,
  input: CategoryInput,
): Promise<ActionResponse> {
  await requireStaff();

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Dados da categoria inválidos',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  // Check unique slug within group (excluding current id)
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('group_id', parsed.data.groupId)
    .eq('slug', parsed.data.slug)
    .neq('id', id)
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      message: 'Já existe outra categoria com este slug neste grupo',
      errors: { slug: ['Slug já existente no grupo'] },
    };
  }

  const { error } = await supabase
    .from('categories')
    .update({
      group_id: parsed.data.groupId,
      name: parsed.data.name,
      slug: parsed.data.slug,
      display_order: parsed.data.displayOrder,
      is_active: parsed.data.isActive,
      image_path: parsed.data.imagePath || null,
    })
    .eq('id', id);

  if (error) {
    return {
      success: false,
      message: error.message || 'Erro ao actualizar categoria',
    };
  }

  revalidatePath('/');
  revalidatePath('/admin/categories');
  revalidatePath('/admin/products');

  return { success: true, message: 'Categoria actualizada com sucesso' };
}

export async function deleteCategory(id: string): Promise<ActionResponse> {
  await requireStaff();

  const supabase = await createClient();

  // Check if category has products
  const { count, error: countError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id);

  if (countError) {
    return { success: false, message: 'Erro ao verificar produtos associados' };
  }

  if (count && count > 0) {
    return {
      success: false,
      message: `Não é possível remover uma categoria com ${count} produto(s). Reatribua ou remova os produtos primeiro.`,
    };
  }

  const { error } = await supabase.from('categories').delete().eq('id', id);

  if (error) {
    return {
      success: false,
      message: error.message || 'Erro ao remover categoria',
    };
  }

  revalidatePath('/');
  revalidatePath('/admin/categories');
  revalidatePath('/admin/products');

  return { success: true, message: 'Categoria removida com sucesso' };
}

export async function toggleCategoryActive(
  id: string,
  isActive: boolean,
): Promise<ActionResponse> {
  await requireStaff();

  const supabase = await createClient();
  const { error } = await supabase
    .from('categories')
    .update({ is_active: isActive })
    .eq('id', id);

  if (error) {
    return { success: false, message: 'Erro ao alterar estado da categoria' };
  }

  revalidatePath('/');
  revalidatePath('/admin/categories');
  revalidatePath('/admin/products');

  return {
    success: true,
    message: isActive ? 'Categoria activada' : 'Categoria desactivada',
  };
}

export async function reorderCategories(
  items: { id: string; displayOrder: number }[],
): Promise<ActionResponse> {
  await requireStaff();

  const supabase = await createClient();

  const updates = items.map((item) =>
    supabase
      .from('categories')
      .update({ display_order: item.displayOrder })
      .eq('id', item.id),
  );

  const results = await Promise.all(updates);
  const hasError = results.some((r) => r.error);

  if (hasError) {
    return { success: false, message: 'Erro ao reordenar categorias' };
  }

  revalidatePath('/');
  revalidatePath('/admin/categories');

  return { success: true, message: 'Ordem actualizada com sucesso' };
}
