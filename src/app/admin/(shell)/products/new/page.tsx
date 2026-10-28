import type { Metadata } from 'next';
import { ProductForm, type CategoryOption } from '@/components/admin/product-form';
import { requireStaff } from '@/lib/auth/guard';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Novo Produto' };
export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  await requireStaff();

  const supabase = await createClient();

  const { data: categoriesData } = await supabase
    .from('categories')
    .select(`
      id,
      name,
      menu_groups ( name )
    `)
    .eq('is_active', true)
    .order('display_order');

  type RawCat = {
    id: string;
    name: string;
    menu_groups: { name: string } | null;
  };

  const categories: CategoryOption[] = ((categoriesData as unknown as RawCat[]) || []).map(
    (c) => ({
      id: c.id,
      name: c.name,
      groupName: c.menu_groups?.name || 'Sem grupo',
    }),
  );

  return <ProductForm categories={categories} />;
}
