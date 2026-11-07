-- "Want to try" list + dish photos. Run this in the Supabase SQL editor
-- (after 20261107_add_location_price_visit.sql).

-- 1. Want to try: a dish is either "tried" (has a rating) or "want_to_try".
alter table public.dishes
  add column if not exists status text not null default 'tried'
    check (status in ('tried', 'want_to_try')),
  add column if not exists photo_path text;

-- Want-to-try items don't have a rating yet.
alter table public.dishes alter column rating drop not null;

alter table public.dishes drop constraint if exists dishes_tried_needs_rating;
alter table public.dishes add constraint dishes_tried_needs_rating
  check (status = 'want_to_try' or rating is not null);

-- 2. Photos: a private bucket. Each user can only read and write files inside
-- a folder named after their own user id (e.g. "<user-id>/abc.jpg").
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dish-photos', 'dish-photos', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "dish photos: read own" on storage.objects;
create policy "dish photos: read own" on storage.objects
  for select to authenticated
  using (bucket_id = 'dish-photos'
         and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "dish photos: upload own" on storage.objects;
create policy "dish photos: upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'dish-photos'
              and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "dish photos: update own" on storage.objects;
create policy "dish photos: update own" on storage.objects
  for update to authenticated
  using (bucket_id = 'dish-photos'
         and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "dish photos: delete own" on storage.objects;
create policy "dish photos: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'dish-photos'
         and (storage.foldername(name))[1] = (select auth.uid())::text);
