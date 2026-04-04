-- 11_pinned_videos.sql
alter table public.videos
add column if not exists is_pinned boolean not null default false;

alter table public.videos
add column if not exists pinned_at timestamptz;

create or replace function public.handle_video_pin_state()
returns trigger
language plpgsql
as $$
begin
  if new.is_pinned then
    if tg_op = 'INSERT' or coalesce(old.is_pinned, false) = false then
      new.pinned_at = now();
    elsif new.pinned_at is null then
      new.pinned_at = old.pinned_at;
    end if;
  else
    new.pinned_at = null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_videos_pin_state on public.videos;
create trigger trg_videos_pin_state
before insert or update of is_pinned, pinned_at on public.videos
for each row execute function public.handle_video_pin_state();

update public.videos
set pinned_at = coalesce(pinned_at, now())
where is_pinned = true and pinned_at is null;

create index if not exists idx_videos_user_pin_order
on public.videos (user_id, is_pinned desc, pinned_at desc, created_at desc);
