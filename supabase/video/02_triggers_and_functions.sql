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