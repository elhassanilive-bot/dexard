-- 03_rls_policies.sql
alter table public.profiles enable row level security;
alter table public.videos enable row level security;
alter table public.subscriptions enable row level security;
alter table public.video_reactions enable row level security;
alter table public.video_comments enable row level security;
alter table public.saved_videos enable row level security;

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

drop policy if exists "saved_videos_select_self" on public.saved_videos;
create policy "saved_videos_select_self" on public.saved_videos for select using (auth.uid() = user_id);

drop policy if exists "saved_videos_insert_self" on public.saved_videos;
create policy "saved_videos_insert_self" on public.saved_videos for insert with check (auth.uid() = user_id);

drop policy if exists "saved_videos_delete_self" on public.saved_videos;
create policy "saved_videos_delete_self" on public.saved_videos for delete using (auth.uid() = user_id);
