-- Strong RLS: owner from public.users (not JWT metadata).
-- Housekeeping may write complaints + inventory only.
-- Staff cannot change their own role. Table owners still obey RLS.

create or replace function public.app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.users where id = auth.uid() limit 1), '');
$$;

create or replace function public.hotel_owner_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select coalesce(owner_id, id) from public.users where id = auth.uid() limit 1),
    auth.uid()
  );
$$;

revoke all on function public.app_role() from public, anon;
grant execute on function public.app_role() to authenticated;
revoke all on function public.hotel_owner_id() from public, anon;
grant execute on function public.hotel_owner_id() to authenticated;

create table if not exists public.complaints (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  id text not null,
  room_no text not null default '',
  note text not null default '',
  level text not null default 'yellow',
  created_at text not null default '',
  primary key (user_id, id)
);

create table if not exists public.inventory (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  id text not null,
  name text not null default '',
  last_month double precision not null default 0,
  this_month double precision not null default 0,
  notes text not null default '',
  primary key (user_id, id)
);

alter table public.complaints enable row level security;
alter table public.inventory enable row level security;
alter table public.complaints force row level security;
alter table public.inventory force row level security;
alter table public.ledger_meta force row level security;
alter table public.rooms force row level security;
alter table public.staff force row level security;
alter table public.expenses force row level security;
alter table public.balance_received force row level security;
alter table public.guests force row level security;
alter table public.food force row level security;
alter table public.wholesale force row level security;
alter table public.advances force row level security;
alter table public.users force row level security;
alter table public.hotel_users force row level security;

revoke all on public.complaints, public.inventory from anon, public;
grant select, insert, update, delete on public.complaints, public.inventory to authenticated;

-- Ledger books: everyone in the hotel can read; only admin/supervisor write.
do $$
declare
  t text;
begin
  foreach t in array array[
    'ledger_meta','rooms','staff','expenses','balance_received',
    'guests','food','wholesale','advances'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_write', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (user_id = public.hotel_owner_id())',
      t || '_select', t
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (user_id = public.hotel_owner_id() and public.app_role() in (''admin'',''supervisor''))',
      t || '_insert', t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (user_id = public.hotel_owner_id() and public.app_role() in (''admin'',''supervisor'')) with check (user_id = public.hotel_owner_id() and public.app_role() in (''admin'',''supervisor''))',
      t || '_update', t
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (user_id = public.hotel_owner_id() and public.app_role() in (''admin'',''supervisor''))',
      t || '_delete', t
    );
  end loop;
end $$;

drop policy if exists "complaints_select" on public.complaints;
drop policy if exists "complaints_write" on public.complaints;
drop policy if exists "complaints_insert" on public.complaints;
drop policy if exists "complaints_update" on public.complaints;
drop policy if exists "complaints_delete" on public.complaints;
create policy "complaints_select" on public.complaints
  for select to authenticated
  using (user_id = public.hotel_owner_id());
create policy "complaints_insert" on public.complaints
  for insert to authenticated
  with check (user_id = public.hotel_owner_id() and public.app_role() in ('admin','supervisor','housekeeping'));
create policy "complaints_update" on public.complaints
  for update to authenticated
  using (user_id = public.hotel_owner_id() and public.app_role() in ('admin','supervisor','housekeeping'))
  with check (user_id = public.hotel_owner_id() and public.app_role() in ('admin','supervisor','housekeeping'));
create policy "complaints_delete" on public.complaints
  for delete to authenticated
  using (user_id = public.hotel_owner_id() and public.app_role() in ('admin','supervisor','housekeeping'));

drop policy if exists "inventory_select" on public.inventory;
drop policy if exists "inventory_insert" on public.inventory;
drop policy if exists "inventory_update" on public.inventory;
drop policy if exists "inventory_delete" on public.inventory;
create policy "inventory_select" on public.inventory
  for select to authenticated
  using (user_id = public.hotel_owner_id());
create policy "inventory_insert" on public.inventory
  for insert to authenticated
  with check (user_id = public.hotel_owner_id() and public.app_role() in ('admin','supervisor','housekeeping'));
create policy "inventory_update" on public.inventory
  for update to authenticated
  using (user_id = public.hotel_owner_id() and public.app_role() in ('admin','supervisor','housekeeping'))
  with check (user_id = public.hotel_owner_id() and public.app_role() in ('admin','supervisor','housekeeping'));
create policy "inventory_delete" on public.inventory
  for delete to authenticated
  using (user_id = public.hotel_owner_id() and public.app_role() in ('admin','supervisor','housekeeping'));

drop policy if exists "users_own" on public.users;
drop policy if exists "users_select" on public.users;
drop policy if exists "users_insert" on public.users;
drop policy if exists "users_update" on public.users;
drop policy if exists "users_delete" on public.users;
create policy "users_select" on public.users
  for select to authenticated
  using (id = auth.uid() or owner_id = auth.uid());
create policy "users_insert" on public.users
  for insert to authenticated
  with check (
    id = auth.uid()
    or (owner_id = auth.uid() and public.app_role() = 'admin')
  );
create policy "users_update" on public.users
  for update to authenticated
  using (owner_id = auth.uid() and id <> auth.uid() and public.app_role() = 'admin')
  with check (owner_id = auth.uid() and id <> auth.uid() and public.app_role() = 'admin');
create policy "users_delete" on public.users
  for delete to authenticated
  using (owner_id = auth.uid() and id <> auth.uid() and public.app_role() = 'admin');

drop policy if exists "hotel_users_own" on public.hotel_users;
drop policy if exists "hotel_users_admin" on public.hotel_users;
create policy "hotel_users_admin" on public.hotel_users
  for all to authenticated
  using (owner_id = auth.uid() and public.app_role() = 'admin')
  with check (owner_id = auth.uid() and public.app_role() = 'admin');

revoke all on function public.login_hotel_user(text, text) from public;
grant execute on function public.login_hotel_user(text, text) to anon, authenticated;
