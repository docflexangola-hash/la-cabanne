import type { Metadata } from 'next';
import {
  ProductsManager,
  type ProductTableRow,
} from '@/components/admin/products-manager';
import { requireStaff } from '@/lib/auth/guard';
import { isSupabaseConfigured } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Produtos' };
export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  await requireStaff();

  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center">
        <p className="font-display text-2xl text-deep">Supabase não configurado</p>
        <p className="mt-2 text-sm text-ink-2">
          Configure as variáveis de ambiente no ficheiro .env.local para aceder à base de dados.
        </p>
      </div>
    );
  }

  const supabase = await createClient();

  const [groupsRes, categoriesRes, productsRes] = await Promise.all([
    supabase.from('menu_groups').select('id, name').order('display_order'),
    supabase.from('categories').select('id, name, group_id').order('display_order'),
    supabase
      .from('products')
      .select(`
        id,
        category_id,
        name,
        slug,
        base_price,
        price_note,
        status,
        display_order,
        image_path,
        published_at,
        categories (
          id,
          name,
          group_id,
          menu_groups ( id, name )
        ),
        variant_groups ( id )
      `)
      .order('display_order')
      .order('name'),
  ]);

  const groups = (groupsRes.data || []).map((g) => ({ id: g.id, name: g.name }));
  const categories = (categoriesRes.data || []).map((c) => ({
    id: c.id,
    name: c.name,
    groupId: c.group_id,
  }));

  type RawProduct = {
    id: string;
    category_id: string;
    name: string;
    slug: string;
    base_price: number | string | null;
    price_note: string | null;
    status: ProductTableRow['status'];
    display_order: number;
    image_path: string | null;
    published_at: string | null;
    categories: {
      id: string;
      name: string;
      group_id: string;
      menu_groups: { id: string; name: string } | null;
    } | null;
    variant_groups: { id: string }[] | null;
  };

  const products: ProductTableRow[] = ((productsRes.data as unknown as RawProduct[]) || []).map(
    (p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      categoryName: p.categories?.name || 'Sem categoria',
      groupName: p.categories?.menu_groups?.name || 'Sem grupo',
      categoryId: p.category_id,
      groupId: p.categories?.group_id || '',
      basePrice: p.base_price !== null ? Number(p.base_price) : null,
      priceNote: p.price_note,
      status: p.status,
      displayOrder: p.display_order,
      hasImage: Boolean(p.image_path),
      variantsCount: Array.isArray(p.variant_groups) ? p.variant_groups.length : 0,
      publishedAt: p.published_at,
    }),
  );

  return (
    <ProductsManager
      initialProducts={products}
      groups={groups}
      categories={categories}
    />
  );
}
