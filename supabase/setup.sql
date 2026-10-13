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

-- ── reviews guests write on the site; in the admin panel they can be corrected, hidden or deleted
create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 40),
  text text not null check (char_length(text) between 10 and 400),
  city text not null default '' check (char_length(city) <= 30),
  rating int not null check (rating between 1 and 5),
  occasion text not null default 'justbecause',
  color text not null default 'pink',
  stamp text not null default 'roses',
  approved boolean not null default true
);
alter table public.reviews enable row level security;
drop policy if exists "read approved" on public.reviews;
drop policy if exists "guests post" on public.reviews;
drop policy if exists "admins read reviews" on public.reviews;
drop policy if exists "admins change reviews" on public.reviews;
drop policy if exists "admins delete reviews" on public.reviews;
create policy "read approved" on public.reviews for select to anon using (approved);
create policy "guests post" on public.reviews for insert to anon with check (true);
create policy "admins read reviews" on public.reviews for select to authenticated using (public.is_admin());
create policy "admins change reviews" on public.reviews for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete reviews" on public.reviews for delete to authenticated using (public.is_admin());

-- ── photos guests pin to their idea (constructor, order form): anyone may add one, only admins see the list or delete
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ideas', 'ideas', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "guests add idea photos" on storage.objects;
drop policy if exists "admins see idea photos" on storage.objects;
drop policy if exists "admins delete idea photos" on storage.objects;
create policy "guests add idea photos" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'ideas' and (storage.foldername(name))[1] = 'guests');
create policy "admins see idea photos" on storage.objects for select to authenticated using (bucket_id = 'ideas' and public.is_admin());
create policy "admins delete idea photos" on storage.objects for delete to authenticated using (bucket_id = 'ideas' and public.is_admin());

-- ── orders from the cart: a guest can only send one in; the team reads them in the admin panel («Заявки»)
-- an order may only point at photos from the bucket above
create or replace function public.idea_photos_ok(p text[]) returns boolean
language sql immutable as $$
  select coalesce(bool_and(u ~ '^https://[^/?#[:space:]]+/storage/v1/object/public/ideas/guests/[A-Za-z0-9._-]+$'), true) from unnest(p) as u;
$$;

create table if not exists public.orders (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  number text not null check (char_length(number) between 3 and 24),
  name text not null check (char_length(name) between 1 and 80),
  phone text not null default '' check (char_length(phone) <= 40),
  email text not null default '' check (char_length(email) <= 120),
  date text not null default '' check (char_length(date) <= 40),
  way text not null default 'pickup' check (way in ('pickup', 'delivery')),
  address text not null default '' check (char_length(address) <= 300),
  items jsonb not null default '[]' check (jsonb_typeof(items) = 'array' and pg_column_size(items) < 60000),
  total numeric not null default 0 check (total >= 0 and total < 100000),
  comment text not null default '' check (char_length(comment) <= 2000),
  photos text[] not null default '{}' check (cardinality(photos) <= 10 and public.idea_photos_ok(photos)),
  text text not null default '' check (char_length(text) <= 6000),
  status text not null default 'new' check (status in ('new', 'work', 'done'))
);
alter table public.orders enable row level security;
drop policy if exists "guests send orders" on public.orders;
drop policy if exists "admins read orders" on public.orders;
drop policy if exists "admins change orders" on public.orders;
drop policy if exists "admins delete orders" on public.orders;
create policy "guests send orders" on public.orders for insert to anon, authenticated with check (status = 'new');
create policy "admins read orders" on public.orders for select to authenticated using (public.is_admin());
create policy "admins change orders" on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete orders" on public.orders for delete to authenticated using (public.is_admin());

-- ── Telegram: every new order (and its photos) goes to your chat. The bot token and chat are filled in from
-- the admin panel (Заявки → Telegram); they stay in the database, the site never sees them.
create extension if not exists pg_net;

