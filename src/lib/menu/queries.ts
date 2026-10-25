import { buildStorageImageUrl } from '@/lib/menu/format';
import { isSupabaseConfigured } from '@/lib/env';
import { createPublicClient } from '@/lib/supabase/public';
import type {
  MenuCategory,
  MenuGroup,
  MenuProduct,
  MenuProductStatus,
  MenuVariantGroup,
  PublicMenuResult,
  RestaurantSettings,
  WeekHours,
} from '@/types/menu';

type GroupRow = {
  id: string;
  name: string;
  slug: string;
  display_order: number;
};

type CategoryRow = {
  id: string;
  group_id: string;
  name: string;
  slug: string;
  display_order: number;
};

type VariantRow = {
  id: string;
  name: string;
  price: number | string;
  display_order: number;
  is_active: boolean;
};

type VariantGroupRow = {
  id: string;
  name: string;
  display_order: number;
  is_required: boolean;
  product_variants: VariantRow[] | null;
};

type ProductRow = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number | string | null;
  price_note: string | null;
  image_path: string | null;
  image_alt: string | null;
  tags: string[] | null;
  allergens: string[] | null;
  serves: string | null;
  status: MenuProductStatus;
  display_order: number;
  variant_groups: VariantGroupRow[] | null;
};

type SettingsRow = {
  name: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  hours: unknown;
  socials: unknown;
  info_message: string | null;
  is_open_override: boolean | null;
};

function byOrderThenName<T extends { displayOrder: number; name: string }>(a: T, b: T) {
  return a.displayOrder - b.displayOrder || a.name.localeCompare(b.name, 'pt');
}

function parsePrice(value: number | string | null): number | null {
  if (value === null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseHours(value: unknown): WeekHours {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const hours: WeekHours = {};

  for (const [day, intervals] of Object.entries(value as Record<string, unknown>)) {
    if (!Array.isArray(intervals)) {
      hours[day] = null;
      continue;
    }

    const parsed = intervals.flatMap((interval) => {
      if (!Array.isArray(interval) || interval.length < 2) {
        return [];
      }

      const [from, to] = interval;

      if (typeof from !== 'string' || typeof to !== 'string') {
        return [];
      }

      return [[from, to] as [string, string]];
    });

    hours[day] = parsed.length > 0 ? parsed : null;
  }

  return hours;
}

function parseInstagram(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const instagram = (value as Record<string, unknown>).instagram;
  return typeof instagram === 'string' && instagram.trim() ? instagram.trim() : null;
}

function mapSettings(row: SettingsRow | null): RestaurantSettings | null {
  if (!row) {
    return null;
  }

  return {
    name: row.name,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    address: row.address,
    hours: parseHours(row.hours),
    instagram: parseInstagram(row.socials),
    infoMessage: row.info_message,
    isOpenOverride: row.is_open_override,
  };
}

function mapProduct(row: ProductRow): MenuProduct {
  const variantGroups: MenuVariantGroup[] = (row.variant_groups ?? [])
    .map((group) => ({
      id: group.id,
      name: group.name,
      isRequired: group.is_required,
      displayOrder: group.display_order,
      variants: (group.product_variants ?? [])
        .filter((variant) => variant.is_active)
        .map((variant) => ({
          id: variant.id,
          name: variant.name,
          price: parsePrice(variant.price) ?? 0,
          displayOrder: variant.display_order,
        }))
        .sort(byOrderThenName),
    }))
    .filter((group) => group.variants.length > 0)
    .sort(byOrderThenName);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    basePrice: parsePrice(row.base_price),
    priceNote: row.price_note,
    imageUrl: buildStorageImageUrl(row.image_path),
    imageAlt: row.image_alt,
    tags: row.tags ?? [],
    allergens: row.allergens ?? [],
    serves: row.serves,
    status: row.status,
    displayOrder: row.display_order,
    variantGroups,
  };
}

export async function getPublicMenu(): Promise<PublicMenuResult> {
  if (!isSupabaseConfigured()) {
    return { status: 'unconfigured' };
  }

  const supabase = createPublicClient();

  const [groupsResult, categoriesResult, productsResult, settingsResult] = await Promise.all([
    supabase
      .from('menu_groups')
      .select('id, name, slug, display_order')
      .eq('is_active', true)
      .order('display_order')
      .order('name'),
    supabase
      .from('categories')
      .select('id, group_id, name, slug, display_order')
      .eq('is_active', true)
      .order('display_order')
      .order('name'),
    supabase
      .from('products')
      .select(
        `id, category_id, name, slug, description, base_price, price_note,
         image_path, image_alt, tags, allergens, serves, status, display_order,
         variant_groups (
           id, name, display_order, is_required,
           product_variants ( id, name, price, display_order, is_active )
         )`,
      )
      .in('status', ['published', 'unavailable'])
      .order('display_order')
      .order('name'),
    supabase
      .from('restaurant_settings')
      .select(
        'name, phone, whatsapp, email, address, hours, socials, info_message, is_open_override',
      )
      .eq('id', 1)
      .maybeSingle(),
  ]);

  if (groupsResult.error || categoriesResult.error || productsResult.error) {
    return { status: 'error' };
  }

  const groupRows = (groupsResult.data ?? []) as GroupRow[];
  const categoryRows = (categoriesResult.data ?? []) as CategoryRow[];
  const productRows = ((productsResult.data ?? []) as ProductRow[]).filter(
    (row) => row.status === 'published' || row.status === 'unavailable',
  );

  const productsByCategory = new Map<string, MenuProduct[]>();

  for (const row of productRows) {
    const list = productsByCategory.get(row.category_id) ?? [];
    list.push(mapProduct(row));
    productsByCategory.set(row.category_id, list);
  }

  const categoriesByGroup = new Map<string, MenuCategory[]>();

  for (const row of categoryRows) {
    const list = categoriesByGroup.get(row.group_id) ?? [];

    list.push({
      id: row.id,
      name: row.name,
      slug: row.slug,
      displayOrder: row.display_order,
      products: (productsByCategory.get(row.id) ?? []).sort(byOrderThenName),
    });

    categoriesByGroup.set(row.group_id, list);
  }

  const groups: MenuGroup[] = groupRows
    .map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      displayOrder: row.display_order,
      categories: (categoriesByGroup.get(row.id) ?? []).sort(byOrderThenName),
    }))
    .filter((group) => group.categories.length > 0)
    .sort(byOrderThenName);

  return {
    status: 'ok',
    groups,
    settings: mapSettings((settingsResult.data ?? null) as SettingsRow | null),
  };
}
