import type { MenuGroup, MenuProduct } from '@/types/menu';
import type { StoryConfig, StorySlide } from '@/types/stories';

type BuildOptions = {
  /** Baralha dentro de cada grupo (modos automáticos). */
  shuffle?: boolean;
  /** Semente determinística para o baralhamento no cliente. */
  seed?: number;
};

type ProductLocation = {
  product: MenuProduct;
  groupSlug: string;
  categorySlug: string;
};

function findProduct(groups: MenuGroup[], productId: string): ProductLocation | null {
  for (const group of groups) {
    for (const category of group.categories) {
      const product = category.products.find((item) => item.id === productId);

      if (product) {
        return { product, groupSlug: group.slug, categorySlug: category.slug };
      }
    }
  }

  return null;
}

function productSlide(location: ProductLocation): StorySlide {
  return {
    key: `product:${location.product.id}`,
    imageUrl: location.product.imageUrl as string,
    alt: location.product.imageAlt ?? location.product.name,
    product: location.product,
    groupSlug: location.groupSlug,
    categorySlug: location.categorySlug,
  };
}

function mulberry32(seed: number) {
  let a = seed >>> 0;

  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], seed: number): T[] {
  const result = [...items];
  const random = mulberry32(seed || 1);

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function interleaveByGroup(lists: StorySlide[][]): StorySlide[] {
  const result: StorySlide[] = [];
  let position = 0;
  let hasMore = true;

  while (hasMore) {
    hasMore = false;

    for (const list of lists) {
      if (position < list.length) {
        result.push(list[position]);
        hasMore = true;
      }
    }

    position += 1;
  }

  return result;
}

function collectAutomatic(
  groups: MenuGroup[],
  predicate: (product: MenuProduct) => boolean,
  options: BuildOptions,
): StorySlide[] {
  const lists: StorySlide[][] = [];

  groups.forEach((group, groupIndex) => {
    const slides = group.categories.flatMap((category) =>
      category.products
        .filter((product) => product.status === 'published' && Boolean(product.imageUrl))
        .filter(predicate)
        .map((product) =>
          productSlide({
            product,
            groupSlug: group.slug,
            categorySlug: category.slug,
          }),
        ),
    );

    if (slides.length > 0) {
      lists.push(
        options.shuffle
          ? shuffle(slides, (options.seed ?? 0) + groupIndex * 101 + 1)
          : slides,
      );
    }
  });

  return interleaveByGroup(lists);
}

function collectManual(groups: MenuGroup[], config: StoryConfig): StorySlide[] {
  const sorted = [...config.items].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id),
  );

  const slides: StorySlide[] = [];

  for (const item of sorted) {
    if (!item.isActive) {
      continue;
    }

    if (item.itemType === 'product') {
      if (!item.productId) {
        continue;
      }

      const location = findProduct(groups, item.productId);

      if (
        !location ||
        location.product.status !== 'published' ||
        !location.product.imageUrl
      ) {
        continue;
      }

      slides.push(productSlide(location));
      continue;
    }

    if (!item.imageUrl) {
      continue;
    }

    slides.push({
      key: `item:${item.id}`,
      imageUrl: item.imageUrl,
      alt: item.imageAlt ?? 'Story',
      product: null,
      groupSlug: null,
      categorySlug: null,
    });
  }

  return slides;
}

/**
 * Constrói a lista de slides a partir do menu já carregado.
 * A mesma função alimenta o widget público e a pré-visualização do admin.
 */
export function buildStorySlides(
  groups: MenuGroup[],
  config: StoryConfig,
  options: BuildOptions = {},
): StorySlide[] {
  if (config.settings.mode === 'manual') {
    return collectManual(groups, config);
  }

  if (config.settings.mode === 'auto_highlight') {
    const highlights = collectAutomatic(groups, (product) => product.isStoryHighlight, options);

    if (highlights.length > 0) {
      return highlights;
    }

    return collectAutomatic(groups, () => true, options);
  }

  return collectAutomatic(groups, () => true, options);
}
