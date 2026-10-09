-- Mariday Cake — what the admin panel (/admin) needs in Supabase.
-- Supabase → SQL Editor → New query → paste this whole file → Run. Safe to run again.
-- In the last line, put the email you sign in to the admin panel with.

-- ── who may edit: only emails listed here (signing up alone gives no rights)
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;
drop policy if exists "admins see themselves" on public.admins;
create policy "admins see themselves" on public.admins for select to authenticated
  using (email = auth.jwt() ->> 'email');

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where email = auth.jwt() ->> 'email');
$$;

-- ── the site's data: one row per collection (cakes, desserts, flavors, faq, contacts…)
create table if not exists public.content (
  key text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.content enable row level security;
drop policy if exists "everyone reads content" on public.content;
drop policy if exists "admins write content" on public.content;
create policy "everyone reads content" on public.content for select to anon, authenticated using (true);
create policy "admins write content" on public.content for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ── texts and photos edited right on a page (?edit=1)
create table if not exists public.page_edits (
  id bigint generated always as identity primary key,
  page text not null,
  sel text not null,
  kind text not null check (kind in ('text', 'html', 'img', 'bg', 'video', 'href')),
  value text not null,
  updated_at timestamptz not null default now(),
  unique (page, sel)
);
alter table public.page_edits enable row level security;
drop policy if exists "everyone reads edits" on public.page_edits;
drop policy if exists "admins write edits" on public.page_edits;
create policy "everyone reads edits" on public.page_edits for select to anon, authenticated using (true);
create policy "admins write edits" on public.page_edits for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ── photos and videos: public to look at, only admins upload or delete
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'video/mp4', 'video/webm'])
on conflict (id) do update set public = true;

drop policy if exists "everyone sees media" on storage.objects;
drop policy if exists "admins upload media" on storage.objects;
drop policy if exists "admins change media" on storage.objects;
drop policy if exists "admins delete media" on storage.objects;
create policy "everyone sees media" on storage.objects for select to anon, authenticated using (bucket_id = 'media');
create policy "admins upload media" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
create policy "admins change media" on storage.objects for update to authenticated using (bucket_id = 'media' and public.is_admin());
create policy "admins delete media" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_admin());

-- ── your email (the same one you add in Authentication → Users)
insert into public.admins (email) values ('your@email.com') on conflict do nothing;
