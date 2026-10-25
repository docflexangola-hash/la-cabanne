export type MenuGroupSummary = {
  slug: string;
  name: string;
};

/**
 * Espelho dos grupos definidos no seed (supabase/seed.sql).
 * Usado apenas como fallback visual enquanto o Supabase não está configurado.
 */
export const MENU_GROUPS: MenuGroupSummary[] = [
  { slug: 'refeicoes', name: 'Refeições' },
  { slug: 'sushi', name: 'Sushi' },
  { slug: 'bebidas', name: 'Bebidas' },
];
