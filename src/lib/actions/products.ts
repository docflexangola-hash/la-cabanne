'use server';

import { revalidatePath } from 'next/cache';
import { requireStaff } from '@/lib/auth/guard';
import { createClient } from '@/lib/supabase/server';
import {
  productSchema,
  type ProductInput,
  type VariantGroupInput,
} from '@/lib/validations/product';
import type { ActionResponse } from './categories';

export async function createProduct(input: ProductInput): Promise<ActionResponse<{ id: string }>> {
  const staff = await requireStaff();

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Dados do produto inválidos',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  // Check unique slug within category
  const { data: existing } = await supabase
    .from('products')
    .select('id')
    .eq('category_id', parsed.data.categoryId)
    .eq('slug', parsed.data.slug)
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      message: 'Já existe um produto com este slug nesta categoria',
      errors: { slug: ['Slug já existente na categoria'] },
    };
  }

  const publishedAt =
    parsed.data.status === 'published' ? new Date().toISOString() : null;

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      category_id: parsed.data.categoryId,
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      base_price: parsed.data.basePrice ?? null,
      price_note: parsed.data.priceNote || null,
      image_path: parsed.data.imagePath || null,
      image_alt: parsed.data.imageAlt || null,
      tags: parsed.data.tags || [],
      allergens: parsed.data.allergens || [],
      serves: parsed.data.serves || null,
      status: parsed.data.status,
      display_order: parsed.data.displayOrder,
      published_at: publishedAt,
      created_by: staff.id,
      updated_by: staff.id,
    })
    .select('id')
    .single();

  if (error || !product) {
    return {
      success: false,
      message: error?.message || 'Erro ao criar produto',
    };
  }

  // Insert variant groups & options if any
  if (parsed.data.variantGroups && parsed.data.variantGroups.length > 0) {
    await saveVariantGroups(supabase, product.id, parsed.data.variantGroups);
  }

  revalidatePath('/');
  revalidatePath('/admin/products');
  revalidatePath('/admin/categories');

  return {
    success: true,
    message: 'Produto criado com sucesso',
    data: { id: product.id },
  };
}

export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<ActionResponse> {
  const staff = await requireStaff();

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Dados do produto inválidos',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  // Check unique slug within category (excluding current)
  const { data: existing } = await supabase
    .from('products')
    .select('id')
    .eq('category_id', parsed.data.categoryId)
    .eq('slug', parsed.data.slug)
    .neq('id', id)
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      message: 'Já existe outro produto com este slug nesta categoria',
      errors: { slug: ['Slug já existente na categoria'] },
    };
  }

  // Check current published_at
  const { data: current } = await supabase
    .from('products')
    .select('published_at, status')
    .eq('id', id)
    .single();

  let publishedAt = current?.published_at;
  if (parsed.data.status === 'published' && !publishedAt) {
    publishedAt = new Date().toISOString();
  }

  const { error } = await supabase
    .from('products')
    .update({
      category_id: parsed.data.categoryId,
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      base_price: parsed.data.basePrice ?? null,
      price_note: parsed.data.priceNote || null,
      image_path: parsed.data.imagePath || null,
      image_alt: parsed.data.imageAlt || null,
      tags: parsed.data.tags || [],
      allergens: parsed.data.allergens || [],
      serves: parsed.data.serves || null,
      status: parsed.data.status,
      display_order: parsed.data.displayOrder,
      published_at: publishedAt,
      updated_by: staff.id,
    })
    .eq('id', id);

  if (error) {
    return {
      success: false,
      message: error.message || 'Erro ao actualizar produto',
    };
  }

  // Update variant groups & options
  // Strategy: delete existing and re-insert or sync
  await supabase.from('variant_groups').delete().eq('product_id', id);
  if (parsed.data.variantGroups && parsed.data.variantGroups.length > 0) {
    await saveVariantGroups(supabase, id, parsed.data.variantGroups);
  }

  revalidatePath('/');
  revalidatePath('/admin/products');
  revalidatePath('/admin/categories');

  return { success: true, message: 'Produto actualizado com sucesso' };
}

async function saveVariantGroups(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  groups: VariantGroupInput[],
) {
  for (const group of groups) {
    const { data: insertedGroup, error: groupError } = await supabase
      .from('variant_groups')
      .insert({
        product_id: productId,
        name: group.name,
        display_order: group.displayOrder,
        is_required: group.isRequired,
      })
      .select('id')
      .single();

    if (groupError || !insertedGroup) continue;

    const variantsToInsert = group.variants.map((v) => ({
      group_id: insertedGroup.id,
      name: v.name,
      price: v.price,
      display_order: v.displayOrder,
      is_active: v.isActive,
    }));

    await supabase.from('product_variants').insert(variantsToInsert);
  }
}

