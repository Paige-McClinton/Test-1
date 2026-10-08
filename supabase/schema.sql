-- Travel Planner: database setup.
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.

create table if not exists public.trips (
  id          text primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists trips_user_id_idx on public.trips (user_id);

-- Row Level Security: each signed-in user can only see and change their own trips.
alter table public.trips enable row level security;

drop policy if exists "Users can read their own trips" on public.trips;
create policy "Users can read their own trips"
  on public.trips for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can add their own trips" on public.trips;
create policy "Users can add their own trips"
  on public.trips for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own trips" on public.trips;
create policy "Users can update their own trips"
  on public.trips for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own trips" on public.trips;
create policy "Users can delete their own trips"
  on public.trips for delete
  to authenticated
  using ((select auth.uid()) = user_id);
