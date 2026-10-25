export type MenuProductStatus = 'published' | 'unavailable';

export type MenuVariant = {
  id: string;
  name: string;
  price: number;
  displayOrder: number;
};

export type MenuVariantGroup = {
  id: string;
  name: string;
  isRequired: boolean;
  displayOrder: number;
  variants: MenuVariant[];
};

export type MenuProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number | null;
  priceNote: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  tags: string[];
  allergens: string[];
  serves: string | null;
  status: MenuProductStatus;
  displayOrder: number;
  variantGroups: MenuVariantGroup[];
};

export type MenuCategory = {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
  products: MenuProduct[];
};

export type MenuGroup = {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
  categories: MenuCategory[];
};

export type WeekHours = Record<string, Array<[string, string]> | null>;

export type RestaurantSettings = {
  name: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  hours: WeekHours;
  instagram: string | null;
  infoMessage: string | null;
  isOpenOverride: boolean | null;
};

export type PublicMenuResult =
  | { status: 'ok'; groups: MenuGroup[]; settings: RestaurantSettings | null }
  | { status: 'unconfigured' }
  | { status: 'error' };
