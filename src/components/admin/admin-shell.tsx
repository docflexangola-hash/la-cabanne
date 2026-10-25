'use client';

import {
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Tags,
  TrendingUp,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';

import { signOut } from '@/lib/auth/actions';
import { cn } from '@/lib/utils';
import type { StaffMember } from '@/types/auth';

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Visão geral',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
    ],
  },
  {
    label: 'Cardápio',
    items: [
      { href: '/admin/products', label: 'Produtos', icon: UtensilsCrossed },
      { href: '/admin/categories', label: 'Categorias', icon: Tags },
    ],
  },
  {
    label: 'Clientes',
    items: [{ href: '/admin/feedback', label: 'Feedback', icon: MessageSquare }],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/admin/users', label: 'Utilizadores', icon: Users },
      { href: '/admin/audit', label: 'Histórico', icon: History },
      { href: '/admin/settings', label: 'Configurações', icon: Settings },
    ],
  },
];

const ROLE_LABEL: Record<StaffMember['role'], string> = {
  admin: 'Administrador',
  manager: 'Gerente',
};

export function AdminShell({
  staff,
  children,
}: {
  staff: StaffMember;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const sidebar = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-24 shrink-0 items-center justify-center bg-deep px-6">
        <div className="text-center">
          <p className="font-display text-2xl leading-none tracking-tight text-ivory">
            La Cabanne
          </p>
          <p className="mt-2 text-[10px] font-medium tracking-[0.22em] text-ivory/60">
            MENU DIGITAL
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Navegação principal">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.16em] text-decor uppercase">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors',
                        active
                          ? 'bg-blue-tint font-medium text-deep'
                          : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                      )}
                    >
                      <Icon
                        aria-hidden="true"
                        className={cn(
                          'size-4 shrink-0',
                          active ? 'text-blue' : 'text-decor',
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line px-4 py-4">
        <p className="truncate text-sm font-medium text-ink">{staff.displayName}</p>
        <p className="truncate text-xs text-ink-2">
          {ROLE_LABEL[staff.role]} · {staff.email}
        </p>
        <form action={signOut} className="mt-3">
          <button
            type="submit"
            className="flex min-h-9 w-full items-center gap-2 rounded-lg px-2 text-sm text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <LogOut aria-hidden="true" className="size-4" />
            Terminar sessão
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-surface-2">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-line lg:block">
        {sidebar}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-deep/32"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 shadow-xl">{sidebar}</div>
        </div>
      ) : null}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            className="flex size-10 items-center justify-center rounded-lg text-ink-2 hover:bg-surface-2 lg:hidden"
          >
            <Menu aria-hidden="true" className="size-5" />
          </button>

          <p className="text-xs font-medium tracking-[0.14em] text-decor uppercase">
            Painel administrativo
          </p>

          {open ? (
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar menu"
              className="ml-auto flex size-10 items-center justify-center rounded-lg text-ink-2 hover:bg-surface-2 lg:hidden"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          ) : null}
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
