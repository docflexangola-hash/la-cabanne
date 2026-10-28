-- 0007_feedback.sql
-- Feedback privado (sem visibilidade pública).

create table if not exists public.customer_feedback (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('compliment','suggestion','complaint','other')),
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text not null check (char_length(trim(comment)) between 10 and 2000),
  name text check (name is null or char_length(trim(name)) <= 80),
  contact text check (contact is null or char_length(trim(contact)) <= 120),
  status text not null default 'new' check (status in ('new','in_review','resolved','archived')),
  source_path text,
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists customer_feedback_created_at_idx on public.customer_feedback (created_at desc);
create index if not exists customer_feedback_status_idx on public.customer_feedback (status);
create index if not exists customer_feedback_type_idx on public.customer_feedback (type);

create table if not exists public.feedback_internal_notes (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.customer_feedback(id) on delete cascade,
  author_id uuid references public.admin_profiles(id) on delete set null,
  note text not null check (char_length(trim(note)) >= 1),
  created_at timestamptz not null default now()
);

create index if not exists feedback_internal_notes_feedback_idx on public.feedback_internal_notes (feedback_id, created_at);

create trigger customer_feedback_set_updated_at
  before update on public.customer_feedback
  for each row execute function public.set_updated_at();

alter table public.customer_feedback enable row level security;
alter table public.feedback_internal_notes enable row level security;

-- Apenas staff/admin podem ler e gerir feedback
create policy customer_feedback_read_staff
  on public.customer_feedback for select
  to authenticated
  using (public.is_staff());

create policy customer_feedback_update_staff
  on public.customer_feedback for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy feedback_internal_notes_read_staff
  on public.feedback_internal_notes for select
  to authenticated
  using (public.is_staff());

create policy feedback_internal_notes_write_staff
  on public.feedback_internal_notes for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Inserção via service role (API pública protegida)
create policy customer_feedback_insert_service
  on public.customer_feedback for insert
  to service_role
  with check (true);
