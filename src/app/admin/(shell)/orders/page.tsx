import type { Metadata } from 'next';

import { OrdersInbox, type AdminOrder } from '@/components/admin/orders-inbox';
import { requireStaff } from '@/lib/auth/guard';
import { isSupabaseConfigured } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Pedidos' };
export const dynamic = 'force-dynamic';

type OrderRow = {
  id: string;
  session_id: string;
  device_id: string;
  round_number: number;
  table_label: string | null;
  total: number | string;
  item_count: number;
  status: AdminOrder['status'];
  source_path: string | null;
  created_at: string;
  order_items: Array<{
    id: string;
    product_name: string;
    variant_label: string | null;
    unit_price: number | string;
    quantity: number;
    line_total: number | string;
  }> | null;
};

export default async function OrdersPage() {
  await requireStaff();

  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-8 text-center">
        <p className="font-display text-2xl text-strong">Supabase não configurado</p>
        <p className="mt-2 text-sm text-ink-2">
          Configure as variáveis de ambiente para aceder aos pedidos.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, session_id, device_id, round_number, table_label, total, item_count, status, source_path, created_at, order_items ( id, product_name, variant_label, unit_price, quantity, line_total )',
    )
    .order('created_at', { ascending: false })
    .limit(100);

  const orders: AdminOrder[] = ((data ?? []) as unknown as OrderRow[]).map((order) => ({
    id: order.id,
    session_id: order.session_id,
    device_id: order.device_id,
    round_number: order.round_number,
    table_label: order.table_label,
    total: Number(order.total),
    item_count: order.item_count,
    status: order.status,
    source_path: order.source_path,
    created_at: order.created_at,
    order_items: (order.order_items ?? []).map((item) => ({
      id: item.id,
      product_name: item.product_name,
      variant_label: item.variant_label,
      unit_price: Number(item.unit_price),
      quantity: item.quantity,
      line_total: Number(item.line_total),
    })),
  }));

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-decor uppercase">
          Clientes
        </p>
        <h1 className="font-display text-3xl text-strong">Pedidos</h1>
        <p className="max-w-2xl text-sm text-ink-2">
          Rodadas enviadas pelo menu digital, agrupadas por sessão. O cliente guarda o
          histórico no próprio telemóvel; aqui fica o registo do que saiu.
        </p>
      </header>

      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger"
        >
          <p className="font-medium">Não foi possível carregar os pedidos.</p>
          <p className="mt-1 text-danger">
            A base de dados ainda não tem as tabelas necessárias. Aplique as migrações
            pendentes (0010_orders.sql) e volte a carregar esta página.
          </p>
        </div>
      ) : null}

      <OrdersInbox orders={orders} />
    </div>
  );
}
