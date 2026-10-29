'use client';

import { Search } from 'lucide-react';
import Image from 'next/image';
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { CategoryChips } from '@/components/menu/category-chips';
import { FeedbackDialog } from '@/components/menu/feedback-dialog';
import { GroupTabs } from '@/components/menu/group-tabs';
import { InfoDialog } from '@/components/menu/info-dialog';
import { MonogramPlaceholder } from '@/components/menu/monogram-placeholder';
import { ProductDialog } from '@/components/menu/product-dialog';
import { ProductRow } from '@/components/menu/product-row';
import { useTranslation } from '@/lib/i18n/i18n-context';
import { formatKz, normalizeSearch } from '@/lib/menu/format';
import { getOpenState } from '@/lib/menu/hours';
import { getStartingPrice } from '@/lib/menu/pricing';
import { useIsClient } from '@/lib/use-is-client';
import { cn } from '@/lib/utils';
import type { MenuCategory, MenuGroup, MenuProduct, RestaurantSettings } from '@/types/menu';

type SearchEntry = {
  product: MenuProduct;
  group: MenuGroup;
  category: MenuCategory;
  normalizedName: string;
  haystack: string;
};

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
  groups,
  settings,
}: {
  groups: MenuGroup[];
  settings: RestaurantSettings | null;
}) {
  const initialGroup =
    groups.find((group) => group.categories.some((category) => category.products.length > 0)) ??
    groups[0];

  const [groupSlug, setGroupSlug] = useState(initialGroup.slug);
  const [categorySlug, setCategorySlug] = useState(() => firstCategoryOf(initialGroup).slug);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [product, setProduct] = useState<MenuProduct | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const { locale, toggle: toggleLang, t } = useTranslation();
  const isClient = useIsClient();

  const didReadUrl = useRef(false);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

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

  const openState = isClient && settings ? getOpenState(settings) : null;

  const searchIndex = useMemo<SearchEntry[]>(
    () =>
      groups.flatMap((group) =>
        group.categories.flatMap((category) =>
          category.products.map((item) => ({
            product: item,
            group,
            category,
            normalizedName: normalizeSearch(item.name),
            haystack: normalizeSearch(`${item.name} ${item.description ?? ''}`),
          })),
        ),
      ),
    [groups],
  );

  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = normalizeSearch(deferredQuery);

  const searchResults = useMemo(() => {
    if (!normalizedQuery) {
      return { results: [] as SearchEntry[], total: 0 };
    }

    const tokens = normalizedQuery.split(' ').filter(Boolean);

    const matches = searchIndex.filter((entry) =>
      tokens.every((token) => entry.haystack.includes(token)),
    );

    matches.sort((a, b) => {
      const aPrefix = a.normalizedName.startsWith(normalizedQuery) ? 0 : 1;
      const bPrefix = b.normalizedName.startsWith(normalizedQuery) ? 0 : 1;

      return aPrefix - bPrefix || a.product.name.localeCompare(b.product.name, 'pt');
    });

    return { results: matches.slice(0, 40), total: matches.length };
  }, [normalizedQuery, searchIndex]);

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
    setSearchOpen(false);
    setQuery('');
    syncUrl(groupSlugToOpen, categorySlugToOpen);
    scrollToTop();
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery('');
    requestAnimationFrame(() => searchButtonRef.current?.focus());
  }

  const showClosedBand = Boolean(openState && !openState.open && !searchOpen);

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
          {!searchOpen ? (
            <aside className="sticky top-14 hidden max-h-[calc(100vh - 3.5rem)] w-[220px] shrink-0 overflow-y-auto py-6 lg:block">
              <nav aria-label="Categorias do menu">
                {groups.map((group) => (
                  <div key={group.id} className="mb-5">
                    <button
                      type="button"
                      onClick={() => selectGroup(group.slug)}
                      className={cn(
                        'text-[11px] font-semibold tracking-[0.16em] uppercase transition-colors',
                        group.slug === activeGroup.slug
                          ? 'text-deep'
                          : 'text-ink-2 hover:text-deep',
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
                                    ? 'border-blue font-medium text-deep'
                                    : 'border-transparent text-ink-2 hover:text-deep',
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
          ) : null}

          <main className="min-w-0 flex-1 pb-16">
            <h1 className="sr-only">Menu do La Cabanne</h1>

            {searchOpen ? (
              <section aria-label="Resultados da pesquisa" className="pt-5">
                {query.trim().length === 0 ? (
                  <p className="max-w-md text-sm leading-relaxed text-ink-2">
                    Escreve o nome de um prato, ingrediente ou bebida. A pesquisa percorre
                    todo o menu.
                  </p>
                ) : searchResults.results.length === 0 ? (
                  <div className="py-10 text-center">
                    <Image
                      src="/images/07-ilustracao-vazia.svg"
                      alt=""
                      width={800}
                      height={600}
                      unoptimized
                      className="mx-auto h-28 w-auto opacity-70"
                    />
                    <p className="mt-5 font-display text-2xl text-deep">
                      Nada encontrado para “{query.trim()}”
                    </p>
                    <p className="mt-2 text-sm text-ink-2">
                      Tenta outro termo ou explora uma categoria.
                    </p>

                    {suggestions.length > 0 ? (
                      <div className="mt-5 flex flex-wrap justify-center gap-2">
                        {suggestions.map((item) => (
                          <button
                            key={`${item.group.id}-${item.category.id}`}
                            type="button"
                            onClick={() => jumpTo(item.group.slug, item.category.slug)}
                            className="inline-flex h-9 items-center rounded-full border border-line px-3.5 text-[13px] text-ink-2 transition-colors hover:border-deep hover:text-deep"
                          >
                            {item.category.name}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <>
                    <p className="text-[11px] font-semibold tracking-[0.16em] text-ink-2 uppercase">
                      {searchResults.total}
                      {searchResults.total > searchResults.results.length ? '+' : ''}{' '}
                      {searchResults.total === 1 ? 'resultado' : 'resultados'}
                    </p>

                    <ul className="mt-2">
                      {searchResults.results.map((entry) => {
                        const { amount, from } = getStartingPrice(entry.product);
                        const priceLabel =
                          amount !== null
                            ? `${from ? 'desde ' : ''}${formatKz(amount)}`
                            : (entry.product.priceNote ?? '—');

                        return (
                          <li key={entry.product.id}>
                            <button
                              type="button"
                              onClick={() => setProduct(entry.product)}
                              aria-haspopup="dialog"
                              className="flex w-full flex-col border-b border-line py-3.5 text-left transition-colors hover:bg-[#FBFAF7] focus-visible:bg-blue-tint/50 focus-visible:outline-none"
                            >
                              <span className="flex items-baseline justify-between gap-3">
                                <span className="text-[15px] font-semibold text-ink">
                                  {entry.product.name}
                                  {entry.product.status === 'unavailable' ? (
                                    <span className="ml-2 text-[10px] font-semibold tracking-[0.04em] text-danger uppercase">
                                      Esgotado
                                    </span>
                                  ) : null}
                                </span>
                                <span className="shrink-0 text-sm font-semibold text-deep tabular">
                                  {priceLabel}
                                </span>
                              </span>
                              <span className="mt-0.5 text-[11px] tracking-[0.08em] text-ink-2 uppercase">
                                {entry.category.name} · {entry.group.name}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </section>
            ) : (
              <>
                <div className="lg:hidden">
                  <div className="sticky top-14 z-20 -mx-4 border-b border-line bg-ivory/95 backdrop-blur-md px-4 sm:-mx-6 sm:px-6">
                    <GroupTabs
                      groups={groups}
                      activeSlug={activeGroup.slug}
                      onChange={selectGroup}
                    />
                    <button
                      type="button"
                      onClick={() => setSearchOpen(true)}
                      aria-label={t('search_aria')}
                      className="flex h-9 items-center gap-2 rounded-full border border-line bg-surface px-3 text-xs text-ink-2 transition-colors hover:border-deep hover:text-deep"
                    >
                      <Search aria-hidden className="size-3.5" />
                      <span className="hidden sm:inline">{t('search_placeholder')}</span>
                    </button>
                    <CategoryChips
                      categories={activeGroup.categories}
                      activeSlug={activeCategory.slug}
                      onChange={selectCategory}
                    />
                  </div>
                </div>

                <section aria-live="polite" className="pt-1 lg:pt-7">
                  <header className="flex items-baseline justify-between gap-4 border-b border-line pb-2 lg:mt-0">
                    <h2 className="font-display text-2xl leading-tight text-deep text-center">
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
                      <p className="mt-4 font-display text-xl text-deep">
                        Ainda sem produtos nesta categoria
                      </p>
                      <p className="mt-1 text-sm text-ink-2">
                        Novos produtos serão publicados em breve.
                      </p>

                      {suggestions.length > 0 ? (
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                          {suggestions.map((item) => (
                            <button
                              key={`${item.group.id}-${item.category.id}`}
                              type="button"
                              onClick={() => jumpTo(item.group.slug, item.category.slug)}
                              className="inline-flex h-9 items-center rounded-full border border-line px-3.5 text-[13px] text-ink-2 transition-colors hover:border-deep hover:text-deep"
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
                  <h3 className="mt-2 font-display text-2xl text-deep">
                    {t('feedback_title')}
                  </h3>
                  <p className="mt-2 text-sm text-ink-2">
                    {t('feedback_subtitle')}
                  </p>
                  <button
                    type="button"
                    onClick={() => setFeedbackOpen(true)}
                    className="mt-5 inline-flex h-11 items-center rounded-sm bg-deep px-6 text-sm font-medium text-ivory transition-colors hover:bg-blue-700"
                  >
                    {t('leave_review')}
                  </button>
                </section>
              </>
            )}
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

      {infoOpen && settings ? (
        <InfoDialog settings={settings} onClose={() => setInfoOpen(false)} />
      ) : null}

      <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}
