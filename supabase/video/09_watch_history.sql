-- 09_watch_history.sql
create table if not exists public.watch_history (
  user_id uuid not null references public.profiles(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_watched_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

create index if not exists idx_watch_history_user_last on public.watch_history (user_id, last_watched_at desc);

alter table public.watch_history enable row level security;

drop policy if exists "watch_history_select_self" on public.watch_history;
create policy "watch_history_select_self" on public.watch_history for select using (auth.uid() = user_id);

drop policy if exists "watch_history_insert_self" on public.watch_history;
create policy "watch_history_insert_self" on public.watch_history for insert with check (auth.uid() = user_id);

drop policy if exists "watch_history_update_self" on public.watch_history;
create policy "watch_history_update_self" on public.watch_history for update using (auth.uid() = user_id);

drop policy if exists "watch_history_delete_self" on public.watch_history;
create policy "watch_history_delete_self" on public.watch_history for delete using (auth.uid() = user_id);
