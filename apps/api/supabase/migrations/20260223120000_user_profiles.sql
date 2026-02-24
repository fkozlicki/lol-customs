-- user_profiles: anonymous users with nickname and avatar
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null unique,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

-- anyone can read profiles (needed to show author info on posts/comments)
create policy "profiles_select_all"
  on public.user_profiles
  for select
  using (true);

-- only the owner can insert their own profile
create policy "profiles_insert_own"
  on public.user_profiles
  for insert
  with check (auth.uid() = id);

-- only the owner can update their own profile
create policy "profiles_update_own"
  on public.user_profiles
  for update
  using (auth.uid() = id);

-- storage bucket for user avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- anyone can read avatars
create policy "avatars_select_all"
  on storage.objects
  for select
  using (bucket_id = 'avatars');

-- authenticated users can upload to their own folder
create policy "avatars_insert_own"
  on storage.objects
  for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- authenticated users can update files in their own folder
create policy "avatars_update_own"
  on storage.objects
  for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
