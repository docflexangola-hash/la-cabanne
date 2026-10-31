'use client';

import { useEffect, useRef } from 'react';

import { useTranslation } from '@/lib/i18n/i18n-context';
import { cn } from '@/lib/utils';
import type { MenuGroup } from '@/types/menu';

export function CategoryChips({
  groups,
  activeGroupSlug,
  activeSlug,
  filtered,
  onSelect,
}: {
  groups: MenuGroup[];
  activeGroupSlug: string;
  activeSlug: string;
  filtered: boolean;
  onSelect: (groupSlug: string, categorySlug: string) => void;
}) {
  const { t } = useTranslation();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (!filtered) {
      return;
    }

    const scroller = scrollerRef.current;
    const active = activeRef.current;

    if (!scroller || !active) {
      return;
    }

    // Scroll only the chip row, never the page (the bar may be below the hero).
    const scrollerRect = scroller.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    const delta =
      activeRect.left - scrollerRect.left - (scrollerRect.width - activeRect.width) / 2;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    scroller.scrollTo({
      left: Math.max(0, scroller.scrollLeft + delta),
      behavior: reduce ? 'auto' : 'smooth',
    });
  }, [activeGroupSlug, activeSlug, filtered]);

  return (
    <div
      ref={scrollerRef}
      className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6"
    >
      <div className="flex items-start gap-5 py-3">
        {groups.map((group) => {
          const isVisible = !filtered || group.slug === activeGroupSlug;

          return (
            <div
              key={group.id}
              className={cn('flex items-center gap-2', !isVisible && 'hidden')}
            >
              <span className="text-[10px] font-semibold tracking-[0.16em] text-decor uppercase">
                {group.name}
              </span>
              <div className="flex gap-2">
                {group.categories.map((category) => {
                  const isActive = category.slug === activeSlug;

                  return (
                    <a
                      key={category.id}
                      ref={isActive ? activeRef : undefined}
                      href={`#category-${category.slug}`}
                      onClick={(event) => {
                        event.preventDefault();
                        onSelect(group.slug, category.slug);
                      }}
                      aria-current={isActive ? 'true' : undefined}
                      className={cn(
                        'inline-flex h-9 shrink-0 items-center gap-1.5 border-b-2 px-3.5 text-[13px] whitespace-nowrap transition-colors',
                        isActive
                          ? 'border-strong font-semibold text-strong'
                          : 'border-transparent font-medium text-ink-2 hover:border-strong/30 hover:text-strong',
                      )}
                    >
                      {category.name}
                      {category.products.length === 0 ? (
                        <span className="text-[10px] font-normal tracking-normal text-decor normal-case">
                          {t('coming_soon')}
                        </span>
                      ) : null}
                    </a>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
