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
