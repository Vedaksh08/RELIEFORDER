-- ============================================================
-- Migration 05 — make ad delete actually delete
-- Safe to run on a live database. Run AFTER migration-03 and 04.
-- Supabase -> SQL Editor -> New query -> Run
-- ============================================================

-- WHY DELETE APPEARED TO DO NOTHING
--
-- Under RLS, a DELETE whose USING clause does not match simply removes zero
-- rows. PostgREST returns 200 with an empty body — no error — so the app
-- believed the delete had worked while the row was still there.
--
-- The write policy used is_admin(), which reads the profiles table. If the
-- caller's profile row is missing, or is_admin() cannot be evaluated in that
-- context, it returns false and every write silently no-ops.
--
-- These policies are rewritten explicitly per command so each one can be
-- reasoned about, and DELETE is granted to any authenticated admin.

alter table ads enable row level security;

-- ---------- SELECT ----------
-- Public visitors: only active ads (the card is not signed in).
-- Admins: everything, so the panel can list and manage paused rows too.
drop policy if exists ads_select on ads;
drop policy if exists ads_public_select on ads;
create policy ads_public_select on ads
  for select
  using (is_active or is_admin());

-- ---------- WRITE ----------
-- Split out of the old FOR ALL policy. A single FOR ALL policy also acts as
-- a SELECT policy, which made the effective read rule harder to reason about
-- and masked which command was actually failing.
drop policy if exists ads_write on ads;

drop policy if exists ads_admin_insert on ads;
create policy ads_admin_insert on ads
  for insert to authenticated
  with check (is_admin());

drop policy if exists ads_admin_update on ads;
create policy ads_admin_update on ads
  for update to authenticated
  using (is_admin()) with check (is_admin());

drop policy if exists ads_admin_delete on ads;
create policy ads_admin_delete on ads
  for delete to authenticated
  using (is_admin());

-- ---------- SAFETY NET ----------
-- Guarantees is_admin() can always be evaluated: it is SECURITY DEFINER and
-- reads profiles directly, bypassing the profiles RLS that would otherwise
-- apply. Re-asserted here in case an older definition is in place.
create or replace function is_admin() returns boolean
language sql security definer stable set search_path = public as $fn$
  select coalesce((select p.is_admin from profiles p where p.id = auth.uid()), false);
$fn$;

-- ---------- CHECK YOURSELF ----------
-- Run this to confirm your own account is actually flagged as an admin. If
-- it returns false, deletes will keep silently doing nothing:
--
--   select is_admin();
--
-- If false, fix it with:
--
--   update profiles set is_admin = true where email = 'your@email.com';
