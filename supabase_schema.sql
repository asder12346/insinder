-- Run this payload in the Supabase SQL Editor

-- Create the posts table
create table if not exists posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  image_url text not null,
  author_id uuid references auth.users(id) not null,
  status text not null check (status in ('draft', 'published')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create admins table
create table if not exists admins (
  user_id uuid references auth.users(id) primary key
);

-- Create comments table
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade not null,
  content text not null,
  author_id uuid references auth.users(id), -- Nullable for anonymous authors
  author_name text not null,
  created_at timestamp with time zone default now()
);

-- Alter author_id to drop NOT NULL constraint if executing on an existing database
alter table comments alter column author_id drop not null;

-- Enable RLS
alter table posts enable row level security;
alter table admins enable row level security;
alter table comments enable row level security;

-- Create indexes for performance
create index if not exists idx_posts_status_created_at on posts(status, created_at desc);
create index if not exists idx_comments_post_id_created_at on comments(post_id, created_at asc);

-- Drop previous policies to reset
drop policy if exists "Anyone can view published posts" on posts;
drop policy if exists "Admins can view all posts" on posts;
drop policy if exists "Admins can create posts" on posts;
drop policy if exists "Admins can update posts" on posts;
drop policy if exists "Admins can delete posts" on posts;
drop policy if exists "Anyone can view admins" on admins;
drop policy if exists "Anyone can view comments" on comments;
drop policy if exists "Anyone can post comments" on comments;
drop policy if exists "Auth users can post comments" on comments;
drop policy if exists "Auth users can update comments" on comments;
drop policy if exists "Auth users can delete comments" on comments;

-- Admins policy
create policy "Anyone can view admins" on admins for select using (true);

-- Posts Policies
create policy "Anyone can view published posts" on posts for select using (status = 'published');
create policy "Admins can view all posts" on posts for select using (exists (select 1 from admins where user_id = auth.uid()) OR auth.uid() = author_id);
create policy "Admins can create posts" on posts for insert with check (exists (select 1 from admins where user_id = auth.uid()) OR auth.uid() = author_id);
create policy "Admins can update posts" on posts for update using (exists (select 1 from admins where user_id = auth.uid()) OR auth.uid() = author_id);
create policy "Admins can delete posts" on posts for delete using (exists (select 1 from admins where user_id = auth.uid()) OR auth.uid() = author_id);

-- Comments Policies
create policy "Anyone can view comments" on comments for select using (true);
create policy "Anyone can post comments" on comments for insert with check (true);
create policy "Auth users can update comments" on comments for update using (exists (select 1 from admins where user_id = auth.uid()) OR (auth.uid() is not null AND auth.uid() = author_id));
create policy "Auth users can delete comments" on comments for delete using (exists (select 1 from admins where user_id = auth.uid()) OR (auth.uid() is not null AND auth.uid() = author_id));

-- Insert public images bucket if not exists
insert into storage.buckets (id, name, public) 
values ('blog_images', 'blog_images', true)
on conflict (id) do nothing;

drop policy if exists "Images are publicly accessible" on storage.objects;
drop policy if exists "Auth users can upload images" on storage.objects;

create policy "Images are publicly accessible" on storage.objects for select using ( bucket_id = 'blog_images' );
create policy "Auth users can upload images" on storage.objects for insert with check ( bucket_id = 'blog_images' AND auth.role() = 'authenticated' );
