-- ============================================================================
-- 026News — Social Platform tables
-- Run this in the Supabase SQL Editor (or via supabase db). Idempotent.
-- Provides: short-form posts, post reactions/comments, and community posts.
-- ============================================================================

-- ── Posts (Twitter/X-style short feed) ─────────────────────────────────────
create table if not exists public.posts (
  post_id        bigint generated always as identity primary key,
  user_id        integer not null references public.users(user_id) on delete cascade,
  content        text    not null,
  image_urls     text[]  default null,
  tags           text[]  default null,
  like_count     integer not null default 0,
  comment_count  integer not null default 0,
  share_count    integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists posts_user_id_idx     on public.posts (user_id);
create index if not exists posts_created_at_idx  on public.posts (created_at desc);

-- ── Post likes ─────────────────────────────────────────────────────────────
create table if not exists public.post_likes (
  like_id   bigint generated always as identity primary key,
  post_id   bigint  not null references public.posts(post_id) on delete cascade,
  user_id   integer not null references public.users(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);
create index if not exists post_likes_post_id_idx on public.post_likes (post_id);

-- ── Post comments (threaded) ────────────────────────────────────────────────
create table if not exists public.post_comments (
  comment_id        bigint generated always as identity primary key,
  post_id           bigint  not null references public.posts(post_id) on delete cascade,
  user_id           integer not null references public.users(user_id) on delete cascade,
  parent_comment_id bigint  default null references public.post_comments(comment_id) on delete cascade,
  comment_text      text    not null,
  like_count        integer not null default 0,
  created_at        timestamptz not null default now()
);
create index if not exists post_comments_post_id_idx on public.post_comments (post_id);

-- ── Community posts (posts inside a thread/community) ───────────────────────
create table if not exists public.thread_posts (
  post_id    bigint generated always as identity primary key,
  thread_id  uuid    not null references public.threads(id) on delete cascade,
  user_id    integer not null references public.users(user_id) on delete cascade,
  content    text    not null,
  image_urls text[]  default null,
  like_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists thread_posts_thread_id_idx on public.thread_posts (thread_id);

-- ── Extend existing threads table for communities ──────────────────────────
alter table public.threads add column if not exists description text default '';
alter table public.threads add column if not exists is_public boolean not null default true;

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.posts         enable row level security;
alter table public.post_likes    enable row level security;
alter table public.post_comments enable row level security;
alter table public.thread_posts  enable row level security;

-- posts: anyone authenticated can read; owner can write
drop policy if exists "posts_select" on public.posts;
create policy "posts_select" on public.posts for select using (true);
drop policy if exists "posts_insert" on public.posts;
create policy "posts_insert" on public.posts for insert with check (auth.uid() is not null);
drop policy if exists "posts_update" on public.posts;
create policy "posts_update" on public.posts for update using (
  user_id = (select user_id from public.users where auth_id = auth.uid())
);
drop policy if exists "posts_delete" on public.posts;
create policy "posts_delete" on public.posts for delete using (
  user_id = (select user_id from public.users where auth_id = auth.uid())
);

-- post_likes
drop policy if exists "post_likes_select" on public.post_likes;
create policy "post_likes_select" on public.post_likes for select using (true);
drop policy if exists "post_likes_insert" on public.post_likes;
create policy "post_likes_insert" on public.post_likes for insert with check (auth.uid() is not null);
drop policy if exists "post_likes_delete" on public.post_likes;
create policy "post_likes_delete" on public.post_likes for delete using (
  user_id = (select user_id from public.users where auth_id = auth.uid())
);

-- post_comments
drop policy if exists "post_comments_select" on public.post_comments;
create policy "post_comments_select" on public.post_comments for select using (true);
drop policy if exists "post_comments_insert" on public.post_comments;
create policy "post_comments_insert" on public.post_comments for insert with check (auth.uid() is not null);
drop policy if exists "post_comments_delete" on public.post_comments;
create policy "post_comments_delete" on public.post_comments for delete using (
  user_id = (select user_id from public.users where auth_id = auth.uid())
);

-- thread_posts
drop policy if exists "thread_posts_select" on public.thread_posts;
create policy "thread_posts_select" on public.thread_posts for select using (true);
drop policy if exists "thread_posts_insert" on public.thread_posts;
create policy "thread_posts_insert" on public.thread_posts for insert with check (auth.uid() is not null);
drop policy if exists "thread_posts_delete" on public.thread_posts;
create policy "thread_posts_delete" on public.thread_posts for delete using (
  user_id = (select user_id from public.users where auth_id = auth.uid())
);

-- ── Trigger: keep like/comment counts in sync ──────────────────────────────
create or replace function public.increment_post_like_count()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts set like_count = like_count + 1 where post_id = new.post_id;
  elsif (tg_op = 'DELETE') then
    update public.posts set like_count = greatest(like_count - 1, 0) where post_id = new.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists post_likes_count_trg on public.post_likes;
create trigger post_likes_count_trg
  after insert or delete on public.post_likes
  for each row execute function public.increment_post_like_count();

create or replace function public.increment_post_comment_count()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts set comment_count = comment_count + 1 where post_id = new.post_id;
  elsif (tg_op = 'DELETE') then
    update public.posts set comment_count = greatest(comment_count - 1, 0) where post_id = new.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists post_comments_count_trg on public.post_comments;
create trigger post_comments_count_trg
  after insert or delete on public.post_comments
  for each row execute function public.increment_post_comment_count();

-- thread_posts comment/like counts are intentionally simple (no separate like table);
-- keep a like_count in sync if a future table is added. For now ensure index only.

-- ── Storage bucket for post media ────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('posts', 'posts', true, 8388608, array['image/jpeg','image/png','image/webp','image/gif','image/avif'])
on conflict (id) do nothing;

drop policy if exists "Public post media read" on storage.objects;
create policy "Public post media read" on storage.objects for select using (bucket_id = 'posts');
drop policy if exists "Auth upload post media" on storage.objects;
create policy "Auth upload post media" on storage.objects for insert with check (bucket_id = 'posts' and auth.role() = 'authenticated');
drop policy if exists "Owner delete post media" on storage.objects;
create policy "Owner delete post media" on storage.objects for delete using (bucket_id = 'posts' and auth.uid() = owner);

-- ── Saved posts (bookmarks) ─────────────────────────────────────────────────
create table if not exists public.post_saves (
  save_id  bigint generated always as identity primary key,
  post_id  bigint  not null references public.posts(post_id) on delete cascade,
  user_id  integer not null references public.users(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);
create index if not exists post_saves_user_id_idx on public.post_saves (user_id);

alter table public.post_saves enable row level security;
drop policy if exists "post_saves_select" on public.post_saves;
create policy "post_saves_select" on public.post_saves for select using (
  user_id = (select user_id from public.users where auth_id = auth.uid())
);
drop policy if exists "post_saves_insert" on public.post_saves;
create policy "post_saves_insert" on public.post_saves for insert with check (auth.uid() is not null);
drop policy if exists "post_saves_delete" on public.post_saves;
create policy "post_saves_delete" on public.post_saves for delete using (
  user_id = (select user_id from public.users where auth_id = auth.uid())
);

do $$
begin
  alter publication supabase_realtime add table public.post_saves;
exception when duplicate_object then null;
end $$;

-- ── Realtime for social tables ───────────────────────────────────────────────
do $$
begin
  begin
    alter publication supabase_realtime add table public.posts;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.post_likes;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.post_comments;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.thread_posts;
  exception when duplicate_object then null;
  end;
end $$;

-- ── Notification triggers (persist likes/comments on posts) ──────────────────
create or replace function public.notify_post_like()
returns trigger language plpgsql as $$
declare
  v_owner integer;
  v_actor text;
begin
  select p.user_id into v_owner from public.posts p where p.post_id = new.post_id;
  select name into v_actor from public.users where user_id = (
    select user_id from public.users where auth_id = auth.uid()
  );
  if v_owner is not null and v_owner <> (
    select user_id from public.users where auth_id = auth.uid()
  ) then
    insert into public.notifications (user_id, type, title, message, actor_name, actor_id, link)
    values (
      v_owner, 'post_like', 'New Like',
      v_actor || ' liked your post', v_actor,
      (select user_id from public.users where auth_id = auth.uid()),
      '/social?post=' || new.post_id::text
    );
  end if;
  return null;
end;
$$;

drop trigger if exists post_like_notify_trg on public.post_likes;
create trigger post_like_notify_trg
  after insert on public.post_likes
  for each row execute function public.notify_post_like();

create or replace function public.notify_post_comment()
returns trigger language plpgsql as $$
declare
  v_owner integer;
  v_actor text;
begin
  select p.user_id into v_owner from public.posts p where p.post_id = new.post_id;
  select name into v_actor from public.users where user_id = new.user_id;
  if v_owner is not null and v_owner <> new.user_id then
    insert into public.notifications (user_id, type, title, message, actor_name, actor_id, link)
    values (
      v_owner, 'post_comment', 'New Comment',
      v_actor || ' commented on your post', v_actor, new.user_id,
      '/social?post=' || new.post_id::text
    );
  end if;
  return null;
end;
$$;

drop trigger if exists post_comment_notify_trg on public.post_comments;
create trigger post_comment_notify_trg
  after insert on public.post_comments
  for each row execute function public.notify_post_comment();
