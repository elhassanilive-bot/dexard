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

-- BEGIN 06_comment_reactions.sql
-- 06_comment_reactions.sql
create table if not exists public.video_comment_reactions (
  comment_id uuid not null references public.video_comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction smallint not null check (reaction in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index if not exists idx_comment_reactions_comment on public.video_comment_reactions (comment_id);
create index if not exists idx_comment_reactions_user on public.video_comment_reactions (user_id);

alter table public.video_comment_reactions enable row level security;

drop policy if exists "comment_reactions_select_all" on public.video_comment_reactions;
create policy "comment_reactions_select_all" on public.video_comment_reactions for select using (true);

drop policy if exists "comment_reactions_insert_self" on public.video_comment_reactions;
create policy "comment_reactions_insert_self" on public.video_comment_reactions for insert with check (auth.uid() = user_id);

drop policy if exists "comment_reactions_update_self" on public.video_comment_reactions;
create policy "comment_reactions_update_self" on public.video_comment_reactions for update using (auth.uid() = user_id);

drop policy if exists "comment_reactions_delete_self" on public.video_comment_reactions;
create policy "comment_reactions_delete_self" on public.video_comment_reactions for delete using (auth.uid() = user_id);

drop trigger if exists trg_video_comment_reactions_updated_at on public.video_comment_reactions;
create trigger trg_video_comment_reactions_updated_at
before update on public.video_comment_reactions
for each row execute function public.handle_updated_at();

-- END 06_comment_reactions.sql

-- BEGIN 07_avatar_storage.sql
-- 07_avatar_storage.sql
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatar_storage_select_public" on storage.objects;
create policy "avatar_storage_select_public"
on storage.objects for select
using (bucket_id = 'avatars');

drop policy if exists "avatar_storage_insert_auth" on storage.objects;
create policy "avatar_storage_insert_auth"
on storage.objects for insert
to authenticated
with check (bucket_id = 'avatars' and owner = auth.uid());

drop policy if exists "avatar_storage_update_owner" on storage.objects;
create policy "avatar_storage_update_owner"
on storage.objects for update
to authenticated
using (bucket_id = 'avatars' and owner = auth.uid())
with check (bucket_id = 'avatars' and owner = auth.uid());

drop policy if exists "avatar_storage_delete_owner" on storage.objects;
create policy "avatar_storage_delete_owner"
on storage.objects for delete
to authenticated
using (bucket_id = 'avatars' and owner = auth.uid());

-- END 07_avatar_storage.sql

-- BEGIN 08_profile_cover_and_storage.sql
-- 08_profile_cover_and_storage.sql
alter table public.profiles
add column if not exists cover_url text;

insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

drop policy if exists "cover_storage_select_public" on storage.objects;
create policy "cover_storage_select_public"
on storage.objects for select
using (bucket_id = 'covers');

drop policy if exists "cover_storage_insert_auth" on storage.objects;
create policy "cover_storage_insert_auth"
on storage.objects for insert
to authenticated
with check (bucket_id = 'covers' and owner = auth.uid());

drop policy if exists "cover_storage_update_owner" on storage.objects;
create policy "cover_storage_update_owner"
on storage.objects for update
to authenticated
using (bucket_id = 'covers' and owner = auth.uid())
with check (bucket_id = 'covers' and owner = auth.uid());

drop policy if exists "cover_storage_delete_owner" on storage.objects;
create policy "cover_storage_delete_owner"
on storage.objects for delete
to authenticated
using (bucket_id = 'covers' and owner = auth.uid());

-- END 08_profile_cover_and_storage.sql

-- BEGIN 09_watch_history.sql
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

-- END 09_watch_history.sql

-- BEGIN 10_notifications.sql
-- 10_notifications.sql
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  video_id uuid references public.videos(id) on delete cascade,
  comment_id uuid references public.video_comments(id) on delete cascade,
  type text not null check (type in ('video_liked','video_disliked','video_commented','comment_replied','video_saved','channel_subscribed')),
  dedupe_key text not null unique,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists idx_notifications_recipient_created on public.notifications (recipient_id, created_at desc);
create index if not exists idx_notifications_type on public.notifications (type, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_self" on public.notifications;
create policy "notifications_select_self" on public.notifications for select using (auth.uid() = recipient_id);

drop policy if exists "notifications_update_self" on public.notifications;
create policy "notifications_update_self" on public.notifications for update using (auth.uid() = recipient_id);

drop policy if exists "notifications_delete_self" on public.notifications;
create policy "notifications_delete_self" on public.notifications for delete using (auth.uid() = recipient_id);

create or replace function public.notify_upsert(
  p_recipient_id uuid,
  p_actor_id uuid,
  p_video_id uuid,
  p_comment_id uuid,
  p_type text,
  p_dedupe_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_recipient_id is null or p_actor_id is null or p_recipient_id = p_actor_id then
    return;
  end if;

  insert into public.notifications (
    recipient_id,
    actor_id,
    video_id,
    comment_id,
    type,
    dedupe_key,
    created_at,
    read_at
  )
  values (
    p_recipient_id,
    p_actor_id,
    p_video_id,
    p_comment_id,
    p_type,
    p_dedupe_key,
    now(),
    null
  )
  on conflict (dedupe_key)
  do update
  set
    actor_id = excluded.actor_id,
    video_id = excluded.video_id,
    comment_id = excluded.comment_id,
    type = excluded.type,
    created_at = now(),
    read_at = null;
end;
$$;

create or replace function public.trg_notify_video_reaction_upsert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
  dedupe text;
begin
  select user_id into owner_id from public.videos where id = new.video_id;

  if owner_id is null or owner_id = new.user_id then
    return new;
  end if;

  if new.reaction = 1 then
    dedupe := concat('video_liked:', new.video_id::text, ':', new.user_id::text);
    perform public.notify_upsert(owner_id, new.user_id, new.video_id, null, 'video_liked', dedupe);
    delete from public.notifications where dedupe_key = concat('video_disliked:', new.video_id::text, ':', new.user_id::text);
  elsif new.reaction = -1 then
    dedupe := concat('video_disliked:', new.video_id::text, ':', new.user_id::text);
    perform public.notify_upsert(owner_id, new.user_id, new.video_id, null, 'video_disliked', dedupe);
    delete from public.notifications where dedupe_key = concat('video_liked:', new.video_id::text, ':', new.user_id::text);
  end if;

  return new;
end;
$$;

create or replace function public.trg_notify_video_reaction_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.notifications
  where dedupe_key in (
    concat('video_liked:', old.video_id::text, ':', old.user_id::text),
    concat('video_disliked:', old.video_id::text, ':', old.user_id::text)
  );

  return old;
end;
$$;

drop trigger if exists trg_notify_video_reaction_upsert on public.video_reactions;
create trigger trg_notify_video_reaction_upsert
after insert or update on public.video_reactions
for each row execute function public.trg_notify_video_reaction_upsert();

drop trigger if exists trg_notify_video_reaction_delete on public.video_reactions;
create trigger trg_notify_video_reaction_delete
after delete on public.video_reactions
for each row execute function public.trg_notify_video_reaction_delete();

create or replace function public.trg_notify_video_comment_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
  parent_owner_id uuid;
begin
  if new.parent_id is null then
    select user_id into owner_id from public.videos where id = new.video_id;
    perform public.notify_upsert(
      owner_id,
      new.user_id,
      new.video_id,
      new.id,
      'video_commented',
      concat('video_commented:', new.id::text)
    );
  else
    select user_id into parent_owner_id from public.video_comments where id = new.parent_id;
    perform public.notify_upsert(
      parent_owner_id,
      new.user_id,
      new.video_id,
      new.id,
      'comment_replied',
      concat('comment_replied:', new.id::text)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_video_comment_insert on public.video_comments;
create trigger trg_notify_video_comment_insert
after insert on public.video_comments
for each row execute function public.trg_notify_video_comment_insert();

create or replace function public.trg_notify_saved_video_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  select user_id into owner_id from public.videos where id = new.video_id;

  perform public.notify_upsert(
    owner_id,
    new.user_id,
    new.video_id,
    null,
    'video_saved',
    concat('video_saved:', new.video_id::text, ':', new.user_id::text)
  );

  return new;
end;
$$;

create or replace function public.trg_notify_saved_video_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.notifications
  where dedupe_key = concat('video_saved:', old.video_id::text, ':', old.user_id::text);

  return old;
end;
$$;

drop trigger if exists trg_notify_saved_video_insert on public.saved_videos;
create trigger trg_notify_saved_video_insert
after insert on public.saved_videos
for each row execute function public.trg_notify_saved_video_insert();

drop trigger if exists trg_notify_saved_video_delete on public.saved_videos;
create trigger trg_notify_saved_video_delete
after delete on public.saved_videos
for each row execute function public.trg_notify_saved_video_delete();

create or replace function public.trg_notify_subscription_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_upsert(
    new.channel_id,
    new.subscriber_id,
    null,
    null,
    'channel_subscribed',
    concat('channel_subscribed:', new.channel_id::text, ':', new.subscriber_id::text)
  );

  return new;
end;
$$;

create or replace function public.trg_notify_subscription_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.notifications
  where dedupe_key = concat('channel_subscribed:', old.channel_id::text, ':', old.subscriber_id::text);

  return old;
end;
$$;

drop trigger if exists trg_notify_subscription_insert on public.subscriptions;
create trigger trg_notify_subscription_insert
after insert on public.subscriptions
for each row execute function public.trg_notify_subscription_insert();

drop trigger if exists trg_notify_subscription_delete on public.subscriptions;
create trigger trg_notify_subscription_delete
after delete on public.subscriptions
for each row execute function public.trg_notify_subscription_delete();

-- END 10_notifications.sql
