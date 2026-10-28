-- 0005_audit.sql
-- Histórico de alterações (auditoria).

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.admin_profiles(id) on delete set null,
  actor_email text,
  actor_role public.admin_role,
  entity_type text not null,
  entity_id text,
  action text not null,
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_id);

alter table public.audit_logs enable row level security;

-- Apenas admins podem ver o histórico
create policy audit_logs_read_admin
  on public.audit_logs for select
  to authenticated
  using (public.is_admin());

create policy audit_logs_insert_service_or_staff
  on public.audit_logs for insert
  to authenticated
  with check (public.is_staff());

-- Função genérica para registo de auditoria
create or replace function public.log_audit(
  p_entity_type text,
  p_entity_id text,
  p_action text,
  p_summary text default null,
  p_metadata jsonb default '{}'::jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_email text;
  v_actor_role public.admin_role;
begin
  if v_actor_id is not null then
    select email into v_actor_email from auth.users where id = v_actor_id;
    select role into v_actor_role from public.admin_profiles where id = v_actor_id and is_active;
  end if;

  insert into public.audit_logs (actor_id, actor_email, actor_role, entity_type, entity_id, action, summary, metadata)
  values (v_actor_id, v_actor_email, v_actor_role, p_entity_type, p_entity_id, p_action, p_summary, coalesce(p_metadata, '{}'::jsonb));
end;
$$;

revoke all on function public.log_audit(text,text,text,text,jsonb) from public;
grant execute on function public.log_audit(text,text,text,text,jsonb) to authenticated;
