-- 0006_analytics.sql
-- Analytics anónimos (sem cookies, sem fingerprint sensível).

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  anonymous_session_id uuid,
  path text,
  group_slug text,
  category_slug text,
  product_slug text,
  search_query text,
  duration_ms integer,
  referrer text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_occurred_at_idx on public.analytics_events (occurred_at desc);
create index if not exists analytics_events_type_idx on public.analytics_events (event_type);
create index if not exists analytics_events_session_idx on public.analytics_events (anonymous_session_id);

create table if not exists public.analytics_daily_summary (
  id uuid primary key default gen_random_uuid(),
  day date not null unique,
  menu_opens integer not null default 0,
  unique_sessions integer not null default 0,
  product_views integer not null default 0,
  searches integer not null default 0,
  total_active_ms bigint not null default 0,
  top_products jsonb not null default '[]'::jsonb,
  top_categories jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger analytics_daily_summary_set_updated_at
  before update on public.analytics_daily_summary
  for each row execute function public.set_updated_at();

alter table public.analytics_events enable row level security;
alter table public.analytics_daily_summary enable row level security;

-- Apenas admins podem ler analytics
create policy analytics_events_read_admin
  on public.analytics_events for select
  to authenticated
  using (public.is_admin());

create policy analytics_summary_read_admin
  on public.analytics_daily_summary for select
  to authenticated
  using (public.is_admin());

-- Escrita apenas via service role (endpoints protegidos)
create policy analytics_events_insert_service
  on public.analytics_events for insert
  to service_role
  with check (true);

create policy analytics_summary_write_service
  on public.analytics_daily_summary for all
  to service_role
  using (true)
  with check (true);
