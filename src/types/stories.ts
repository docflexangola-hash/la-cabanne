import type { MenuProduct } from './menu';

export type StoryMode = 'manual' | 'auto_all' | 'auto_highlight';

export type StorySettings = {
  enabled: boolean;
  mode: StoryMode;
  intervalSeconds: number;
};

export type StoryItemType = 'product' | 'image';

export type StoryConfigItem = {
  id: string;
  itemType: StoryItemType;
  productId: string | null;
  imagePath: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type StoryConfig = {
  settings: StorySettings;
  items: StoryConfigItem[];
};

export type StorySlide = {
  /** Chave estável usada no analytics e como `key` do React. */
  key: string;
  imageUrl: string;
  alt: string;
  product: MenuProduct | null;
  groupSlug: string | null;
  categorySlug: string | null;
};