create table if not exists public.telegram (
  id int primary key default 1 check (id = 1),
  bot_token text not null default '',
  chat_id text not null default '',
  admin_url text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.telegram enable row level security;
drop policy if exists "admins manage telegram" on public.telegram;
create policy "admins manage telegram" on public.telegram for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- one call to the Bot API; returns the request id (its answer turns up in net._http_response)
create or replace function public.tg_send(method text, payload jsonb) returns bigint
language plpgsql security definer set search_path = public as $$
declare t public.telegram;
begin
  select * into t from public.telegram where id = 1;
  if t.bot_token is null or t.bot_token = '' or t.chat_id = '' then return null; end if;
  return net.http_post(
    url := 'https://api.telegram.org/bot' || t.bot_token || '/' || method,
    body := payload || jsonb_build_object('chat_id', t.chat_id)
  );
end $$;
revoke execute on function public.tg_send(text, jsonb) from public, anon, authenticated;

create or replace function public.order_to_telegram() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  t public.telegram;
  nl text := chr(10);
  msg text;
  wa text := regexp_replace(new.phone, '[^0-9]', '', 'g');
  n int := cardinality(new.photos);
  media jsonb;
begin
  select * into t from public.telegram where id = 1;
  if t.bot_token is null or t.bot_token = '' or t.chat_id = '' then return new; end if;
  msg := '🎂 ' || new.text;
  -- a Dutch 06… number opens in WhatsApp too
  if wa like '00%' then wa := substr(wa, 3); elsif wa like '0%' then wa := '31' || substr(wa, 2); end if;
  if length(wa) >= 9 then msg := msg || nl || nl || '💬 WhatsApp: https://wa.me/' || wa; end if;
  if n > 0 then msg := msg || nl || '📷 Фото: ' || n || ' — нижче'; end if;
  if t.admin_url like 'https://%' then msg := msg || nl || '🔔 Адмінка: ' || t.admin_url; end if;
  perform public.tg_send('sendMessage', jsonb_build_object('text', left(msg, 4000), 'disable_web_page_preview', true));
  if n = 1 then
    perform public.tg_send('sendPhoto', jsonb_build_object('photo', new.photos[1], 'caption', '📷 ' || new.number));
  elsif n > 1 then
    select jsonb_agg(jsonb_build_object('type', 'photo', 'media', u)
             || case when i = 1 then jsonb_build_object('caption', '📷 ' || new.number) else '{}'::jsonb end order by i)
      into media from unnest(new.photos) with ordinality as x(u, i);
    perform public.tg_send('sendMediaGroup', jsonb_build_object('media', media));
  end if;
  return new;
exception when others then
  return new; -- Telegram must never stop an order from being saved
end $$;
revoke execute on function public.order_to_telegram() from public, anon, authenticated;
drop trigger if exists order_to_telegram on public.orders;
create trigger order_to_telegram after insert on public.orders for each row execute function public.order_to_telegram();

-- the «Надіслати тест» button in the admin panel, and what Telegram answered
create or replace function public.telegram_test() returns bigint
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  return public.tg_send('sendMessage', jsonb_build_object('text', '🍒 Mariday: сповіщення про заявки підключено. Нові заявки з сайту приходитимуть сюди.'));
end $$;
create or replace function public.telegram_result(req bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  select status_code, content, error_msg into r from net._http_response where id = req;
  if not found then return null; end if;
  return jsonb_build_object('status', r.status_code, 'body', r.content, 'error', r.error_msg);
end $$;
revoke execute on function public.telegram_test() from public, anon;
revoke execute on function public.telegram_result(bigint) from public, anon;
grant execute on function public.telegram_test() to authenticated;
grant execute on function public.telegram_result(bigint) to authenticated;

-- ── your email (the same one you add in Authentication → Users)
insert into public.admins (email) values ('krasnovaanastasiia@knu.ua') on conflict do nothing;
