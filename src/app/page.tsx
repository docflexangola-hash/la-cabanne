import Link from 'next/link';
import { Lock } from 'lucide-react';

import { EmptyMenuState } from '@/components/menu/empty-menu-state';
import { HeroWelcome } from '@/components/menu/hero-welcome';
import { MenuExperience } from '@/components/menu/menu-experience';
import { PublicHeader } from '@/components/menu/public-header';
import { DOCFLEX_LINKTREE_URL } from '@/lib/constants/site';
import { getPublicMenu } from '@/lib/menu/queries';
import { getPublicStoryConfig } from '@/lib/stories/queries';

export const revalidate = 300;

function countProducts(groups: { categories: { products: unknown[] }[] }[]): number {
  return groups.reduce(
    (total, group) =>
      total + group.categories.reduce((sum, category) => sum + category.products.length, 0),
    0,
  );
}

export default async function HomePage() {
  const [menu, storyConfig] = await Promise.all([getPublicMenu(), getPublicStoryConfig()]);
  const totalProducts = menu.status === 'ok' ? countProducts(menu.groups) : 0;

  if (menu.status === 'ok' && totalProducts > 0) {
    return (
      <div className="relative flex min-h-dvh flex-col">
        <div className="relative flex flex-1 flex-col">
          <PublicHeader settings={menu.settings} />
          <HeroWelcome />

          <div id="menu" className="scroll-mt-[57px]">
            <MenuExperience
              groups={menu.groups}
              settings={menu.settings}
              storyConfig={storyConfig}
            />
          </div>
        </div>
      </div>
    );
  }

  if (menu.status === 'ok' && totalProducts === 0) {
    return <EmptyMenuState />;
  }

  return (
    <div className="relative flex min-h-dvh flex-col">
      <div className="relative flex flex-1 flex-col">
        <PublicHeader />
        <HeroWelcome />

        <div className="paper-surface flex-1">
          <main id="menu" className="mx-auto w-full max-w-[1100px] flex-1 px-4 pb-16 scroll-mt-[57px] sm:px-6">
            <EmptyMenuState variant={menu.status === 'error' ? 'error' : 'preparing'} />
          </main>
        </div>

        <footer className="border-t border-line">
          <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-1 px-4 py-6 text-xs text-ink-2 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>La Cabanne · Restaurante &amp; Lounge</p>
            <div className="flex items-center gap-3">
              <p>Benguela, Angola</p>
              <span aria-hidden="true" className="h-3 w-px bg-line" />
              <p className="text-xs text-ink-2 mt-1">
                Desenvolvido por <a href={DOCFLEX_LINKTREE_URL} target="_blank" rel="noopener noreferrer" className="font-medium transition-colors hover:text-strong">DOCFLEX ANGOLA</a>
              </p>
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 text-ink-2 transition-colors hover:text-strong"
              >
                <Lock aria-hidden="true" className="size-3" />
                Área reservada
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
