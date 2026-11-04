'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';

import { CategoryChips } from '@/components/menu/category-chips';
import { FeedbackDialog } from '@/components/menu/feedback-dialog';
import { GroupTabs } from '@/components/menu/group-tabs';
import { MonogramPlaceholder } from '@/components/menu/monogram-placeholder';
import { ProductDialog } from '@/components/menu/product-dialog';
import { ProductRow } from '@/components/menu/product-row';
import { StoriesWidget } from '@/components/menu/stories-widget';
import {
  trackCategoryViewed,
  trackFeedbackOpened,
  trackGroupViewed,
  trackMenuOpened,
  trackProductOpened,
} from '@/lib/analytics/client';
import { useTranslation } from '@/lib/i18n/i18n-context';
import { localizeGroups } from '@/lib/i18n/menu-en';
import { getOpenState } from '@/lib/menu/hours';
import { buildStorySlides } from '@/lib/stories/build';
import { useIsClient } from '@/lib/use-is-client';
import { cn } from '@/lib/utils';
import type { MenuCategory, MenuGroup, MenuProduct, RestaurantSettings } from '@/types/menu';
import type { StoryConfig, StorySlide } from '@/types/stories';

type Suggestion = { group: MenuGroup; category: MenuCategory };

type ScrollTarget = { kind: 'group' | 'category'; slug: string };

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

