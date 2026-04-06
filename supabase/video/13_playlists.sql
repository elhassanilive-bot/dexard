-- 13_playlists.sql
create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  privacy text not null default 'private' check (privacy in ('private', 'unlisted', 'public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, title)
);

create index if not exists idx_playlists_owner_created
on public.playlists (owner_id, created_at desc);

create table if not exists public.playlist_videos (
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  added_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (playlist_id, video_id)
);

create index if not exists idx_playlist_videos_playlist_created
on public.playlist_videos (playlist_id, created_at desc);

create index if not exists idx_playlist_videos_video_created
on public.playlist_videos (video_id, created_at desc);

alter table public.playlists enable row level security;
alter table public.playlist_videos enable row level security;

drop policy if exists "playlists_select_visible" on public.playlists;
create policy "playlists_select_visible"
on public.playlists for select
using (privacy = 'public' or owner_id = auth.uid());

drop policy if exists "playlists_insert_owner" on public.playlists;
create policy "playlists_insert_owner"
on public.playlists for insert
with check (owner_id = auth.uid());

drop policy if exists "playlists_update_owner" on public.playlists;
create policy "playlists_update_owner"
on public.playlists for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "playlists_delete_owner" on public.playlists;
create policy "playlists_delete_owner"
on public.playlists for delete
using (owner_id = auth.uid());

drop policy if exists "playlist_videos_select_visible" on public.playlist_videos;
create policy "playlist_videos_select_visible"
on public.playlist_videos for select
using (
  exists (
    select 1
    from public.playlists p
    where p.id = playlist_id
      and (p.privacy = 'public' or p.owner_id = auth.uid())
  )
);

drop policy if exists "playlist_videos_insert_owner" on public.playlist_videos;
create policy "playlist_videos_insert_owner"
on public.playlist_videos for insert
with check (
  exists (
    select 1
    from public.playlists p
    where p.id = playlist_id
      and p.owner_id = auth.uid()
  )
);

drop policy if exists "playlist_videos_delete_owner" on public.playlist_videos;
create policy "playlist_videos_delete_owner"
on public.playlist_videos for delete
using (
  exists (
    select 1
    from public.playlists p
    where p.id = playlist_id
      and p.owner_id = auth.uid()
  )
);

drop trigger if exists trg_playlists_updated_at on public.playlists;
create trigger trg_playlists_updated_at
before update on public.playlists
for each row execute function public.handle_updated_at();
