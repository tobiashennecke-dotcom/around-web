-- ==========================================================
-- Profile picture (2026-11-13). Private storage bucket "avatars",
-- one file per user at <user_id>/avatar.webp, only the owner may read
-- or write it. Additive.
-- ==========================================================
alter table public.profiles
  add column if not exists avatar_path text null,
  add column if not exists avatar_updated_at timestamptz null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 1048576, array['image/webp','image/jpeg','image/png'])
on conflict (id) do update set public = false, file_size_limit = 1048576, allowed_mime_types = array['image/webp','image/jpeg','image/png'];

drop policy if exists "avatars_own_select" on storage.objects;
drop policy if exists "avatars_own_insert" on storage.objects;
drop policy if exists "avatars_own_update" on storage.objects;
drop policy if exists "avatars_own_delete" on storage.objects;

create policy "avatars_own_select" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_own_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_own_update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_own_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
