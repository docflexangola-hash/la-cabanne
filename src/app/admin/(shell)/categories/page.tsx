import type { Metadata } from 'next';
import { CategoriesManager, type CategoryRowData, type GroupOption } from '@/components/admin/categories-manager';
import { requireStaff } from '@/lib/auth/guard';
import { isSupabaseConfigured } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Categorias' };
export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
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

  // Fetch groups
  const { data: groupsData } = await supabase
    .from('menu_groups')
    .select('id, name, slug, display_order')
    .order('display_order');

  const groups: GroupOption[] = (groupsData || []).map((g) => ({
    id: g.id,
    name: g.name,
    slug: g.slug,
  }));

  // Fetch categories with product count
  const { data: categoriesData } = await supabase
    .from('categories')
    .select(`
      id,
      group_id,
      name,
      slug,
      display_order,
      is_active,
      image_path,
      menu_groups ( name, slug ),
      products ( count )
    `)
    .order('display_order');

  type FetchedCat = {
    id: string;
    group_id: string;
    name: string;
    slug: string;
    display_order: number;
    is_active: boolean;
    image_path: string | null;
    menu_groups: { name: string; slug: string } | null;
    products: { count: number }[];
  };

  const categories: CategoryRowData[] = ((categoriesData as unknown as FetchedCat[]) || []).map((cat) => {
    const productCount = Array.isArray(cat.products) && cat.products[0] ? cat.products[0].count : 0;
    return {
      id: cat.id,
      groupId: cat.group_id,
      groupName: cat.menu_groups?.name || 'Sem grupo',
      groupSlug: cat.menu_groups?.slug || '',
      name: cat.name,
      slug: cat.slug,
      displayOrder: cat.display_order,
      isActive: cat.is_active,
      imagePath: cat.image_path,
      productCount,
    };
  });

  return <CategoriesManager initialCategories={categories} groups={groups} />;
}
