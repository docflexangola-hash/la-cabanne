import { EmptyMenuState } from '@/components/menu/empty-menu-state';
import { MenuExperience } from '@/components/menu/menu-experience';
import { PublicHeader } from '@/components/menu/public-header';
import { getPublicMenu } from '@/lib/menu/queries';

export const revalidate = 300;

function countProducts(groups: { categories: { products: unknown[] }[] }[]): number {
  return groups.reduce(
    (total, group) =>
      total + group.categories.reduce((sum, category) => sum + category.products.length, 0),
    0,
  );
}

export default async function HomePage() {
  const menu = await getPublicMenu();
  const totalProducts = menu.status === 'ok' ? countProducts(menu.groups) : 0;

  if (menu.status === 'ok' && totalProducts > 0) {
    return <MenuExperience groups={menu.groups} settings={menu.settings} />;
  }

  // For preview - show sample data if no products
  if (menu.status === 'ok' && totalProducts === 0) {
    const sampleGroups = [
      {
        id: 'sample-1',
        name: 'Refeições',
        slug: 'refeicoes',
        displayOrder: 0,
        categories: [
          {
            id: 'sample-cat-1',
            name: 'Pratos Principais',
            slug: 'pratos-principais',
            displayOrder: 0,
            products: [
              {
                id: 'sample-p1',
                name: 'Frango Grelhado',
                slug: 'frango-grelhado',
                description: 'Frango grelhado ao carvão com batatas fritas e salada',
                basePrice: 4500,
                priceNote: null,
                imageUrl: '/images/placeholder.svg',
                imageAlt: 'Frango grelhado',
                tags: [],
                allergens: [],
                serves: '1 pessoa',
                status: 'published' as const,
                displayOrder: 0,
                variantGroups: [],
              },
              {
                id: 'sample-p2',
                name: 'Bife com Batata Frita',
                slug: 'bife-batata-frita',
                description: 'Bife de vaca grelhado com batata frita e feijão',
                basePrice: 5500,
                priceNote: null,
                imageUrl: '/images/placeholder.svg',
                imageAlt: 'Bife com batata frita',
                tags: [],
                allergens: [],
                serves: '1 pessoa',
                status: 'published' as const,
                displayOrder: 1,
                variantGroups: [],
              },
            ],
          },
        ],
      },
      {
        id: 'sample-2',
        name: 'Bebidas',
        slug: 'bebidas',
        displayOrder: 1,
        categories: [
          {
            id: 'sample-cat-2',
            name: 'Bebidas Frescas',
            slug: 'bebidas-frescas',
            displayOrder: 0,
            products: [
              {
                id: 'sample-p3',
                name: 'Sumo Natural de Laranja',
                slug: 'sumo-laranja',
                description: 'Sumo natural de laranja espremido na hora',
                basePrice: 800,
                priceNote: null,
                imageUrl: '/images/placeholder.svg',
                imageAlt: 'Sumo de laranja',
                tags: [],
                allergens: [],
                serves: null,
                status: 'published' as const,
                displayOrder: 0,
                variantGroups: [],
              },
              {
                id: 'sample-p4',
                name: 'Água Mineral',
                slug: 'agua-mineral',
                description: null,
                basePrice: 250,
                priceNote: null,
                imageUrl: '/images/placeholder.svg',
                imageAlt: 'Água mineral',
                tags: [],
                allergens: [],
                serves: null,
                status: 'published' as const,
                displayOrder: 1,
                variantGroups: [],
              },
            ],
          },
        ],
      },
    ];
    return <MenuExperience groups={sampleGroups as any} settings={menu.settings} />;
  }

  return (
    <div className="relative flex min-h-dvh flex-col">
      <div
        aria-hidden="true"
        className="texture-paper pointer-events-none absolute inset-0 opacity-[0.04]"
      />

      <div className="relative flex flex-1 flex-col">
        <PublicHeader />

        <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 pb-16 sm:px-6">
          <EmptyMenuState variant={menu.status === 'error' ? 'error' : 'preparing'} />
        </main>

        <footer className="border-t border-line">
          <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-1 px-4 py-6 text-xs text-ink-2 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>La Cabanne · Restaurante &amp; Lounge</p>
            <p>Benguela, Angola</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
