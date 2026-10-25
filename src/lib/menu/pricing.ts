import type { MenuProduct } from '@/types/menu';

/**
 * Preço de entrada apresentado na lista. Com variantes, é a soma do preço
 * mais baixo de cada grupo (normalmente existe apenas um grupo: o tamanho).
 */
export function getStartingPrice(product: MenuProduct): {
  amount: number | null;
  from: boolean;
} {
  const groups = product.variantGroups.filter((group) => group.variants.length > 0);

  if (groups.length > 0) {
    const amount = groups.reduce(
      (total, group) => total + Math.min(...group.variants.map((variant) => variant.price)),
      0,
    );

    const varies = groups.length > 1 || groups.some((group) => group.variants.length > 1);

    return { amount, from: varies };
  }

  if (product.basePrice !== null) {
    return { amount: product.basePrice, from: false };
  }

  return { amount: null, from: false };
}

/** Preço da configuração seleccionada no detalhe do produto. */
export function getSelectedPrice(
  product: MenuProduct,
  selection: Record<string, string>,
): number | null {
  const groups = product.variantGroups.filter((group) => group.variants.length > 0);

  if (groups.length > 0) {
    let total = 0;
    let hasSelection = false;

    for (const group of groups) {
      const selected =
        group.variants.find((variant) => variant.id === selection[group.id]) ?? group.variants[0];

      if (selected) {
        total += selected.price;
        hasSelection = true;
      }
    }

    if (hasSelection) {
      return total;
    }
  }

  return product.basePrice;
}

export function getPriceLabel(product: MenuProduct): string {
  const { amount, from } = getStartingPrice(product);

  if (amount !== null) {
    return `${from ? 'desde ' : ''}${amount}`;
  }

  return product.priceNote ?? 'Preço sob consulta';
}
