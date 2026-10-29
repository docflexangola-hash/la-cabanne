import { cn } from '@/lib/utils';
import type { MenuGroup } from '@/types/menu';

export function GroupTabs({
  groups,
  activeSlug,
  onChange,
}: {
  groups: MenuGroup[];
  activeSlug: string;
  onChange: (slug: string) => void;
}) {
  return (
    <nav aria-label="Grupos do menu" className="border-b border-line">
      <ul className="flex items-stretch">
        {groups.map((group) => {
          const isActive = group.slug === activeSlug;

          return (
            <li key={group.id} className="relative flex-1">
              <button
                type="button"
                onClick={() => onChange(group.slug)}
                aria-pressed={isActive}
                className={cn(
                  'flex h-11 w-full items-center justify-center px-1 text-[12px] tracking-[0.16em] uppercase transition-colors',
                  isActive
                    ? 'font-semibold text-white'
                    : 'font-medium text-ink-2 hover:text-deep',
                )}
              >
                {group.name}
              </button>
              <span
                aria-hidden="true"
                className={cn(
                  'absolute inset-x-0 bottom-0 h-0.5 origin-left bg-deep transition-transform duration-200',
                  isActive ? 'scale-x-100' : 'scale-x-0',
                )}
              />
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
