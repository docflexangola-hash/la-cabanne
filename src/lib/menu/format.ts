const PRICE_FORMATTER = new Intl.NumberFormat('pt-PT', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Formata um valor em kwanzas: 4500 → "4 500 Kz". */
export function formatKz(value: number): string {
  return `${PRICE_FORMATTER.format(value)}\u00A0Kz`;
}

/**
 * Normaliza texto para pesquisa: minúsculas, sem diacríticos,
 * espaços colapsados.
 */
export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Constrói a URL pública de uma imagem no bucket `menu-images`. */
export function buildStorageImageUrl(path: string | null): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!path || !base) {
    return null;
  }

  return `${base.replace(/\/$/, '')}/storage/v1/object/public/menu-images/${path.replace(/^\//, '')}`;
}
