-- 99_run_all_supabase_editor.sql
-- Compatible with Supabase SQL Editor

-- BEGIN 00_extensions.sql
-- 00_extensions.sql
create extension if not exists pgcrypto;

-- END 00_extensions.sql

-- BEGIN 01_core_schema.sql
-- 01_core_schema.sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  channel_username text not null,
  title text not null,
  description text,
  keywords text[] not null default '{}',
  category text not null default 'general',
  video_path text not null,
  thumbnail_path text,
  duration_sec integer not null default 0,
  size_bytes bigint not null default 0,
  views_count bigint not null default 0,
  likes_count integer not null default 0,
  dislikes_count integer not null default 0,
  comments_count integer not null default 0,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  subscriber_id uuid not null references public.profiles(id) on delete cascade,
  channel_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (subscriber_id, channel_id),
  check (subscriber_id <> channel_id)
);

create table if not exists public.video_reactions (
  video_id uuid not null references public.videos(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction smallint not null check (reaction in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (video_id, user_id)
);

create table if not exists public.video_comments (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.video_comments(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_videos_created_at on public.videos (created_at desc);
create index if not exists idx_videos_views on public.videos (views_count desc);
create index if not exists idx_videos_channel on public.videos (channel_username);
create index if not exists idx_video_comments_video on public.video_comments (video_id, created_at);

-- END 01_core_schema.sql

-- BEGIN 02_triggers_and_functions.sql
-- 02_triggers_and_functions.sql
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.handle_updated_at();

drop trigger if exists trg_videos_updated_at on public.videos;
create trigger trg_videos_updated_at
before update on public.videos
for each row execute function public.handle_updated_at();

drop trigger if exists trg_video_reactions_updated_at on public.video_reactions;
create trigger trg_video_reactions_updated_at
before update on public.video_reactions
for each row execute function public.handle_updated_at();

drop trigger if exists trg_video_comments_updated_at on public.video_comments;
create trigger trg_video_comments_updated_at
before update on public.video_comments
for each row execute function public.handle_updated_at();

create or replace function public.increment_video_views(target_video_id uuid)
returns bigint
language plpgsql
security definer
as $$
declare
  next_count bigint;
begin
  update public.videos
  set views_count = views_count + 1
  where id = target_video_id
  returning views_count into next_count;

  return coalesce(next_count, 0);
end;
$$;

grant execute on function public.increment_video_views(uuid) to anon, authenticated;

-- END 02_triggers_and_functions.sql

-- BEGIN 03_rls_policies.sql
-- 03_rls_policies.sql
alter table public.profiles enable row level security;
alter table public.videos enable row level security;
alter table public.subscriptions enable row level security;
alter table public.video_reactions enable row level security;
alter table public.video_comments enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles for update using (auth.uid() = id);

drop policy if exists "videos_select_published" on public.videos;
create policy "videos_select_published" on public.videos for select using (status = 'published');

drop policy if exists "videos_insert_owner" on public.videos;
create policy "videos_insert_owner" on public.videos for insert with check (auth.uid() = user_id);

drop policy if exists "videos_update_owner" on public.videos;
create policy "videos_update_owner" on public.videos for update using (auth.uid() = user_id);

drop policy if exists "subscriptions_select_all" on public.subscriptions;
create policy "subscriptions_select_all" on public.subscriptions for select using (true);

drop policy if exists "subscriptions_insert_self" on public.subscriptions;
create policy "subscriptions_insert_self" on public.subscriptions for insert with check (auth.uid() = subscriber_id);

drop policy if exists "subscriptions_delete_self" on public.subscriptions;
create policy "subscriptions_delete_self" on public.subscriptions for delete using (auth.uid() = subscriber_id);

drop policy if exists "reactions_select_all" on public.video_reactions;
create policy "reactions_select_all" on public.video_reactions for select using (true);

drop policy if exists "reactions_insert_self" on public.video_reactions;
create policy "reactions_insert_self" on public.video_reactions for insert with check (auth.uid() = user_id);

drop policy if exists "reactions_update_self" on public.video_reactions;
create policy "reactions_update_self" on public.video_reactions for update using (auth.uid() = user_id);

drop policy if exists "reactions_delete_self" on public.video_reactions;
create policy "reactions_delete_self" on public.video_reactions for delete using (auth.uid() = user_id);

drop policy if exists "comments_select_all" on public.video_comments;
create policy "comments_select_all" on public.video_comments for select using (true);

drop policy if exists "comments_insert_self" on public.video_comments;
create policy "comments_insert_self" on public.video_comments for insert with check (auth.uid() = user_id);

drop policy if exists "comments_update_self" on public.video_comments;
create policy "comments_update_self" on public.video_comments for update using (auth.uid() = user_id);

drop policy if exists "comments_delete_self" on public.video_comments;
create policy "comments_delete_self" on public.video_comments for delete using (auth.uid() = user_id);

-- END 03_rls_policies.sql

-- BEGIN 04_storage.sql
-- 04_storage.sql
insert into storage.buckets (id, name, public)
values ('videos', 'videos', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('thumbnails', 'thumbnails', false)
on conflict (id) do nothing;

drop policy if exists "video_storage_select_signed" on storage.objects;
create policy "video_storage_select_signed"
on storage.objects for select
using (bucket_id in ('videos', 'thumbnails'));

drop policy if exists "video_storage_insert_auth" on storage.objects;
create policy "video_storage_insert_auth"
on storage.objects for insert
to authenticated
with check (bucket_id in ('videos', 'thumbnails'));

drop policy if exists "video_storage_update_owner" on storage.objects;
create policy "video_storage_update_owner"
on storage.objects for update
to authenticated
using (bucket_id in ('videos', 'thumbnails') and owner = auth.uid())
with check (bucket_id in ('videos', 'thumbnails') and owner = auth.uid());

drop policy if exists "video_storage_delete_owner" on storage.objects;
create policy "video_storage_delete_owner"
on storage.objects for delete
to authenticated
using (bucket_id in ('videos', 'thumbnails') and owner = auth.uid());

-- END 04_storage.sql



-- BEGIN 05_saved_videos.sql
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

-- END 05_saved_videos.sql
