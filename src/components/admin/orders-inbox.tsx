'use client';

import { Loader2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';

import { updateOrderStatus } from '@/lib/actions/orders';
import { formatKz } from '@/lib/menu/format';
import type { OrderStatus } from '@/lib/orders/types';
import { cn } from '@/lib/utils';

export type AdminOrderItem = {
  id: string;
  product_name: string;
  variant_label: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type AdminOrder = {
  id: string;
  session_id: string;
  device_id: string;
  round_number: number;
  table_label: string | null;
  total: number;
  item_count: number;
  status: OrderStatus;
  source_path: string | null;
  created_at: string;
  order_items: AdminOrderItem[];
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'Novo',
  preparing: 'Em preparação',
  served: 'Servido',
  cancelled: 'Cancelado',
};

const STATUS_STYLE: Record<OrderStatus, string> = {
  new: 'border-blue/30 bg-blue/10 text-blue',
  preparing: 'border-sand-line bg-sand/40 text-deep',
  served: 'border-ok/30 bg-ok/10 text-ok',
  cancelled: 'border-danger/30 bg-danger/10 text-danger',
};

const FILTERS: Array<{ value: 'all' | OrderStatus; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'new', label: STATUS_LABEL.new },
  { value: 'preparing', label: STATUS_LABEL.preparing },
  { value: 'served', label: STATUS_LABEL.served },
  { value: 'cancelled', label: STATUS_LABEL.cancelled },
];

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function OrdersInbox({ orders }: { orders: AdminOrder[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const [search, setSearch] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, startRefresh] = useTransition();

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.hidden) {
        return;
      }

      router.refresh();
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [router]);

  const sessions = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = orders.filter((order) => {
      if (filter !== 'all' && order.status !== filter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const table = order.table_label?.toLowerCase() ?? '';

      return (
        table.includes(query) ||
        order.session_id.toLowerCase().startsWith(query) ||
        order.device_id.toLowerCase().startsWith(query)
      );
    });

    const map = new Map<
      string,
      {
        sessionId: string;
        deviceId: string;
        tableLabel: string | null;
        orders: AdminOrder[];
      }
    >();

    for (const order of filtered) {
      const entry = map.get(order.session_id);

      if (entry) {
        entry.orders.push(order);
        entry.tableLabel = entry.tableLabel ?? order.table_label;
        continue;
      }

      map.set(order.session_id, {
        sessionId: order.session_id,
        deviceId: order.device_id,
        tableLabel: order.table_label,
        orders: [order],
      });
    }

    return [...map.values()].map((session) => ({
      ...session,
      orders: [...session.orders].sort((a, b) => a.round_number - b.round_number),
    }));
  }, [orders, filter, search]);

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    setPendingId(orderId);
    setError(null);

    const result = await updateOrderStatus(orderId, status);

    setPendingId(null);

    if (!result.success) {
      setError(result.message ?? 'Não foi possível atualizar o pedido.');
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm transition-colors',
              filter === option.value
                ? 'bg-deep text-hero-fg'
                : 'border border-line text-ink-2 hover:text-strong',
            )}
          >
            {option.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Mesa, sessão ou dispositivo"
            aria-label="Pesquisar pedidos"
            className="h-9 w-56 rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-decor focus:border-blue focus:outline-hidden"
          />
          <button
            type="button"
            onClick={() => startRefresh(() => router.refresh())}
            disabled={isRefreshing}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-line px-3 text-sm text-ink-2 transition-colors hover:text-strong disabled:opacity-50"
          >
            {isRefreshing ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <RefreshCw aria-hidden="true" className="size-4" />
            )}
            Actualizar
          </button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-8 text-center">
          <p className="font-display text-xl text-strong">Sem pedidos neste filtro</p>
          <p className="mt-1 text-sm text-ink-2">
            Os pedidos enviados pelo menu digital aparecem aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <section
              key={session.sessionId}
              className="overflow-hidden rounded-2xl border border-line bg-surface"
            >
              <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line bg-surface-2/50 px-4 py-3">
                <div>
                  <h2 className="font-display text-lg text-strong">
                    {session.tableLabel ? `Mesa ${session.tableLabel}` : 'Sem mesa'}
                    <span className="ml-2 text-xs font-normal text-ink-2">
                      sessão {session.sessionId.slice(0, 8)}
                    </span>
                  </h2>
                  <p className="mt-0.5 text-xs text-decor">
                    {session.orders.length}{' '}
                    {session.orders.length === 1 ? 'rodada' : 'rodadas'} · dispositivo{' '}
                    {session.deviceId.slice(0, 8)}
                  </p>
                </div>
              </header>

              <ul className="divide-y divide-line">
                {session.orders.map((order) => (
                  <li key={order.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink">
                          Rodada {order.round_number}
                          <span className="ml-2 text-xs font-normal text-ink-2">
                            {formatDateTime(order.created_at)}
                          </span>
                        </p>

                        <ul className="mt-1.5 space-y-1 text-xs text-ink-2">
                          {order.order_items.map((item) => (
                            <li key={item.id} className="flex justify-between gap-3">
                              <span className="min-w-0">
                                {item.quantity}× {item.product_name}
                                {item.variant_label ? ` (${item.variant_label})` : ''}
                              </span>
                              <span className="shrink-0 tabular">
                                {formatKz(item.line_total)}
                              </span>
                            </li>
                          ))}
                        </ul>

                        <p className="mt-1.5 text-xs text-ink-2">
                          {order.item_count}{' '}
                          {order.item_count === 1 ? 'item' : 'itens'} ·{' '}
                          <span className="font-semibold text-strong">
                            {formatKz(order.total)}
                          </span>
                          {order.source_path ? ` · ${order.source_path}` : ''}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={cn(
                            'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase',
                            STATUS_STYLE[order.status],
                          )}
                        >
                          {STATUS_LABEL[order.status]}
                        </span>

                        <select
                          value={order.status}
                          onChange={(event) =>
                            handleStatusChange(order.id, event.target.value as OrderStatus)
                          }
                          disabled={pendingId === order.id}
                          aria-label={`Estado da rodada ${order.round_number}`}
                          className="h-8 rounded-lg border border-line bg-surface px-2 text-xs text-ink focus:border-blue focus:outline-hidden disabled:opacity-50"
                        >
                          {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((status) => (
                            <option key={status} value={status}>
                              {STATUS_LABEL[status]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
