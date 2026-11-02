import type { Metadata } from 'next';

import {
  StoriesManager,
  type AdminStoryItem,
  type StoryProductOption,
} from '@/components/admin/stories-manager';
import { requireStaff } from '@/lib/auth/guard';
import { isSupabaseConfigured } from '@/lib/env';
import { buildStorageImageUrl } from '@/lib/menu/format';
import { getPublicMenu } from '@/lib/menu/queries';
import { createClient } from '@/lib/supabase/server';
import type { MenuGroup } from '@/types/menu';
import type { StoryMode, StorySettings } from '@/types/stories';

export const metadata: Metadata = { title: 'Stories' };
export const dynamic = 'force-dynamic';

type SettingsRow = {
  enabled: boolean;
  mode: StoryMode;
  interval_seconds: number;
};

type ItemRow = {
  id: string;
  item_type: 'product' | 'image';
  product_id: string | null;
  image_path: string | null;
  image_alt: string | null;
  sort_order: number;
  is_active: boolean;
};

type RawProduct = {
  id: string;
  name: string;
  slug: string;
  image_path: string | null;
  image_alt: string | null;
  status: 'draft' | 'published' | 'unavailable' | 'archived';
  is_story_highlight: boolean;
  categories: {
    name: string;
    menu_groups: { name: string } | null;
  } | null;
};

const DEFAULT_SETTINGS: StorySettings = {
  enabled: false,
  mode: 'auto_all',
  intervalSeconds: 5,
};

export default async function StoriesPage() {
  await requireStaff();

  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-8 text-center">
        <p className="font-display text-2xl text-strong">Supabase não configurado</p>
        <p className="mt-2 text-sm text-ink-2">
          Configure as variáveis de ambiente no ficheiro .env.local para aceder à base de dados.
        </p>
      </div>
    );
  }

  const supabase = await createClient();

  const [settingsRes, itemsRes, productsRes, menu] = await Promise.all([
    supabase
      .from('story_settings')
      .select('enabled, mode, interval_seconds')
      .eq('id', 1)
      .maybeSingle(),
    supabase
      .from('story_items')
      .select('id, item_type, product_id, image_path, image_alt, sort_order, is_active')
      .order('sort_order'),
    supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        image_path,
        image_alt,
        status,
        is_story_highlight,
        categories (
          name,
          menu_groups ( name )
        )
      `)
      .order('display_order')
      .order('name'),
    getPublicMenu(),
  ]);

  if (settingsRes.error || itemsRes.error || productsRes.error) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl text-strong">Stories</h1>
        <div className="rounded-2xl border border-danger/25 bg-danger/5 p-6">
          <p className="font-display text-xl text-strong">Migração em falta</p>
          <p className="mt-2 text-sm text-ink-2">
            Aplique <code className="rounded bg-surface-2 px-1.5 py-0.5">0009_stories.sql</code>{' '}
            no Supabase para ativar a gestão de stories.
          </p>
          <p className="mt-2 text-xs text-danger">
            {settingsRes.error?.message || itemsRes.error?.message || productsRes.error?.message}
          </p>
        </div>
      </div>
    );
  }

  const productRows = (productsRes.data as unknown as RawProduct[]) ?? [];

  const allProducts = productRows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    isStoryHighlight: Boolean(row.is_story_highlight),
    imageUrl: buildStorageImageUrl(row.image_path),
    imageAlt: row.image_alt,
    groupName: row.categories?.menu_groups?.name ?? 'Sem grupo',
    categoryName: row.categories?.name ?? 'Sem categoria',
  }));

  const productById = new Map(allProducts.map((product) => [product.id, product]));

  const settingsRow = settingsRes.data as SettingsRow | null;
  const settings: StorySettings = settingsRow
    ? {
        enabled: settingsRow.enabled,
        mode: settingsRow.mode,
        intervalSeconds: settingsRow.interval_seconds,
      }
    : DEFAULT_SETTINGS;

  const items: AdminStoryItem[] = ((itemsRes.data ?? []) as ItemRow[]).map((row) => {
    const product = row.product_id ? productById.get(row.product_id) : undefined;

    return {
      id: row.id,
      itemType: row.item_type,
      productId: row.product_id,
      imagePath: row.image_path,
      imageUrl:
        row.item_type === 'image'
          ? buildStorageImageUrl(row.image_path)
          : (product?.imageUrl ?? null),
      imageAlt: row.image_alt ?? product?.imageAlt ?? null,
      sortOrder: row.sort_order,
      isActive: row.is_active,
      productName: product?.name ?? (row.product_id ? 'Produto removido' : null),
      groupName: product?.groupName ?? null,
      categoryName: product?.categoryName ?? null,
    };
  });

  const products: StoryProductOption[] = allProducts
    .filter(
      (product): product is typeof product & { imageUrl: string } =>
        product.status === 'published' && Boolean(product.imageUrl),
    )
    .map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      imageUrl: product.imageUrl,
      imageAlt: product.imageAlt ?? product.name,
      groupName: product.groupName,
      categoryName: product.categoryName,
      isStoryHighlight: product.isStoryHighlight,
    }));

  const highlightCount = products.filter((product) => product.isStoryHighlight).length;
  const menuGroups: MenuGroup[] = menu.status === 'ok' ? menu.groups : [];

  return (
    <StoriesManager
      initialSettings={settings}
      initialItems={items}
      products={products}
      menuGroups={menuGroups}
      highlightCount={highlightCount}
    />
  );
}
