'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CategoryChips } from '@/components/menu/category-chips';
import { FeedbackDialog } from '@/components/menu/feedback-dialog';
import { GroupTabs } from '@/components/menu/group-tabs';
import { MonogramPlaceholder } from '@/components/menu/monogram-placeholder';
import { ProductDialog } from '@/components/menu/product-dialog';
import { ProductRow } from '@/components/menu/product-row';
import { useTranslation } from '@/lib/i18n/i18n-context';
import { localizeGroups } from '@/lib/i18n/menu-en';
import { getOpenState } from '@/lib/menu/hours';
import { useIsClient } from '@/lib/use-is-client';
import { cn } from '@/lib/utils';
import type { MenuCategory, MenuGroup, MenuProduct, RestaurantSettings } from '@/types/menu';

type Suggestion = { group: MenuGroup; category: MenuCategory };

function firstCategoryOf(group: MenuGroup): MenuCategory {
  return group.categories.find((category) => category.products.length > 0) ?? group.categories[0];
}

function buildSuggestions(
  groups: MenuGroup[],
  activeGroup: MenuGroup,
  activeCategory: MenuCategory,
): Suggestion[] {
  const sameGroup = activeGroup.categories
    .filter((category) => category.slug !== activeCategory.slug && category.products.length > 0)
    .slice(0, 3)
    .map((category) => ({ group: activeGroup, category }));

  if (sameGroup.length > 0) {
    return sameGroup;
  }

  return groups
    .flatMap((group) =>
      group.categories
        .filter((category) => category.products.length > 0)
        .slice(0, 1)
        .map((category) => ({ group, category })),
    )
    .filter(
      (item) =>
        item.group.slug !== activeGroup.slug || item.category.slug !== activeCategory.slug,
    )
    .slice(0, 3);
}

function scrollToTop() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const menuEl = document.getElementById('menu');
  if (menuEl) {
    menuEl.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
  } else {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }
}

