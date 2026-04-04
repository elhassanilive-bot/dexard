-- 04_storage.sql
insert into storage.buckets (id, name, public)
values ('videos', 'videos', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('thumbnails', 'thumbnails', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
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
