-- ============================================================
-- Migration 04 — make ad deletion reach every device
-- Safe to run on a live database. Run AFTER migration-03-ads.sql.
-- Supabase -> SQL Editor -> New query -> Run
-- ============================================================

-- THE FIX.
-- Postgres only includes the primary key in a DELETE's replication record by
-- default, and Supabase Realtime needs the whole old row to publish a usable
-- delete event. Without this, deleting an ad was broadcast to nobody: it
-- vanished for the admin who deleted it and stayed on every other device
-- until that person happened to reload.
alter table ads replica identity full;

-- Same reason for the ads still being read on the card: with FULL identity
-- the payload carries old_record, so a client can tell which ad went away.
do $blk$ begin
  alter publication supabase_realtime add table ads;
exception when duplicate_object then null; end $blk$;
