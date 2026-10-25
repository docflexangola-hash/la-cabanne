-- 0002_menu_schema.sql
-- Estrutura do cardápio: grupos, categorias, produtos e variantes.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- menu_groups

create table public.menu_groups (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(trim(name)) between 1 and 60),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  display_order integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index menu_groups_display_order_idx
  on public.menu_groups (display_order, name);

create trigger menu_groups_set_updated_at
  before update on public.menu_groups
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- categories

create table public.categories (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.menu_groups (id) on delete restrict,
  name          text not null check (char_length(trim(name)) between 1 and 60),
  slug          text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  display_order integer not null default 0,
  is_active     boolean not null default true,
  image_path    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint categories_group_slug_unique unique (group_id, slug)
);

create index categories_group_order_idx
  on public.categories (group_id, display_order, name);

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------ products

create table public.products (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid not null references public.categories (id) on delete restrict,
  name          text not null check (char_length(trim(name)) between 1 and 120),
  slug          text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description   text,
  base_price    numeric(12, 2),
  price_note    text,
  image_path    text,
  image_alt     text,
  tags          text[] not null default '{}',
  allergens     text[] not null default '{}',
  serves        text,
  status        public.product_status not null default 'draft',
  display_order integer not null default 0,
  published_at  timestamptz,
  created_by    uuid,
  updated_by    uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint products_category_slug_unique unique (category_id, slug),
  constraint products_price_present check (base_price is not null or price_note is not null),
  constraint products_price_non_negative check (base_price is null or base_price >= 0),
  constraint products_published_at_present check (status <> 'published' or published_at is not null)
);

create index products_category_status_order_idx
  on public.products (category_id, status, display_order, name);

create index products_status_idx on public.products (status);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------- variant_groups

create table public.variant_groups (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products (id) on delete cascade,
  name          text not null check (char_length(trim(name)) between 1 and 60),
  display_order integer not null default 0,
  is_required   boolean not null default true,
  created_at    timestamptz not null default now(),
  constraint variant_groups_product_name_unique unique (product_id, name)
);

create index variant_groups_product_order_idx
  on public.variant_groups (product_id, display_order);

-- ------------------------------------------------------------ product_variants

create table public.product_variants (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.variant_groups (id) on delete cascade,
  name          text not null check (char_length(trim(name)) between 1 and 60),
  price         numeric(12, 2) not null check (price >= 0),
  display_order integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  constraint product_variants_group_name_unique unique (group_id, name)
);

create index product_variants_group_order_idx
  on public.product_variants (group_id, display_order);
