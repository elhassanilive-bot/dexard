-- 05_saved_videos.sql
create table if not exists public.saved_videos (
  user_id uuid not null references public.profiles(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

create index if not exists idx_saved_videos_user_created on public.saved_videos (user_id, created_at desc);

alter table public.saved_videos enable row level security;

drop policy if exists "saved_videos_select_self" on public.saved_videos;
create policy "saved_videos_select_self" on public.saved_videos for select using (auth.uid() = user_id);

drop policy if exists "saved_videos_insert_self" on public.saved_videos;
create policy "saved_videos_insert_self" on public.saved_videos for insert with check (auth.uid() = user_id);

drop policy if exists "saved_videos_delete_self" on public.saved_videos;
create policy "saved_videos_delete_self" on public.saved_videos for delete using (auth.uid() = user_id);
