-- 0003_access_control.sql
-- Perfis administrativos, configurações do restaurante e Row Level Security.

-- ------------------------------------------------------------- admin_profiles

create table public.admin_profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  role         public.admin_role not null default 'manager',
  display_name text not null check (char_length(trim(display_name)) between 1 and 80),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger admin_profiles_set_updated_at
  before update on public.admin_profiles
  for each row execute function public.set_updated_at();

-- Novos utilizadores entram como 'manager' e inactivos; um admin activa e promove.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_profiles (id, role, display_name, is_active)
  values (
    new.id,
    'manager',
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1)),
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ----------------------------------------------------------------- helpers

create or replace function public.current_role()
returns public.admin_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.admin_profiles p
  where p.id = auth.uid()
    and p.is_active
  limit 1;
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles p
    where p.id = auth.uid()
      and p.is_active
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() = 'admin', false);
$$;

revoke all on function public.current_role() from public;
revoke all on function public.is_staff() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.current_role() to anon, authenticated;
grant execute on function public.is_staff() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ----------------------------------------------------- restaurant_settings

create table public.restaurant_settings (
  id               smallint primary key default 1 check (id = 1),
  name             text not null default 'La Cabanne',
  logo_path        text,
  phone            text,
  whatsapp         text,
  email            text,
  address          text,
  hours            jsonb not null default '{}'::jsonb,
  socials          jsonb not null default '{}'::jsonb,
  info_message     text,
  is_open_override boolean,
  updated_by       uuid references public.admin_profiles (id) on delete set null,
  updated_at       timestamptz not null default now()
);

create trigger restaurant_settings_set_updated_at
  before update on public.restaurant_settings
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------- RLS

alter table public.menu_groups        enable row level security;
alter table public.categories         enable row level security;
alter table public.products           enable row level security;
alter table public.variant_groups     enable row level security;
alter table public.product_variants   enable row level security;
alter table public.admin_profiles     enable row level security;
alter table public.restaurant_settings enable row level security;

-- menu_groups
create policy menu_groups_read_public
  on public.menu_groups for select
  to anon
  using (is_active);

create policy menu_groups_read_staff
  on public.menu_groups for select
  to authenticated
  using (public.is_staff() or is_active);

create policy menu_groups_write_staff
  on public.menu_groups for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- categories
create policy categories_read_public
  on public.categories for select
  to anon
  using (
    is_active
    and exists (
      select 1 from public.menu_groups g
      where g.id = categories.group_id and g.is_active
    )
  );

create policy categories_read_staff
  on public.categories for select
  to authenticated
  using (
    public.is_staff()
    or (
      is_active
      and exists (
        select 1 from public.menu_groups g
        where g.id = categories.group_id and g.is_active
      )
    )
  );

create policy categories_write_staff
  on public.categories for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- products
create policy products_read_public
  on public.products for select
  to anon
  using (
    status in ('published', 'unavailable')
    and exists (
      select 1
      from public.categories c
      join public.menu_groups g on g.id = c.group_id
      where c.id = products.category_id
        and c.is_active
        and g.is_active
    )
  );

create policy products_read_staff
  on public.products for select
  to authenticated
  using (
    public.is_staff()
    or (
      status in ('published', 'unavailable')
      and exists (
        select 1
        from public.categories c
        join public.menu_groups g on g.id = c.group_id
        where c.id = products.category_id
          and c.is_active
          and g.is_active
      )
    )
  );

create policy products_write_staff
  on public.products for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- variant_groups
create policy variant_groups_read_public
  on public.variant_groups for select
  to anon
  using (
    exists (
      select 1
      from public.products p
      join public.categories c on c.id = p.category_id
      join public.menu_groups g on g.id = c.group_id
      where p.id = variant_groups.product_id
        and p.status in ('published', 'unavailable')
        and c.is_active
        and g.is_active
    )
  );

create policy variant_groups_read_staff
  on public.variant_groups for select
  to authenticated
  using (public.is_staff());

create policy variant_groups_write_staff
  on public.variant_groups for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- product_variants
create policy product_variants_read_public
  on public.product_variants for select
  to anon
  using (
    is_active
    and exists (
      select 1
      from public.variant_groups vg
      join public.products p on p.id = vg.product_id
      join public.categories c on c.id = p.category_id
      join public.menu_groups g on g.id = c.group_id
      where vg.id = product_variants.group_id
        and p.status in ('published', 'unavailable')
        and c.is_active
        and g.is_active
    )
  );

create policy product_variants_read_staff
  on public.product_variants for select
  to authenticated
  using (public.is_staff());

create policy product_variants_write_staff
  on public.product_variants for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- admin_profiles
create policy admin_profiles_read_self
  on public.admin_profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

create policy admin_profiles_admin_write
  on public.admin_profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- restaurant_settings
create policy restaurant_settings_read_public
  on public.restaurant_settings for select
  to anon, authenticated
  using (true);

create policy restaurant_settings_write_staff
  on public.restaurant_settings for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());
