-- Social: profiles, follows, and visibility of dishes/recipes/photos.
--
-- Visibility rule (can_view): you can see a user's content if it's yours, if
-- their account is public, or if you're an *accepted* follower. Accounts are
-- private by default, so existing data stays hidden until a user opts in.

-- 1. Profiles -----------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text check (char_length(display_name) <= 50),
  bio text check (char_length(bio) <= 160),
  is_private boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Any logged-in user can look people up (needed for search and feeds).
drop policy if exists "Profiles are visible to logged-in users" on public.profiles;
create policy "Profiles are visible to logged-in users" on public.profiles
  for select to authenticated using (true);

drop policy if exists "Users can create own profile" on public.profiles;
create policy "Users can create own profile" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- 2. Follows ------------------------------------------------------------------
create table if not exists public.follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists follows_following_idx on public.follows (following_id, status);

alter table public.follows enable row level security;

-- Accepted follows are public (follower counts/lists); pending requests are
-- only visible to the two people involved.
drop policy if exists "Follows are visible" on public.follows;
create policy "Follows are visible" on public.follows
  for select to authenticated
  using (status = 'accepted'
         or follower_id = (select auth.uid())
         or following_id = (select auth.uid()));

-- You can only follow as yourself. Following a private account (or someone
-- without a profile) must start as a pending request.
drop policy if exists "Users can follow" on public.follows;
create policy "Users can follow" on public.follows
  for insert to authenticated
  with check (
    follower_id = (select auth.uid())
    and (
      status = 'pending'
      or exists (select 1 from public.profiles p
                 where p.id = following_id and not p.is_private)
    )
  );

-- Only the person being followed can accept, and only the status can change.
drop policy if exists "Users can accept requests" on public.follows;
create policy "Users can accept requests" on public.follows
  for update to authenticated
  using (following_id = (select auth.uid()))
  with check (following_id = (select auth.uid()) and status = 'accepted');

revoke update on public.follows from authenticated, anon;
grant update (status) on public.follows to authenticated;

-- Unfollow / cancel a request (follower), or remove / decline (followed).
drop policy if exists "Users can unfollow or remove followers" on public.follows;
create policy "Users can unfollow or remove followers" on public.follows
  for delete to authenticated
  using (follower_id = (select auth.uid()) or following_id = (select auth.uid()));

-- 3. Visibility helper --------------------------------------------------------
-- security definer so it can read follows/profiles regardless of the caller's
-- RLS; search_path pinned so it can't be hijacked.
create or replace function public.can_view(owner uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select owner = auth.uid()
    or exists (select 1 from public.profiles p
               where p.id = owner and not p.is_private)
    or exists (select 1 from public.follows f
               where f.follower_id = auth.uid()
                 and f.following_id = owner
                 and f.status = 'accepted');
$$;

revoke execute on function public.can_view(uuid) from public, anon;
grant execute on function public.can_view(uuid) to authenticated;

-- 4. Let permitted viewers read dishes, recipes, and photos -------------------
drop policy if exists "Visible dishes can be read" on public.dishes;
create policy "Visible dishes can be read" on public.dishes
  for select to authenticated using (public.can_view(user_id));

drop policy if exists "Visible recipes can be read" on public.user_recipes;
create policy "Visible recipes can be read" on public.user_recipes
  for select to authenticated using (public.can_view(user_id));

-- Photo paths start with the owner's user id. Guard the uuid cast so a
-- malformed folder name can't error.
drop policy if exists "dish photos: read visible" on storage.objects;
create policy "dish photos: read visible" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'dish-photos'
    and case
      when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
        then public.can_view(((storage.foldername(name))[1])::uuid)
      else false
    end
  );

create index if not exists dishes_user_created_idx on public.dishes (user_id, created_at desc);

-- 5. Keep can_view out of the public API (it was reachable via /rpc/can_view).
-- Policies reference the function itself, so moving it doesn't break them.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
alter function public.can_view(uuid) set schema private;
