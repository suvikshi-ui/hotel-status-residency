-- Hotel logins created by Admin (name, username, password, role).
-- Staff JWT user_metadata.owner_id lets them share the admin's books.

create or replace function public.hotel_owner_id()
returns uuid
language sql
stable
as $$
  select coalesce(
    nullif(auth.jwt() -> 'user_metadata' ->> 'owner_id', '')::uuid,
    auth.uid()
  );
$$;

create table if not exists public.hotel_users (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null default '',
  username text not null,
  password_hash text not null default '',
  role text not null default 'housekeeping',
  created_at timestamptz not null default now(),
  unique (owner_id, username)
);

create unique index if not exists hotel_users_username_idx
  on public.hotel_users (lower(username));

alter table public.hotel_users enable row level security;

drop policy if exists "hotel_users_own" on public.hotel_users;
create policy "hotel_users_own" on public.hotel_users
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

revoke all on public.hotel_users from anon, public;
grant select, insert, update, delete on public.hotel_users to authenticated;

create or replace function public.login_hotel_user(p_username text, p_hash text)
returns table (
  id uuid,
  owner_id uuid,
  name text,
  username text,
  role text
)
language sql
security definer
set search_path = public
as $$
  select u.id, u.owner_id, u.name, u.username, u.role
  from public.hotel_users u
  where lower(u.username) = lower(trim(p_username))
    and u.password_hash = p_hash
  limit 1;
$$;

revoke all on function public.login_hotel_user(text, text) from public;
grant execute on function public.login_hotel_user(text, text) to anon, authenticated;

-- Share the owner's cash book with staff whose JWT carries owner_id.
drop policy if exists "ledger_meta_own" on public.ledger_meta;
create policy "ledger_meta_own" on public.ledger_meta
  for all to authenticated
  using (user_id = public.hotel_owner_id())
  with check (user_id = public.hotel_owner_id());

drop policy if exists "rooms_own" on public.rooms;
create policy "rooms_own" on public.rooms
  for all to authenticated
  using (user_id = public.hotel_owner_id())
  with check (user_id = public.hotel_owner_id());

drop policy if exists "staff_own" on public.staff;
create policy "staff_own" on public.staff
  for all to authenticated
  using (user_id = public.hotel_owner_id())
  with check (user_id = public.hotel_owner_id());

drop policy if exists "expenses_own" on public.expenses;
create policy "expenses_own" on public.expenses
  for all to authenticated
  using (user_id = public.hotel_owner_id())
  with check (user_id = public.hotel_owner_id());

drop policy if exists "balance_received_own" on public.balance_received;
create policy "balance_received_own" on public.balance_received
  for all to authenticated
  using (user_id = public.hotel_owner_id())
  with check (user_id = public.hotel_owner_id());

drop policy if exists "guests_own" on public.guests;
create policy "guests_own" on public.guests
  for all to authenticated
  using (user_id = public.hotel_owner_id())
  with check (user_id = public.hotel_owner_id());

drop policy if exists "food_own" on public.food;
create policy "food_own" on public.food
  for all to authenticated
  using (user_id = public.hotel_owner_id())
  with check (user_id = public.hotel_owner_id());

drop policy if exists "wholesale_own" on public.wholesale;
create policy "wholesale_own" on public.wholesale
  for all to authenticated
  using (user_id = public.hotel_owner_id())
  with check (user_id = public.hotel_owner_id());

drop policy if exists "advances_own" on public.advances;
create policy "advances_own" on public.advances
  for all to authenticated
  using (user_id = public.hotel_owner_id())
  with check (user_id = public.hotel_owner_id());
