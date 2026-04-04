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
