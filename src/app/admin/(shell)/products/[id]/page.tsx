import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductForm, type CategoryOption } from '@/components/admin/product-form';
import { requireStaff } from '@/lib/auth/guard';
import { createClient } from '@/lib/supabase/server';
import type { ProductInput, VariantGroupInput } from '@/lib/validations/product';

export const metadata: Metadata = { title: 'Editar Produto' };
export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage(props: PageProps) {
  await requireStaff();
  const { id } = await props.params;

  const supabase = await createClient();

  const [categoriesRes, productRes] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, menu_groups ( name )')
      .order('display_order'),
    supabase
      .from('products')
      .select(`
        *,
        variant_groups (
          id,
          name,
          display_order,
          is_required,
          product_variants (
            id,
            name,
            price,
            display_order,
            is_active
          )
        )
      `)
      .eq('id', id)
      .maybeSingle(),
  ]);

  if (!productRes.data) {
    notFound();
  }

  type RawCat = {
    id: string;
    name: string;
    menu_groups: { name: string } | null;
  };

  const categories: CategoryOption[] = ((categoriesRes.data as unknown as RawCat[]) || []).map(
    (c) => ({
      id: c.id,
      name: c.name,
      groupName: c.menu_groups?.name || 'Sem grupo',
    }),
  );

  const prod = productRes.data;

  type RawVariant = {
    id: string;
    name: string;
    price: number | string;
    display_order: number;
    is_active: boolean;
  };

  type RawVariantGroup = {
    id: string;
    name: string;
    display_order: number;
    is_required: boolean;
    product_variants: RawVariant[] | null;
  };

  const variantGroups: VariantGroupInput[] = ((prod.variant_groups as unknown as RawVariantGroup[]) || []).map((vg) => ({
    id: vg.id,
    name: vg.name,
    displayOrder: vg.display_order,
    isRequired: vg.is_required,
    variants: (vg.product_variants || []).map((pv) => ({
      id: pv.id,
      name: pv.name,
      price: Number(pv.price),
      displayOrder: pv.display_order,
      isActive: pv.is_active,
    })),
  }));

  const initialData: ProductInput & { id: string } = {
    id: prod.id,
    categoryId: prod.category_id,
    name: prod.name,
    slug: prod.slug,
    description: prod.description,
    basePrice: prod.base_price !== null ? Number(prod.base_price) : null,
    priceNote: prod.price_note,
    imagePath: prod.image_path,
    imageAlt: prod.image_alt,
    tags: prod.tags || [],
    allergens: prod.allergens || [],
    serves: prod.serves,
    status: prod.status,
    displayOrder: prod.display_order,
    variantGroups,
  };

  return <ProductForm initialData={initialData} categories={categories} />;
}
