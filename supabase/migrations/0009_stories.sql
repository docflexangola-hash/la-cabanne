-- 0009_stories.sql
-- Widget flutuante de stories (imagens 9:16) e marcação de destaques.

-- --------------------------------------------------------------- products
alter table public.products
  add column if not exists is_story_highlight boolean not null default false;

create index if not exists products_story_highlight_idx
  on public.products (is_story_highlight)
  where is_story_highlight;

-- ---------------------------------------------------------- story_settings
create table if not exists public.story_settings (
  id               integer primary key default 1 check (id = 1),
  enabled          boolean not null default true,
  mode             text not null default 'auto_all'
                     check (mode in ('manual', 'auto_all', 'auto_highlight')),
  interval_seconds integer not null default 5
                     check (interval_seconds between 3 and 15),
  updated_by       uuid references public.admin_profiles (id) on delete set null,
  updated_at       timestamptz not null default now()
);

insert into public.story_settings (id) values (1)
on conflict (id) do nothing;

create trigger story_settings_set_updated_at
  before update on public.story_settings
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------- story_items
create table if not exists public.story_items (
  id         uuid primary key default gen_random_uuid(),
  item_type  text not null check (item_type in ('product', 'image')),
  product_id uuid references public.products (id) on delete cascade,
  image_path text,
  image_alt  text,
  sort_order integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint story_items_source_check check (
    (item_type = 'product' and product_id is not null and image_path is null)
    or
    (item_type = 'image' and product_id is null and image_path is not null)
  ),
  constraint story_items_alt_check check (
    item_type <> 'image'
    or (image_alt is not null and char_length(trim(image_alt)) between 1 and 200)
  )
);

create index if not exists story_items_active_order_idx
  on public.story_items (is_active, sort_order);

create trigger story_items_set_updated_at
  before update on public.story_items
  for each row execute function public.set_updated_at();

-- --------------------------------------------------------------- analytics
alter table public.analytics_events
  add column if not exists story_id text;

-- -------------------------------------------------------------------- RLS
alter table public.story_settings enable row level security;
alter table public.story_items enable row level security;

-- story_settings
create policy story_settings_read_public
  on public.story_settings for select
  to anon
  using (true);

create policy story_settings_read_staff
  on public.story_settings for select
  to authenticated
  using (true);

create policy story_settings_write_staff
  on public.story_settings for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- story_items
create policy story_items_read_public
  on public.story_items for select
  to anon
  using (is_active);

create policy story_items_read_staff
  on public.story_items for select
  to authenticated
  using (public.is_staff() or is_active);

create policy story_items_write_staff
  on public.story_items for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());
