-- forum_posts: posts created by users
create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.user_profiles(id) on delete cascade,
  title text not null,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.forum_posts enable row level security;

create policy "forum_posts_select_all"
  on public.forum_posts
  for select
  using (true);

create policy "forum_posts_insert_own"
  on public.forum_posts
  for insert
  with check (auth.uid() = author_id);

create policy "forum_posts_delete_own"
  on public.forum_posts
  for delete
  using (auth.uid() = author_id);

-- forum_reactions: likes/dislikes on posts
create table if not exists public.forum_reactions (
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  type text not null check (type in ('like', 'dislike')),
  primary key (post_id, user_id)
);

alter table public.forum_reactions enable row level security;

create policy "forum_reactions_select_all"
  on public.forum_reactions
  for select
  using (true);

create policy "forum_reactions_insert_own"
  on public.forum_reactions
  for insert
  with check (auth.uid() = user_id);

create policy "forum_reactions_update_own"
  on public.forum_reactions
  for update
  using (auth.uid() = user_id);

create policy "forum_reactions_delete_own"
  on public.forum_reactions
  for delete
  using (auth.uid() = user_id);

-- forum_comments: comments on posts
create table if not exists public.forum_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  author_id uuid not null references public.user_profiles(id) on delete cascade,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.forum_comments enable row level security;

create policy "forum_comments_select_all"
  on public.forum_comments
  for select
  using (true);

create policy "forum_comments_insert_own"
  on public.forum_comments
  for insert
  with check (auth.uid() = author_id);

create policy "forum_comments_delete_own"
  on public.forum_comments
  for delete
  using (auth.uid() = author_id);

-- forum_comment_reactions: likes/dislikes on comments
create table if not exists public.forum_comment_reactions (
  comment_id uuid not null references public.forum_comments(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  type text not null check (type in ('like', 'dislike')),
  primary key (comment_id, user_id)
);

alter table public.forum_comment_reactions enable row level security;

create policy "forum_comment_reactions_select_all"
  on public.forum_comment_reactions
  for select
  using (true);

create policy "forum_comment_reactions_insert_own"
  on public.forum_comment_reactions
  for insert
  with check (auth.uid() = user_id);

create policy "forum_comment_reactions_update_own"
  on public.forum_comment_reactions
  for update
  using (auth.uid() = user_id);

create policy "forum_comment_reactions_delete_own"
  on public.forum_comment_reactions
  for delete
  using (auth.uid() = user_id);

-- storage bucket for post images
insert into storage.buckets (id, name, public)
values ('forum-images', 'forum-images', true)
on conflict (id) do nothing;

create policy "forum_images_select_all"
  on storage.objects
  for select
  using (bucket_id = 'forum-images');

create policy "forum_images_insert_own"
  on storage.objects
  for insert
  with check (
    bucket_id = 'forum-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
