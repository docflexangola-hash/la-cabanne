-- 0010_orders.sql
-- Pedidos do menu público: rodadas por sessão/dispositivo, sem leitura pública.

create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  client_order_id  uuid not null unique,
  device_id        uuid not null,
  session_id       uuid not null,
  round_number     integer not null check (round_number >= 1),
  table_label      text check (
    table_label is null or char_length(trim(table_label)) between 1 and 20
  ),
  total            numeric(12,2) not null check (total >= 0),
  item_count       integer not null check (item_count between 1 and 500),
  status           text not null default 'new'
                     check (status in ('new','preparing','served','cancelled')),
  source_path      text,
  ip_hash          text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint orders_session_round_unique unique (session_id, round_number)
);

create table if not exists public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders (id) on delete cascade,
  product_id     uuid references public.products (id) on delete set null,
  product_name   text not null check (char_length(trim(product_name)) between 1 and 120),
  variant_label  text check (
    variant_label is null or char_length(trim(variant_label)) between 1 and 120
  ),
  unit_price     numeric(12,2) not null check (unit_price >= 0),
  quantity       integer not null check (quantity between 1 and 99),
  line_total     numeric(12,2) not null check (line_total >= 0),
  created_at     timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_session_idx on public.orders (session_id, round_number);
create index if not exists orders_device_idx on public.orders (device_id, created_at desc);
create index if not exists order_items_order_idx on public.order_items (order_id);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Staff lê e actualiza o estado das rodadas.
create policy orders_read_staff
  on public.orders for select
  to authenticated
  using (public.is_staff());

create policy orders_update_staff
  on public.orders for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy order_items_read_staff
  on public.order_items for select
  to authenticated
  using (public.is_staff());

-- Escrita só via service role (API pública protegida), como no feedback.
create policy orders_insert_service
  on public.orders for insert
  to service_role
  with check (true);

create policy order_items_insert_service
  on public.order_items for insert
  to service_role
  with check (true);
