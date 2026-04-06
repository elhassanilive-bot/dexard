-- 12_video_menu_actions.sql
create table if not exists public.hidden_videos (
  user_id uuid not null references public.profiles(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

create index if not exists idx_hidden_videos_user_created
on public.hidden_videos (user_id, created_at desc);

alter table public.hidden_videos enable row level security;

drop policy if exists "hidden_videos_select_self" on public.hidden_videos;
create policy "hidden_videos_select_self"
on public.hidden_videos for select
using (auth.uid() = user_id);

drop policy if exists "hidden_videos_insert_self" on public.hidden_videos;
create policy "hidden_videos_insert_self"
on public.hidden_videos for insert
with check (auth.uid() = user_id);

drop policy if exists "hidden_videos_delete_self" on public.hidden_videos;
create policy "hidden_videos_delete_self"
on public.hidden_videos for delete
using (auth.uid() = user_id);

create table if not exists public.blocked_channels (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_channel_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_channel_id),
  check (blocker_id <> blocked_channel_id)
);

create index if not exists idx_blocked_channels_blocker_created
on public.blocked_channels (blocker_id, created_at desc);

alter table public.blocked_channels enable row level security;

drop policy if exists "blocked_channels_select_self" on public.blocked_channels;
create policy "blocked_channels_select_self"
on public.blocked_channels for select
using (auth.uid() = blocker_id);

drop policy if exists "blocked_channels_insert_self" on public.blocked_channels;
create policy "blocked_channels_insert_self"
on public.blocked_channels for insert
with check (auth.uid() = blocker_id);

drop policy if exists "blocked_channels_delete_self" on public.blocked_channels;
create policy "blocked_channels_delete_self"
on public.blocked_channels for delete
using (auth.uid() = blocker_id);

create table if not exists public.video_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists idx_video_reports_reporter_created
on public.video_reports (reporter_id, created_at desc);

create index if not exists idx_video_reports_video_created
on public.video_reports (video_id, created_at desc);

alter table public.video_reports enable row level security;

drop policy if exists "video_reports_select_self" on public.video_reports;
create policy "video_reports_select_self"
on public.video_reports for select
using (auth.uid() = reporter_id);

drop policy if exists "video_reports_insert_self" on public.video_reports;
create policy "video_reports_insert_self"
on public.video_reports for insert
with check (auth.uid() = reporter_id);
