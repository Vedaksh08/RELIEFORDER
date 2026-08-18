-- ============================================================
-- Migration 02 — dispatched status, timestamps, admin order visibility
-- Safe to run on a live database. Run AFTER schema.sql.
-- Supabase -> SQL Editor -> New query -> Run
-- ============================================================

-- 1) New status between accepted and delivered.
--    (Postgres cannot add enum values inside a transaction block in older
--     versions; run this statement on its own if it complains.)
alter type order_status add value if not exists 'dispatched' after 'accepted';

-- 2) Lifecycle timestamps
alter table orders add column if not exists dispatched_at timestamptz;
alter table orders add column if not exists delivered_at  timestamptz;

-- 3) THE FIX for "1 pending but no orders shown".
--    orders.user_id references auth.users, so PostgREST had no relationship
--    to embed profiles through — the admin query failed and the list came
--    back empty while the stats (which do not join) still counted the row.
--    This FK makes orders -> profiles a real, embeddable relationship.
alter table orders drop constraint if exists orders_profile_fk;
alter table orders
  add constraint orders_profile_fk
  foreign key (user_id) references profiles(id) on delete cascade;

-- 4) Backfill profiles for anyone who signed in before the trigger existed,
--    otherwise the FK above cannot be added and old orders show no customer.
insert into profiles (id, full_name, email)
select u.id,
       u.raw_user_meta_data->>'full_name',
       u.email
  from auth.users u
 where not exists (select 1 from profiles p where p.id = u.id)
on conflict (id) do nothing;

-- 5) Admins must be able to read every customer's profile to show names on
--    the order queue. (profiles_select already allows this via is_admin(),
--    re-asserted here in case an older policy is in place.)
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select
  using (id = auth.uid() or is_admin());

-- 6) Realtime for order_items too, so the admin queue fills in line items
--    the instant an order lands.
do $blk$ begin
  alter publication supabase_realtime add table order_items;
exception when duplicate_object then null; end $blk$;
