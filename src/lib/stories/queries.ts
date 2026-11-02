import { isSupabaseConfigured } from '@/lib/env';
import { buildStorageImageUrl } from '@/lib/menu/format';
import { createPublicClient } from '@/lib/supabase/public';
import type { StoryConfig, StoryConfigItem, StoryMode, StorySettings } from '@/types/stories';

const DEFAULT_SETTINGS: StorySettings = {
  enabled: false,
  mode: 'auto_all',
  intervalSeconds: 5,
};

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

function mapItem(row: ItemRow): StoryConfigItem {
  return {
    id: row.id,
    itemType: row.item_type,
    productId: row.product_id,
    imagePath: row.image_path,
    imageUrl: row.item_type === 'image' ? buildStorageImageUrl(row.image_path) : null,
    imageAlt: row.image_alt,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

/**
 * Configuração pública do widget. Falha em silêncio (widget desligado)
 * quando a migração 0009 ainda não foi aplicada ou o Supabase não está configurado.
 */
export async function getPublicStoryConfig(): Promise<StoryConfig> {
  const fallback: StoryConfig = { settings: DEFAULT_SETTINGS, items: [] };

  if (!isSupabaseConfigured()) {
    return fallback;
  }

  try {
    const supabase = createPublicClient();

    const [settingsResult, itemsResult] = await Promise.all([
      supabase
        .from('story_settings')
        .select('enabled, mode, interval_seconds')
        .eq('id', 1)
        .maybeSingle(),
      supabase
        .from('story_items')
        .select('id, item_type, product_id, image_path, image_alt, sort_order, is_active')
        .eq('is_active', true)
        .order('sort_order'),
    ]);

    if (settingsResult.error || itemsResult.error) {
      return fallback;
    }

    const settingsRow = settingsResult.data as SettingsRow | null;

    if (!settingsRow) {
      return fallback;
    }

    return {
      settings: {
        enabled: settingsRow.enabled,
        mode: settingsRow.mode,
        intervalSeconds: settingsRow.interval_seconds,
      },
      items: ((itemsResult.data ?? []) as ItemRow[]).map(mapItem),
    };
  } catch {
    return fallback;
  }
}