export function MenuExperience({
  groups: groupsProp,
  settings,
}: {
  groups: MenuGroup[];
  settings: RestaurantSettings | null;
}) {
  const { locale, t } = useTranslation();
  const groups = useMemo(() => localizeGroups(groupsProp, locale), [groupsProp, locale]);

  const initialGroup =
    groups.find((group) => group.categories.some((category) => category.products.length > 0)) ??
    groups[0];

  const [groupSlug, setGroupSlug] = useState(initialGroup.slug);
  const [categorySlug, setCategorySlug] = useState(() => firstCategoryOf(initialGroup).slug);

  const [product, setProduct] = useState<MenuProduct | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const isClient = useIsClient();

  const didReadUrl = useRef(false);

  const activeGroup = groups.find((group) => group.slug === groupSlug) ?? groups[0];
  const activeCategory =
    activeGroup.categories.find((category) => category.slug === categorySlug) ??
    firstCategoryOf(activeGroup);
  const products = activeCategory.products;

  const syncUrl = useCallback((g: string, c: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('g', g);
    url.searchParams.set('c', c);
    window.history.replaceState(null, '', url);
  }, []);

  const applyUrlState = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const groupParam = params.get('g');

    if (!groupParam) {
      return;
    }

    const group = groups.find((item) => item.slug === groupParam);

    if (!group) {
      return;
    }

    const categoryParam = params.get('c');
    const category =
      group.categories.find((item) => item.slug === categoryParam) ?? firstCategoryOf(group);

    setGroupSlug(group.slug);
    setCategorySlug(category.slug);
  }, [groups]);

  useEffect(() => {
    if (didReadUrl.current) {
      return;
    }

    didReadUrl.current = true;
    applyUrlState();
  }, [applyUrlState]);

  useEffect(() => {
    const onPopState = () => applyUrlState();
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [applyUrlState]);

  const openState = isClient && settings ? getOpenState(settings, new Date(), locale) : null;

  const suggestions = buildSuggestions(groups, activeGroup, activeCategory);

  function selectGroup(slug: string) {
    if (slug === activeGroup.slug) {
      return;
    }

    const group = groups.find((item) => item.slug === slug);

    if (!group) {
      return;
    }

    const category = firstCategoryOf(group);

    setGroupSlug(group.slug);
    setCategorySlug(category.slug);
    syncUrl(group.slug, category.slug);
    scrollToTop();
  }

  function selectCategory(slug: string) {
    if (slug === activeCategory.slug) {
      return;
    }

    setCategorySlug(slug);
    syncUrl(activeGroup.slug, slug);
    const el = document.getElementById('category-' + slug);
    if (el) {
      el.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }

  function jumpTo(groupSlugToOpen: string, categorySlugToOpen: string) {
    setGroupSlug(groupSlugToOpen);
    setCategorySlug(categorySlugToOpen);
    syncUrl(groupSlugToOpen, categorySlugToOpen);
    scrollToTop();
  }

  const showClosedBand = Boolean(openState && !openState.open);

  return (
    <div className="relative flex min-h-[100vh] flex-col">
      <div
        aria-hidden="true"
        className="texture-paper pointer-events-none absolute inset-0 opacity-[0.04]"
      />

      <div className="relative flex flex-1 flex-col">
        {showClosedBand && openState ? (
          <div className="border-b border-sand-line bg-sand/60">
            <p className="mx-auto w-full max-w-[1100px] px-4 py-2 text-center text-xs text-ink-2 sm:px-6">
              {openState.label}
            </p>
          </div>
        ) : null}

        <div className="mx-auto flex w-full max-w-[1100px] flex-1 items-start gap-10 px-4 sm:px-6">
          <aside className="sticky top-14 md:hidden max-h-[calc(100vh - 3.5rem)] w-[220px] shrink-0 overflow-y-auto py-6 lg:block">
            <nav aria-label={t('nav_categories')}>
              {groups.map((group) => (
                <div key={group.id} className="mb-5">
                  <button
                    type="button"
                    onClick={() => selectGroup(group.slug)}
                    className={cn(
                      'text-[11px] font-semibold tracking-[0.16em] uppercase transition-colors',
                      group.slug === activeGroup.slug
                        ? 'text-strong'
                        : 'text-ink-2 hover:text-strong',
                    )}
                  >
                    {group.name}
                  </button>

                  {group.slug === activeGroup.slug ? (
                    <ul className="mt-2 border-l border-line">
                      {group.categories.map((category) => {
                        const isActive = category.slug === activeCategory.slug;

                        return (
                          <li key={category.id}>
                            <button
                              type="button"
                              onClick={() => selectCategory(category.slug)}
                              aria-current={isActive ? 'true' : undefined}
                              className={cn(
                                '-ml-px flex min-h-9 w-full items-center border-l-2 px-3 text-left text-sm transition-colors',
                                isActive
                                  ? 'border-blue font-medium text-strong'
                                  : 'border-transparent text-ink-2 hover:text-strong',
                              )}
                            >
                              {category.name}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
              ))}
            </nav>
          </aside>

          <main className="min-w-0 flex-1 pb-16">
            <h1 className="sr-only">{t('menu_h1')}</h1>

            <div className="lg:hidden">
              <div className="sticky top-14 z-20 -mx-4 border-b border-line bg-ivory/95 px-4 backdrop-blur-md sm:-mx-6 sm:px-6">
                <GroupTabs
                  groups={groups}
                  activeSlug={activeGroup.slug}
                  onChange={selectGroup}
                />
                <CategoryChips
                  categories={activeGroup.categories}
                  activeSlug={activeCategory.slug}
                  onChange={selectCategory}
                />
              </div>
            </div>

            <section aria-live="polite" className="pt-1 lg:pt-7">
              <header className="border-b border-line pb-2 lg:mt-0">
                <h2 className="text-center font-display text-2xl leading-tight text-strong">
                  {activeCategory.name}
                </h2>
              </header>

              {products.length > 0 ? (
                <div className="lg:grid lg:grid-cols-2 lg:gap-x-10">
                  {products.map((item) => (
                    <ProductRow key={item.id} product={item} onOpen={setProduct} />
                  ))}
                </div>
              ) : (
                <div className="mt-8 rounded-card border border-line bg-surface px-6 py-10 text-center">
                  <div className="mx-auto h-16 w-16 overflow-hidden rounded-tile border border-sand-line">
                    <MonogramPlaceholder compact />
                  </div>
                  <p className="mt-4 font-display text-xl text-strong">
                    {t('still_no_products')}
                  </p>
                  <p className="mt-1 text-sm text-ink-2">{t('new_soon')}</p>

                  {suggestions.length > 0 ? (
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {suggestions.map((item) => (
                        <button
                          key={`${item.group.id}-${item.category.id}`}
                          type="button"
                          onClick={() => jumpTo(item.group.slug, item.category.slug)}
                          className="inline-flex h-9 items-center rounded-full border border-line px-3.5 text-[13px] text-ink-2 transition-colors hover:border-deep hover:text-strong"
                        >
                          {item.category.name}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </section>

            <section className="mt-10 border-t border-line pt-8 text-center">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-decor uppercase">
                {t('feedback_title_small')}
              </p>
              <h3 className="mt-2 font-display text-2xl text-strong">{t('feedback_title')}</h3>
              <p className="mt-2 text-sm text-ink-2">{t('feedback_subtitle')}</p>
              <button
                type="button"
                onClick={() => setFeedbackOpen(true)}
                className="mt-5 inline-flex h-11 items-center rounded-sm bg-deep px-6 text-sm font-medium text-hero-fg transition-colors hover:bg-blue-700"
              >
                {t('leave_review')}
              </button>
            </section>
          </main>
        </div>

        <footer className="border-t border-line">
          <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-1 px-4 py-6 text-xs text-ink-2 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>{t('footer_rights')}</p>
            <p>{t('footer_location')}</p>
          </div>
        </footer>
      </div>

      {product ? <ProductDialog product={product} onClose={() => setProduct(null)} /> : null}

      <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}
