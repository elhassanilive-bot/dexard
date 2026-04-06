-- 14_playlist_video_ordering.sql
alter table public.playlist_videos
add column if not exists order_index integer;

with ranked as (
  select
    playlist_id,
    video_id,
    row_number() over (partition by playlist_id order by created_at asc, video_id asc) as rn
  from public.playlist_videos
)
update public.playlist_videos pv
set order_index = ranked.rn
from ranked
where pv.playlist_id = ranked.playlist_id
  and pv.video_id = ranked.video_id
  and (pv.order_index is null or pv.order_index <= 0);

alter table public.playlist_videos
alter column order_index set not null;

alter table public.playlist_videos
alter column order_index set default 1;

create index if not exists idx_playlist_videos_playlist_order
on public.playlist_videos (playlist_id, order_index asc);

create unique index if not exists uq_playlist_videos_playlist_order
on public.playlist_videos (playlist_id, order_index);
