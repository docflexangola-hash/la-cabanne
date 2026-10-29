import { cn } from '@/lib/utils';
import type { MenuCategory } from '@/types/menu';

export function CategoryChips({
  categories,
  activeSlug,
  onChange,
}: {
  categories: MenuCategory[];
  activeSlug: string;
  onChange: (slug: string) => void;
}) {
  return (
    <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
      <div className="flex gap-2 py-3">
        {categories.map((category) => {
          const isActive = category.slug === activeSlug;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onChange(category.slug)}
              aria-pressed={isActive}
              className={cn(
                'inline-flex h-9 shrink-0 items-center border-b-2 px-3.5 text-[13px] whitespace-nowrap transition-colors',
                isActive
                  ? 'border-strong font-semibold text-strong'
                  : 'border-transparent font-medium text-ink-2 hover:border-strong/30 hover:text-strong',
              )}
            >
              {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