function scrollToTarget(target: ScrollTarget) {
  const el = document.getElementById(`${target.kind}-${target.slug}`);

  if (!el) {
    return;
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
}

export function MenuExperience({
  groups: groupsProp,
  settings,
  storyConfig,
}: {
  groups: MenuGroup[];
  settings: RestaurantSettings | null;
  storyConfig: StoryConfig;
}) {
  const { locale, t } = useTranslation();
  const groups = useMemo(() => localizeGroups(groupsProp, locale), [groupsProp, locale]);

  // Semente determinística — definida uma vez no effect
  const [shuffleSeed, setShuffleSeed] = useState<number | null>(null);

  useEffect(() => {
    setShuffleSeed(Math.floor(Math.random() * 1_000_000_000));
  }, []);

  const storySlides = useMemo(
    () => buildStorySlides(groups, storyConfig, {
      shuffle: true,
      seed: shuffleSeed ?? 1,
    }),
    [groups, storyConfig, shuffleSeed],
  );

  const initialGroup =
    groups.find((group) => group.categories.some((category) => category.products.length > 0)) ??
    groups[0];

  const [groupSlug, setGroupSlug] = useState(initialGroup.slug);
  const [categorySlug, setCategorySlug] = useState(() => firstCategoryOf(initialGroup).slug);

  const [activeProduct, setActiveProduct] = useState<{
    product: MenuProduct;
    groupSlug: string;
    categorySlug: string;
  } | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const isClient = useIsClient();

  useEffect(() => {
    trackMenuOpened();
  }, []);

  const didReadUrl = useRef(false);
  const scrollFrame = useRef<number | null>(null);

  const activeGroup = groups.find((group) => group.slug === groupSlug) ?? groups[0];
  const activeCategory =
    activeGroup.categories.find((category) => category.slug === categorySlug) ??
    firstCategoryOf(activeGroup);

  useEffect(() => {
    trackGroupViewed(activeGroup.slug);
  }, [activeGroup.slug]);

  useEffect(() => {
    trackCategoryViewed(activeGroup.slug, activeCategory.slug);
  }, [activeGroup.slug, activeCategory.slug]);

  const syncUrl = useCallback((g: string, c: string) => {
    const url = new URL(window.location.href);
    url.hash = '';
    url.searchParams.set('g', g);
    url.searchParams.set('c', c);
    window.history.replaceState(null, '', url);
  }, []);

  const applyUrlState = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const groupParam = params.get('g');

    let group = groupParam ? groups.find((item) => item.slug === groupParam) : undefined;
    let category = group
      ? group.categories.find((item) => item.slug === params.get('c')) ?? firstCategoryOf(group)
      : undefined;

    // Hash is only a no-JS fallback; the canonical state lives in ?g=&c=.
    if (!group) {
      const match = /^#(group|category)-(.+)$/.exec(window.location.hash);

      if (match) {
        const [, kind, slug] = match;

        if (kind === 'category') {
          group = groups.find((item) =>
            item.categories.some((candidate) => candidate.slug === slug),
          );
          category = group?.categories.find((candidate) => candidate.slug === slug);
        } else {
          group = groups.find((item) => item.slug === slug);
          category = group ? firstCategoryOf(group) : undefined;
        }
      }
    }

    if (!group) {
      return;
    }

    setGroupSlug(group.slug);
    setCategorySlug(category ? category.slug : firstCategoryOf(group).slug);
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

  useEffect(
    () => () => {
      if (scrollFrame.current !== null) {
        cancelAnimationFrame(scrollFrame.current);
      }
    },
    [],
  );

  const openState = isClient && settings ? getOpenState(settings, new Date(), locale) : null;

  function scheduleScroll(target: ScrollTarget) {
    if (scrollFrame.current !== null) {
      cancelAnimationFrame(scrollFrame.current);
    }

    // Wait for React to commit the new active section before scrolling to it.
    scrollFrame.current = requestAnimationFrame(() => {
      scrollFrame.current = null;
      scrollToTarget(target);
    });
  }

  function selectGroup(slug: string) {
    const group = groups.find((item) => item.slug === slug);

    if (!group) {
      return;
    }

    const category = firstCategoryOf(group);

    setGroupSlug(group.slug);
    setCategorySlug(category.slug);
    syncUrl(group.slug, category.slug);
    scheduleScroll({ kind: 'group', slug: group.slug });
  }

  function selectCategory(groupSlugToOpen: string, categorySlugToOpen: string) {
    const group = groups.find((item) => item.slug === groupSlugToOpen);
    const category = group?.categories.find((item) => item.slug === categorySlugToOpen);

    if (!group || !category) {
      return;
    }

    setGroupSlug(group.slug);
    setCategorySlug(category.slug);
    syncUrl(group.slug, category.slug);
    scheduleScroll({ kind: 'category', slug: category.slug });
  }

  function handleStoryProductOpen(slide: StorySlide) {
    if (!slide.product || !slide.groupSlug || !slide.categorySlug) {
      return;
    }

    selectCategory(slide.groupSlug, slide.categorySlug);
    setActiveProduct({
      product: slide.product,
      groupSlug: slide.groupSlug,
      categorySlug: slide.categorySlug,
    });
    trackProductOpened({
      groupSlug: slide.groupSlug,
      categorySlug: slide.categorySlug,
      productSlug: slide.product.slug,
    });
  }

  const showClosedBand = Boolean(openState && !openState.open);

  return (
    <div className="relative flex min-h-[100vh] flex-col">
      <div className="relative flex flex-1 flex-col">
        <div className="paper-surface flex flex-1 flex-col">
          {showClosedBand && openState ? (
            <div className="border-b border-sand-line bg-sand/60">
              <p className="mx-auto w-full max-w-[1100px] px-4 py-2 text-center text-xs text-ink-2 sm:px-6">
                {openState.label}
              </p>
            </div>
          ) : null}

          <div className="mx-auto flex w-full max-w-[1100px] flex-1 items-start gap-10 px-4 sm:px-6">
          <aside className="sticky top-[57px] hidden max-h-[calc(100vh-57px)] w-[220px] shrink-0 overflow-y-auto py-6 lg:block">
            <nav aria-label={t('nav_categories')}>
              {groups.map((group) => (
                <div key={group.id} className="mb-5">
                  <a
                    href={`#group-${group.slug}`}
                    onClick={(event) => {
                      event.preventDefault();
                      selectGroup(group.slug);
                    }}
                    aria-current={group.slug === activeGroup.slug ? 'true' : undefined}
                    className={cn(
                      'text-[11px] font-semibold tracking-[0.16em] uppercase transition-colors',
                      group.slug === activeGroup.slug
                        ? 'text-strong'
                        : 'text-ink-2 hover:text-strong',
                    )}
                  >
                    {group.name}
                  </a>

                  {group.slug === activeGroup.slug ? (
                    <ul className="mt-2 border-l border-line">
                      {group.categories.map((category) => {
                        const isActive = category.slug === activeCategory.slug;

                        return (
                          <li key={category.id}>
                            <a
                              href={`#category-${category.slug}`}
                              onClick={(event) => {
                                event.preventDefault();
                                selectCategory(group.slug, category.slug);
                              }}
                              aria-current={isActive ? 'true' : undefined}
                              className={cn(
                                '-ml-px flex min-h-9 w-full items-center border-l-2 px-3 text-left text-sm transition-colors',
                                isActive
                                  ? 'border-blue font-medium text-strong'
                                  : 'border-transparent text-ink-2 hover:text-strong',
                              )}
                            >
                              {category.name}
                            </a>
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

            <div className="sticky top-[57px] z-20 -mx-4 border-b border-line bg-ivory/85 px-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:hidden">
              <GroupTabs
                groups={groups}
                activeSlug={activeGroup.slug}
                onSelect={selectGroup}
              />
              <CategoryChips
                groups={groups}
                activeGroupSlug={activeGroup.slug}
                activeSlug={activeCategory.slug}
                filtered={isClient}
                onSelect={selectCategory}
              />
            </div>

            <p role="status" aria-live="polite" className="sr-only">
              {activeGroup.name}: {activeCategory.name}
            </p>

            {groups.map((group) => (
              <section
                key={group.id}
                id={`group-${group.slug}`}
                className={cn(
                  'scroll-mt-[163px] lg:scroll-mt-[57px]',
                  isClient && group.slug !== activeGroup.slug && 'hidden',
                )}
              >
                <h2 className="sr-only">{group.name}</h2>

                {group.categories.map((category) => {
                  const isActiveCategory = category.slug === activeCategory.slug;
                  const products = category.products;
                  const suggestions = buildSuggestions(groups, group, category);

                  return (
                    <section
                      key={category.id}
                      id={`category-${category.slug}`}
                      className={cn(
                        'scroll-mt-[163px] pt-5 lg:scroll-mt-[57px] lg:pt-7',
                        isClient && !isActiveCategory && 'hidden',
                      )}
                    >
                      <header className="border-b border-line pb-2">
                        <h3 className="text-center font-display text-2xl leading-tight text-strong">
                          {category.name}
                        </h3>
                      </header>

                      {products.length > 0 ? (
                        <div className="lg:grid lg:grid-cols-2 lg:gap-x-10">
                          {products.map((item) => (
                            <ProductRow
                              key={item.id}
                              product={item}
                              onOpen={(selected) => {
                                setActiveProduct({
                                  product: selected,
                                  groupSlug: group.slug,
                                  categorySlug: category.slug,
                                });
                                trackProductOpened({
                                  groupSlug: group.slug,
                                  categorySlug: category.slug,
                                  productSlug: selected.slug,
                                });
                              }}
                            />
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
                                  onClick={() =>
                                    selectCategory(item.group.slug, item.category.slug)
                                  }
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
                  );
                })}
              </section>
            ))}

            <section className="mt-10 border-t border-line pt-8 text-center">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-decor">
                {t('feedback_title_small')}
              </p>
              <h3 className="mt-2 font-display text-2xl text-strong">{t('feedback_title')}</h3>
              <p className="mt-2 text-sm text-ink-2">{t('feedback_subtitle')}</p>
              <button
                type="button"
                onClick={() => {
                  trackFeedbackOpened();
                  setFeedbackOpen(true);
                }}
                className="mt-5 inline-flex h-11 items-center rounded-sm bg-deep px-6 text-sm font-medium text-hero-fg transition-colors hover:bg-blue-700"
              >
                {t('leave_review')}
              </button>
            </section>
          </main>
        </div>
        </div>

        <footer className="border-t border-line">
          <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-1 px-4 py-6 text-xs text-ink-2 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>{t('footer_rights')}</p>
            <div className="flex items-center gap-3">
              <p>{t('footer_location')}</p>
              <span aria-hidden="true" className="h-3 w-px bg-line" />
              <p>
                {t('footer_credit_prefix')}{' '}
                <a href="https://docflex-site.vercel.app" target="_blank" rel="noopener noreferrer" className="font-medium transition-colors hover:text-strong">
                  DOCFLEX ANGOLA
                </a>
              </p>
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 text-ink-2 transition-colors hover:text-strong"
              >
                <Lock aria-hidden="true" className="size-3" />
                {t('footer_admin')}
              </Link>
            </div>
          </div>
        </footer>

        {activeProduct ? (
          <ProductDialog
            product={activeProduct.product}
            groupSlug={activeProduct.groupSlug}
            categorySlug={activeProduct.categorySlug}
            onClose={() => setActiveProduct(null)}
          />
        ) : null}

        {isClient && storyConfig.settings.enabled ? (
          <StoriesWidget
            slides={storySlides}
            intervalSeconds={storyConfig.settings.intervalSeconds}
            enabled={storyConfig.settings.enabled}
            onOpenProduct={handleStoryProductOpen}
          />
        ) : null}

        <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
      </div>
    </div>
  );
}