-- ============================================================
-- Migration 03 — advertisements shown on the digital card
-- Safe to run on a live database. Supabase -> SQL Editor -> Run.
-- ============================================================

create table if not exists ads (
  id          uuid primary key default gen_random_uuid(),
  heading     text,
  body        text,
  poster_url  text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists ads_active_idx on ads (is_active, created_at desc);

alter table ads enable row level security;

-- Anyone can read active ads — the card is public and is not signed in.
drop policy if exists ads_select on ads;
create policy ads_select on ads for select using (is_active);

-- Only an admin may create, edit or remove ads.
drop policy if exists ads_write on ads;
create policy ads_write on ads for all
  using (is_admin()) with check (is_admin());

-- Live updates so the card reflects changes without a refresh.
do $blk$ begin
  alter publication supabase_realtime add table ads;
exception when duplicate_object then null; end $blk$;

-- ============================================================
-- STORAGE for poster images
-- ============================================================
insert into storage.buckets (id, name, public)
values ('ad-posters', 'ad-posters', true)
on conflict (id) do nothing;

-- Public read: the card must load posters without a session.
drop policy if exists "ad posters are public" on storage.objects;
create policy "ad posters are public" on storage.objects
  for select using (bucket_id = 'ad-posters');

-- Only admins may upload or delete posters.
drop policy if exists "admins upload ad posters" on storage.objects;
create policy "admins upload ad posters" on storage.objects
  for insert with check (bucket_id = 'ad-posters' and is_admin());

drop policy if exists "admins update ad posters" on storage.objects;
create policy "admins update ad posters" on storage.objects
  for update using (bucket_id = 'ad-posters' and is_admin());

drop policy if exists "admins delete ad posters" on storage.objects;
create policy "admins delete ad posters" on storage.objects
  for delete using (bucket_id = 'ad-posters' and is_admin());
