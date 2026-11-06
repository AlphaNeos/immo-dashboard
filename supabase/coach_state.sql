-- Mon Coach : sauvegarde cloud d'un seul document JSON par utilisateur, protégée par RLS.
-- À coller dans Supabase > SQL Editor > Run.
create table if not exists public.coach_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.coach_state enable row level security;

drop policy if exists "coach_select_own" on public.coach_state;
drop policy if exists "coach_insert_own" on public.coach_state;
drop policy if exists "coach_update_own" on public.coach_state;
drop policy if exists "coach_delete_own" on public.coach_state;

create policy "coach_select_own" on public.coach_state for select using (auth.uid() = user_id);
create policy "coach_insert_own" on public.coach_state for insert with check (auth.uid() = user_id);
create policy "coach_update_own" on public.coach_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "coach_delete_own" on public.coach_state for delete using (auth.uid() = user_id);
