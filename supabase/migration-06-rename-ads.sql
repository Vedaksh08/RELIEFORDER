-- ============================================================
-- Migration 06 — rename ads -> promos so ad blockers stop killing it
-- Safe to run on a live database. Run AFTER migrations 03, 04 and 05.
-- Supabase -> SQL Editor -> New query -> Run
-- ============================================================

-- WHY
--
-- Browser shields (Brave, uBlock, AdGuard, many mobile browsers) block any
-- request whose URL contains "ads". Every call to /rest/v1/ads was being
-- cancelled by the browser before it left the machine:
--
--   Failed to load resource: net::ERR_BLOCKED_BY_CLIENT
--
-- That is why deleting appeared to fail and the ad came back on reload: the
-- delete never reached Supabase. No amount of server-side fixing helps,
-- because the request never arrives. The table and bucket have to stop
-- matching the blocklists.
--
-- Existing rows, poster images and policies are preserved.

-- ---------- TABLE ----------
alter table if exists ads rename to promos;

-- Indexes follow the table but keep their old names; rename for clarity.
alter index if exists ads_active_idx rename to promos_active_idx;

-- ---------- POLICIES ----------
-- Policy names are per-table, so recreate them under the new name.
alter table promos enable row level security;

drop policy if exists ads_public_select on promos;
drop policy if exists ads_select on promos;
drop policy if exists ads_write on promos;
drop policy if exists ads_admin_insert on promos;
drop policy if exists ads_admin_update on promos;
drop policy if exists ads_admin_delete on promos;

create policy promos_public_select on promos
  for select using (is_active or is_admin());

create policy promos_admin_insert on promos
  for insert to authenticated with check (is_admin());

create policy promos_admin_update on promos
  for update to authenticated using (is_admin()) with check (is_admin());

create policy promos_admin_delete on promos
  for delete to authenticated using (is_admin());

-- ---------- REALTIME ----------
-- Needed for DELETE events to carry the old row (see migration 04).
alter table promos replica identity full;

do $blk$ begin
  alter publication supabase_realtime add table promos;
exception when duplicate_object then null; end $blk$;

-- ---------- STORAGE ----------
-- "ad-posters" is blocked for the same reason. Create the new bucket; the
-- old one is left in place so existing poster URLs keep working.
insert into storage.buckets (id, name, public)
values ('promo-media', 'promo-media', true)
on conflict (id) do nothing;

drop policy if exists "promo media is public" on storage.objects;
create policy "promo media is public" on storage.objects
  for select using (bucket_id = 'promo-media');

drop policy if exists "admins upload promo media" on storage.objects;
create policy "admins upload promo media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'promo-media' and is_admin());

drop policy if exists "admins update promo media" on storage.objects;
create policy "admins update promo media" on storage.objects
  for update to authenticated
  using (bucket_id = 'promo-media' and is_admin());

drop policy if exists "admins delete promo media" on storage.objects;
create policy "admins delete promo media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'promo-media' and is_admin());

-- Verify:
--   select count(*) from promos;   -- your existing rows, unchanged
