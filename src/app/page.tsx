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
