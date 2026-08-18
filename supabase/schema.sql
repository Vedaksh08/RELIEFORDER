-- ============================================================
-- Relief Medical — ordering platform schema
-- Run this in Supabase -> SQL Editor -> New query -> Run
-- ============================================================

-- ---------- PROFILES ----------
-- One row per signed-in user. Address + mobile captured at first checkout.
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  mobile      text,
  address     text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Auto-create a profile row whenever someone signs in with Google
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $fn$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id,
          new.raw_user_meta_data->>'full_name',
          new.email)
  on conflict (id) do nothing;
  return new;
end; $fn$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- MEDICINES ----------
create table if not exists medicines (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  brand       text,
  category    text,
  price       numeric(10,2) not null default 0 check (price >= 0),
  stock       integer not null default 0 check (stock >= 0),  -- hard backstop vs oversell
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists medicines_name_idx on medicines (lower(name));

-- ---------- ORDERS ----------
do $blk$ begin
  create type order_status as enum ('placed','accepted','rejected','delivered');
exception when duplicate_object then null; end $blk$;

create table if not exists orders (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  status       order_status not null default 'placed',
  total        numeric(10,2) not null default 0,
  -- delivery details snapshotted at order time
  mobile       text,
  address      text,
  note         text,
  created_at   timestamptz not null default now(),
  accepted_at  timestamptz
);
create index if not exists orders_user_idx on orders (user_id, created_at desc);
create index if not exists orders_status_idx on orders (status, created_at desc);

-- ---------- ORDER ITEMS ----------
-- price is snapshotted so historical orders never change when you reprice.
create table if not exists order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders(id) on delete cascade,
  medicine_id  uuid not null references medicines(id),
  name         text not null,          -- snapshot
  brand        text,                   -- snapshot
  price        numeric(10,2) not null, -- snapshot: price AT ORDER TIME
  qty          integer not null check (qty > 0)
);
create index if not exists order_items_order_idx on order_items (order_id);

-- ============================================================
-- ATOMIC STOCK DECREMENT
-- Order 2 Dolo when stock=100 -> accept -> stock becomes 98.
-- Runs as ONE transaction. Two admins accepting at once cannot oversell:
-- the CHECK (stock >= 0) aborts the whole thing.
-- ============================================================
create or replace function accept_order(p_order_id uuid)
returns void language plpgsql security definer set search_path = public as $fn$
declare
  v_is_admin boolean;
  v_status   order_status;
begin
  select is_admin into v_is_admin from profiles where id = auth.uid();
  if not coalesce(v_is_admin, false) then
    raise exception 'Only an admin can accept orders';
  end if;

  select status into v_status from orders where id = p_order_id for update;
  if v_status is null then raise exception 'Order not found'; end if;
  if v_status <> 'placed' then
    raise exception 'Order already %', v_status;  -- prevents double-decrement
  end if;

  -- lock the medicine rows, then decrement
  perform 1 from medicines m
    join order_items oi on oi.medicine_id = m.id
   where oi.order_id = p_order_id
   for update of m;

  update medicines m
     set stock = m.stock - oi.qty,
         updated_at = now()
    from order_items oi
   where oi.order_id = p_order_id
     and m.id = oi.medicine_id;

  update orders
     set status = 'accepted', accepted_at = now()
   where id = p_order_id;
end; $fn$;

-- Reject (no stock movement, since nothing was decremented at placement)
create or replace function reject_order(p_order_id uuid)
returns void language plpgsql security definer set search_path = public as $fn$
declare v_is_admin boolean;
begin
  select is_admin into v_is_admin from profiles where id = auth.uid();
  if not coalesce(v_is_admin, false) then
    raise exception 'Only an admin can reject orders';
  end if;
  update orders set status = 'rejected'
   where id = p_order_id and status = 'placed';
end; $fn$;

-- ============================================================
-- ROW LEVEL SECURITY
-- Enforced in the DB, so it holds even if someone calls the API directly.
-- ============================================================
alter table profiles    enable row level security;
alter table medicines   enable row level security;
alter table orders      enable row level security;
alter table order_items enable row level security;

-- helper: is the caller an admin?
create or replace function is_admin() returns boolean
language sql security definer stable set search_path = public as $fn$
  select coalesce((select p.is_admin from profiles p where p.id = auth.uid()), false);
$fn$;

-- PROFILES: you see/edit only your own; admins see all
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select
  using (id = auth.uid() or is_admin());
drop policy if exists profiles_update on profiles;
create policy profiles_update on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- MEDICINES: anyone can browse the catalogue; only admin can write
drop policy if exists medicines_select on medicines;
create policy medicines_select on medicines for select using (true);
drop policy if exists medicines_write on medicines;
create policy medicines_write on medicines for all
  using (is_admin()) with check (is_admin());

-- ORDERS: customer sees only their own; admin sees all
drop policy if exists orders_select on orders;
create policy orders_select on orders for select
  using (user_id = auth.uid() or is_admin());
drop policy if exists orders_insert on orders;
create policy orders_insert on orders for insert
  with check (user_id = auth.uid());
drop policy if exists orders_admin_update on orders;
create policy orders_admin_update on orders for update
  using (is_admin()) with check (is_admin());

-- ORDER ITEMS: visible/insertable only via your own order
drop policy if exists order_items_select on order_items;
create policy order_items_select on order_items for select
  using (exists (select 1 from orders o
                  where o.id = order_id
                    and (o.user_id = auth.uid() or is_admin())));
drop policy if exists order_items_insert on order_items;
create policy order_items_insert on order_items for insert
  with check (exists (select 1 from orders o
                       where o.id = order_id and o.user_id = auth.uid()));

-- realtime for the admin order queue
alter publication supabase_realtime add table orders;