export async function deleteProduct(id: string): Promise<ActionResponse> {
  await requireStaff();

  const supabase = await createClient();
  const { error } = await supabase.from('products').delete().eq('id', id);

  if (error) {
    return {
      success: false,
      message: error.message || 'Erro ao remover produto',
    };
  }

  revalidatePath('/');
  revalidatePath('/admin/products');

  return { success: true, message: 'Produto removido com sucesso' };
}

export async function updateProductStatus(
  id: string,
  status: 'draft' | 'published' | 'unavailable' | 'archived',
): Promise<ActionResponse> {
  const staff = await requireStaff();
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    status,
    updated_by: staff.id,
  };

  if (status === 'published') {
    const { data: curr } = await supabase
      .from('products')
      .select('published_at')
      .eq('id', id)
      .single();

    if (!curr?.published_at) {
      updateData.published_at = new Date().toISOString();
    }
  }

  const { error } = await supabase.from('products').update(updateData).eq('id', id);

  if (error) {
    return { success: false, message: 'Erro ao actualizar estado do produto' };
  }

  revalidatePath('/');
  revalidatePath('/admin/products');

  return { success: true, message: 'Estado do produto actualizado' };
}

export async function bulkUpdateProductStatus(
  ids: string[],
  status: 'draft' | 'published' | 'unavailable' | 'archived',
): Promise<ActionResponse> {
  const staff = await requireStaff();
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    status,
    updated_by: staff.id,
  };

  if (status === 'published') {
    updateData.published_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('products')
    .update(updateData)
    .in('id', ids);

  if (error) {
    return { success: false, message: 'Erro ao actualizar produtos em massa' };
  }

  revalidatePath('/');
  revalidatePath('/admin/products');

  return {
    success: true,
    message: `${ids.length} produto(s) actualizado(s) para ${status}`,
  };
}

export async function duplicateProduct(id: string): Promise<ActionResponse<{ newId: string }>> {
  const staff = await requireStaff();
  const supabase = await createClient();

  // Fetch product with variants
  const { data: original, error: fetchError } = await supabase
    .from('products')
    .select(`
      *,
      variant_groups (
        name, display_order, is_required,
        product_variants ( name, price, display_order, is_active )
      )
    `)
    .eq('id', id)
    .single();

  if (fetchError || !original) {
    return { success: false, message: 'Produto não encontrado para duplicação' };
  }

  const baseSlug = `${original.slug}-copia`;
  let uniqueSlug = baseSlug;
  let counter = 1;

  while (true) {
    const { data: exists } = await supabase
      .from('products')
      .select('id')
      .eq('category_id', original.category_id)
      .eq('slug', uniqueSlug)
      .maybeSingle();

    if (!exists) break;
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }

  const { data: newProd, error: insertError } = await supabase
    .from('products')
    .insert({
      category_id: original.category_id,
      name: `${original.name} (Cópia)`,
      slug: uniqueSlug,
      description: original.description,
      base_price: original.base_price,
      price_note: original.price_note,
      image_path: original.image_path,
      image_alt: original.image_alt,
      tags: original.tags || [],
      allergens: original.allergens || [],
      serves: original.serves,
      status: 'draft',
      display_order: original.display_order + 1,
      published_at: null,
      created_by: staff.id,
      updated_by: staff.id,
    })
    .select('id')
    .single();

  if (insertError || !newProd) {
    return { success: false, message: 'Erro ao duplicar produto' };
  }

  // Copy variant groups
  if (original.variant_groups && original.variant_groups.length > 0) {
    const mappedGroups: VariantGroupInput[] = original.variant_groups.map((vg: {
      name: string;
      display_order: number;
      is_required: boolean;
      product_variants: { name: string; price: number; display_order: number; is_active: boolean }[];
    }) => ({
      name: vg.name,
      displayOrder: vg.display_order,
      isRequired: vg.is_required,
      variants: (vg.product_variants || []).map((pv) => ({
        name: pv.name,
        price: Number(pv.price),
        displayOrder: pv.display_order,
        isActive: pv.is_active,
      })),
    }));

    await saveVariantGroups(supabase, newProd.id, mappedGroups);
  }

  revalidatePath('/');
  revalidatePath('/admin/products');

  return {
    success: true,
    message: 'Produto duplicado como rascunho',
    data: { newId: newProd.id },
  };
}
