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
