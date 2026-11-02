-- 0008_analytics_aggregation.sql
-- Agregação diária, KPIs e retenção dos analytics anónimos.

-- Consultas por tipo dentro de um intervalo (resumos e KPIs).
create index if not exists analytics_events_type_occurred_idx
  on public.analytics_events (event_type, occurred_at desc);

-- ------------------------------------------------------ resumo diário

create or replace function public.refresh_analytics_daily_summary(
  p_day date default ((now() at time zone 'Africa/Luanda')::date)
)
returns void
language sql
security definer
set search_path = public
as $$
  with bounds as (
    select
      (p_day::timestamp at time zone 'Africa/Luanda') as start_ts,
      ((p_day + 1)::timestamp at time zone 'Africa/Luanda') as end_ts
  ),
  day_events as (
    select e.*
    from public.analytics_events e
    cross join bounds b
    where e.occurred_at >= b.start_ts
      and e.occurred_at < b.end_ts
  ),
  stats as (
    select
      count(*) filter (where event_type = 'menu_opened') as menu_opens,
      count(distinct anonymous_session_id) as unique_sessions,
      count(*) filter (where event_type = 'product_opened') as product_views,
      count(*) filter (where event_type = 'search_performed') as searches,
      coalesce(sum(duration_ms) filter (where event_type = 'active_time'), 0) as total_active_ms
    from day_events
  ),
  top_products as (
    select coalesce(
      jsonb_agg(jsonb_build_object('slug', product_slug, 'views', total) order by total desc),
      '[]'::jsonb
    ) as value
    from (
      select product_slug, count(*) as total
      from day_events
      where event_type = 'product_opened'
        and product_slug is not null
      group by product_slug
      order by total desc
      limit 5
    ) ranked
  ),
  top_categories as (
    select coalesce(
      jsonb_agg(jsonb_build_object('slug', category_slug, 'views', total) order by total desc),
      '[]'::jsonb
    ) as value
    from (
      select category_slug, count(*) as total
      from day_events
      where event_type = 'category_viewed'
        and category_slug is not null
      group by category_slug
      order by total desc
      limit 5
    ) ranked
  )
  insert into public.analytics_daily_summary (
    day,
    menu_opens,
    unique_sessions,
    product_views,
    searches,
    total_active_ms,
    top_products,
    top_categories
  )
  select
    p_day,
    s.menu_opens,
    s.unique_sessions,
    s.product_views,
    s.searches,
    s.total_active_ms,
    tp.value,
    tc.value
  from stats s
  cross join top_products tp
  cross join top_categories tc
  on conflict (day) do update set
    menu_opens = excluded.menu_opens,
    unique_sessions = excluded.unique_sessions,
    product_views = excluded.product_views,
    searches = excluded.searches,
    total_active_ms = excluded.total_active_ms,
    top_products = excluded.top_products,
    top_categories = excluded.top_categories,
    updated_at = now();
$$;

revoke all on function public.refresh_analytics_daily_summary(date) from public;
grant execute on function public.refresh_analytics_daily_summary(date) to service_role;

-- ------------------------------------------------------ KPIs do painel

create or replace function public.analytics_overview(p_days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_days integer := greatest(1, least(coalesce(p_days, 30), 365));
  v_since timestamptz := now() - make_interval(days => v_days);
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  with period as (
    select *
    from public.analytics_events
    where occurred_at >= v_since
  ),
  totals as (
    select
      count(*) filter (where event_type = 'menu_opened') as menu_opens,
      count(distinct anonymous_session_id) as unique_sessions,
      count(*) filter (where event_type = 'product_opened') as product_opens,
      count(*) filter (where event_type = 'search_performed') as searches,
      count(*) filter (where event_type = 'feedback_opened') as feedback_opens,
      count(distinct anonymous_session_id) filter (where event_type = 'active_time') as active_sessions,
      coalesce(sum(duration_ms) filter (where event_type = 'active_time'), 0) as active_ms,
      coalesce(sum(duration_ms) filter (where event_type = 'product_engagement'), 0) as product_engagement_ms
    from period
  ),
  daily as (
    select
      (occurred_at at time zone 'Africa/Luanda')::date as day,
      count(*) filter (where event_type = 'menu_opened') as menu_opens,
      count(distinct anonymous_session_id) as unique_sessions,
      count(*) filter (where event_type = 'product_opened') as product_opens
    from period
    group by 1
  ),
  top_products as (
    select coalesce(
      jsonb_agg(jsonb_build_object('slug', product_slug, 'views', total) order by total desc),
      '[]'::jsonb
    ) as value
    from (
      select product_slug, count(*) as total
      from period
      where event_type = 'product_opened'
        and product_slug is not null
      group by product_slug
      order by total desc
      limit 8
    ) ranked
  ),
  top_categories as (
    select coalesce(
      jsonb_agg(jsonb_build_object('slug', category_slug, 'views', total) order by total desc),
      '[]'::jsonb
    ) as value
    from (
      select category_slug, count(*) as total
      from period
      where event_type = 'category_viewed'
        and category_slug is not null
      group by category_slug
      order by total desc
      limit 8
    ) ranked
  )
  select jsonb_build_object(
    'days', v_days,
    'totals', (select to_jsonb(t) from totals t),
    'daily', coalesce((select jsonb_agg(to_jsonb(d) order by d.day) from daily d), '[]'::jsonb),
    'top_products', (select value from top_products),
    'top_categories', (select value from top_categories)
  )
  into v_result;

  return v_result;
end;
$$;

revoke all on function public.analytics_overview(integer) from public;
grant execute on function public.analytics_overview(integer) to authenticated, service_role;

-- ------------------------------------------------------ retenção

create or replace function public.purge_analytics_events(
  p_session_days integer default 30,
  p_event_days integer default 90
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_anonymized integer;
  v_deleted integer;
begin
  update public.analytics_events
  set anonymous_session_id = null
  where occurred_at < now() - make_interval(days => greatest(1, p_session_days))
    and anonymous_session_id is not null;
  get diagnostics v_anonymized = row_count;

  delete from public.analytics_events
  where occurred_at < now() - make_interval(days => greatest(p_session_days + 1, p_event_days));
  get diagnostics v_deleted = row_count;

  return jsonb_build_object('anonymized', v_anonymized, 'deleted', v_deleted);
end;
$$;

revoke all on function public.purge_analytics_events(integer, integer) from public;
grant execute on function public.purge_analytics_events(integer, integer) to service_role;
