import{r as e}from"./rolldown-runtime-hePW80VL.js";import{Qt as t}from"./store-RM-59nDq.js";import{r as n}from"./utils-CL4fqdWd.js";import{D as r,V as i,et as a,rt as o}from"./index-8hLXO_AB.js";import{n as s,t as c}from"./0009_desk_can_save-nl1VR0ed.js";var l=e(t(),1),u=`-- Hotel Status Residency — per-user cash book
-- RLS: every row is owned by auth.uid(). Anon has no grants.
-- Apply in Supabase SQL editor (or Management API). Idempotent.

create table if not exists public.ledger_meta (
  user_id uuid primary key references auth.users (id) on delete cascade default auth.uid(),
  hotel jsonb not null default '{}'::jsonb,
  opening jsonb not null default '{}'::jsonb,
  opening_date date not null default '2026-09-01',
  selected_date date not null default '2026-09-01',
  security_code text not null default '',
  ota jsonb not null default '[]'::jsonb,
  jan_sales jsonb not null default '[]'::jsonb,
  jan_food jsonb not null default '[]'::jsonb,
  credit_guests jsonb not null default '[]'::jsonb,
  migrated_from text,
  updated_at timestamptz not null default now()
);

create table if not exists public.rooms (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  no text not null,
  floor text not null,
  sort_index integer not null default 0,
  primary key (user_id, no)
);

create table if not exists public.staff (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  id text not null,
  name text not null default '',
  salary double precision not null default 0,
  role text not null default '',
  days text not null default '',
  absent integer not null default 0,
  working integer not null default 0,
  extra double precision not null default 0,
  advance double precision not null default 0,
  week_off integer not null default 0,
  total double precision not null default 0,
  status text not null default '',
  month text not null default '',
  primary key (user_id, id)
);

create table if not exists public.expenses (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  id text not null,
  date date not null,
  mode text not null,
  amount double precision not null default 0,
  particular text not null default '',
  kind text,
  primary key (user_id, id)
);

create table if not exists public.balance_received (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  id text not null,
  date date not null,
  mode text not null,
  amount double precision not null default 0,
  particular text not null default '',
  kind text,
  primary key (user_id, id)
);

create table if not exists public.guests (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  id text not null,
  date date not null,
  sl_no integer not null default 0,
  name text not null default '',
  room_no text not null default '',
  mode text not null,
  amount double precision not null default 0,
  check_in date,
  check_out date,
  in_time text,
  out_time text,
  stay text,
  ac text,
  time text,
  co_date date,
  source text,
  primary key (user_id, id)
);

create table if not exists public.food (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  id text not null,
  date date not null,
  mode text not null,
  amount double precision not null default 0,
  primary key (user_id, id)
);

create table if not exists public.wholesale (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  id text not null,
  date date not null,
  mode text not null,
  amount double precision not null default 0,
  primary key (user_id, id)
);

create table if not exists public.advances (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  id text not null,
  name text not null default '',
  cash double precision not null default 0,
  qrs double precision not null default 0,
  month text not null default '',
  primary key (user_id, id)
);

create index if not exists expenses_user_date_idx on public.expenses (user_id, date);
create index if not exists balance_received_user_date_idx on public.balance_received (user_id, date);
create index if not exists guests_user_date_idx on public.guests (user_id, date);
create index if not exists food_user_date_idx on public.food (user_id, date);
create index if not exists wholesale_user_date_idx on public.wholesale (user_id, date);
create index if not exists staff_user_month_idx on public.staff (user_id, month);

-- RLS on every table — deny by default, then allow the row owner.
alter table public.ledger_meta enable row level security;
alter table public.rooms enable row level security;
alter table public.staff enable row level security;
alter table public.expenses enable row level security;
alter table public.balance_received enable row level security;
alter table public.guests enable row level security;
alter table public.food enable row level security;
alter table public.wholesale enable row level security;
alter table public.advances enable row level security;

drop policy if exists "ledger_meta_own" on public.ledger_meta;
create policy "ledger_meta_own" on public.ledger_meta
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "rooms_own" on public.rooms;
create policy "rooms_own" on public.rooms
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "staff_own" on public.staff;
create policy "staff_own" on public.staff
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "expenses_own" on public.expenses;
create policy "expenses_own" on public.expenses
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "balance_received_own" on public.balance_received;
create policy "balance_received_own" on public.balance_received
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "guests_own" on public.guests;
create policy "guests_own" on public.guests
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "food_own" on public.food;
create policy "food_own" on public.food
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "wholesale_own" on public.wholesale;
create policy "wholesale_own" on public.wholesale
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "advances_own" on public.advances;
create policy "advances_own" on public.advances
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke all on public.ledger_meta, public.rooms, public.staff, public.expenses,
  public.balance_received, public.guests, public.food, public.wholesale, public.advances
  from anon, public;

grant select, insert, update, delete
  on public.ledger_meta, public.rooms, public.staff, public.expenses,
  public.balance_received, public.guests, public.food, public.wholesale, public.advances
  to authenticated;
`,d=`-- Hotel logins created by Admin (name, username, password, role).
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
`,f=`-- App roles live in public.users. After login the client reads role here.
-- Housekeeping (Kali, House, Housekeeping) opens Complaints + Inventory.

create table if not exists public.users (
  id uuid primary key,
  owner_id uuid,
  name text not null default '',
  username text,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

alter table public.users drop constraint if exists users_owner_id_fkey;
alter table public.users add column if not exists owner_id uuid;
alter table public.users add column if not exists name text not null default '';
alter table public.users add column if not exists username text;
alter table public.users add column if not exists role text not null default 'admin';
alter table public.users add column if not exists created_at timestamptz not null default now();

update public.users u
set owner_id = u.id
where u.owner_id is null
  and exists (select 1 from auth.users a where a.id = u.id);

create unique index if not exists users_username_idx
  on public.users (lower(username))
  where username is not null and username <> '';

alter table public.users enable row level security;

drop policy if exists "users_own" on public.users;
create policy "users_own" on public.users
  for all to authenticated
  using (id = auth.uid() or owner_id = auth.uid())
  with check (id = auth.uid() or owner_id = auth.uid());

revoke all on public.users from anon, public;
grant select, insert, update, delete on public.users to authenticated;
`,p=`-- Strong RLS: owner from public.users (not JWT metadata).
-- Housekeeping may write complaints + inventory only.
-- Staff cannot change their own role. Table owners still obey RLS.

create or replace function public.app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif((select role from public.users where id = auth.uid() limit 1), ''),
    'admin'
  );
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

-- Ledger books: everyone in the hotel can read; admin, supervisor and
-- desk staff write. Housekeeping stays on complaints + inventory.
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
      'create policy %I on public.%I for insert to authenticated with check (user_id = public.hotel_owner_id() or user_id = auth.uid())',
      t || '_insert', t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (user_id = public.hotel_owner_id() or user_id = auth.uid()) with check (user_id = public.hotel_owner_id() or user_id = auth.uid())',
      t || '_update', t
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (user_id = public.hotel_owner_id() or user_id = auth.uid())',
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
`,m=`-- Opening balance already lives on ledger_meta.opening / opening_date.
-- Daily register locks become first-class columns (not localStorage, not
-- buried only inside hotel jsonb).

alter table public.ledger_meta
  add column if not exists locked_dates jsonb not null default '{}'::jsonb;

alter table public.ledger_meta
  add column if not exists lock_rev jsonb not null default '{}'::jsonb;

update public.ledger_meta
set
  locked_dates = coalesce(nullif(hotel -> '_lockedDates', 'null'::jsonb), '{}'::jsonb),
  lock_rev = coalesce(nullif(hotel -> '_lockRev', 'null'::jsonb), '{}'::jsonb)
where
  (locked_dates = '{}'::jsonb or locked_dates is null)
  and hotel ? '_lockedDates';
`,h=`-- Saved entries stay frozen on every desk.
-- Housekeeping (Kali) may seal complaints + inventory.

create table if not exists public.sheet_seals (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  id text not null,
  primary key (user_id, id)
);

alter table public.sheet_seals enable row level security;
alter table public.sheet_seals force row level security;

revoke all on public.sheet_seals from anon, public;
grant select, insert, update, delete on public.sheet_seals to authenticated;

drop policy if exists "sheet_seals_select" on public.sheet_seals;
drop policy if exists "sheet_seals_insert" on public.sheet_seals;
drop policy if exists "sheet_seals_update" on public.sheet_seals;
drop policy if exists "sheet_seals_delete" on public.sheet_seals;

create policy "sheet_seals_select" on public.sheet_seals
  for select to authenticated
  using (user_id = public.hotel_owner_id());

create policy "sheet_seals_insert" on public.sheet_seals
  for insert to authenticated
  with check (user_id = public.hotel_owner_id());

create policy "sheet_seals_update" on public.sheet_seals
  for update to authenticated
  using (user_id = public.hotel_owner_id())
  with check (user_id = public.hotel_owner_id());

create policy "sheet_seals_delete" on public.sheet_seals
  for delete to authenticated
  using (user_id = public.hotel_owner_id());
`,g=`-- Daily register Save cube was hitting "permission denied" because
-- sheet_seals had no grant, and staff could not write the books.
-- Seals still live on ledger_meta.hotel._sealedIds even without this table.

create or replace function public.app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif((select role from public.users where id = auth.uid() limit 1), ''),
    'admin'
  );
$$;

revoke all on function public.app_role() from public, anon;
grant execute on function public.app_role() to authenticated;

create table if not exists public.sheet_seals (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  id text not null,
  primary key (user_id, id)
);

alter table public.sheet_seals enable row level security;
alter table public.sheet_seals force row level security;

revoke all on public.sheet_seals from anon, public;
grant select, insert, update, delete on public.sheet_seals to authenticated;

drop policy if exists "sheet_seals_select" on public.sheet_seals;
drop policy if exists "sheet_seals_insert" on public.sheet_seals;
drop policy if exists "sheet_seals_update" on public.sheet_seals;
drop policy if exists "sheet_seals_delete" on public.sheet_seals;

create policy "sheet_seals_select" on public.sheet_seals
  for select to authenticated
  using (user_id = public.hotel_owner_id());

create policy "sheet_seals_insert" on public.sheet_seals
  for insert to authenticated
  with check (user_id = public.hotel_owner_id());

create policy "sheet_seals_update" on public.sheet_seals
  for update to authenticated
  using (user_id = public.hotel_owner_id())
  with check (user_id = public.hotel_owner_id());

create policy "sheet_seals_delete" on public.sheet_seals
  for delete to authenticated
  using (user_id = public.hotel_owner_id());

-- Desk staff post the daily register. Housekeeping still cannot.
do $$
declare
  t text;
begin
  foreach t in array array[
    'ledger_meta','rooms','staff','expenses','balance_received',
    'guests','food','wholesale','advances'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (user_id = public.hotel_owner_id() and public.app_role() in (''admin'',''supervisor'',''staff''))',
      t || '_insert', t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (user_id = public.hotel_owner_id() and public.app_role() in (''admin'',''supervisor'',''staff'')) with check (user_id = public.hotel_owner_id() and public.app_role() in (''admin'',''supervisor'',''staff''))',
      t || '_update', t
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (user_id = public.hotel_owner_id() and public.app_role() in (''admin'',''supervisor'',''staff''))',
      t || '_delete', t
    );
  end loop;
end $$;
`,_=`-- public.users already existed without owner_id.
-- Some rows are not in auth.users, so do not keep a foreign key.

alter table public.users drop constraint if exists users_owner_id_fkey;

alter table public.users add column if not exists owner_id uuid;

update public.users u
set owner_id = u.id
where u.owner_id is null
  and exists (select 1 from auth.users a where a.id = u.id);

alter table public.users enable row level security;

drop policy if exists "users_own" on public.users;
create policy "users_own" on public.users
  for all to authenticated
  using (id = auth.uid() or owner_id = auth.uid())
  with check (id = auth.uid() or owner_id = auth.uid());

revoke all on public.users from anon, public;
grant select, insert, update, delete on public.users to authenticated;
`,v=`-- Staff logins use username@status-residency.local and must be confirmed
-- or Sign in asks for an email. Confirm every auth user so username works.

update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email_confirmed_at is null;
`,y=`-- Create staff username/password without sending a confirmation email.
-- auth.signUp hits "email rate limit exceeded" on this hotel.

create or replace function public.create_staff_login(
  p_name text,
  p_username text,
  p_password text,
  p_hash text,
  p_role text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_owner uuid := auth.uid();
  v_username text;
  v_email text;
  v_id uuid;
  v_instance uuid;
begin
  if v_owner is null then
    raise exception 'Sign in as Admin first';
  end if;
  v_username := lower(regexp_replace(trim(coalesce(p_username, '')), '[^a-z0-9._-]', '', 'g'));
  if length(trim(coalesce(p_name, ''))) = 0 then
    raise exception 'Enter a name';
  end if;
  if length(v_username) < 3 then
    raise exception 'Username must be at least 3 letters';
  end if;
  if length(coalesce(p_password, '')) < 6 then
    raise exception 'Password must be at least 6 characters';
  end if;
  v_email := v_username || '@status-residency.local';

  select id into v_id from auth.users where lower(email) = v_email limit 1;
  if v_id is null then
    v_id := gen_random_uuid();
    select instance_id into v_instance from auth.users where instance_id is not null limit 1;
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) values (
      coalesce(v_instance, '00000000-0000-0000-0000-000000000000'),
      v_id,
      'authenticated',
      'authenticated',
      v_email,
      crypt(p_password, gen_salt('bf')),
      now(),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object(
        'full_name', p_name,
        'username', v_username,
        'role', p_role,
        'owner_id', v_owner::text
      ),
      now(), now(), '', '', '', ''
    );
    begin
      insert into auth.identities (
        provider_id, user_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) values (
        v_id::text, v_id,
        jsonb_build_object('sub', v_id::text, 'email', v_email),
        'email', now(), now(), now()
      );
    exception when undefined_column then
      insert into auth.identities (
        id, user_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) values (
        v_id, v_id,
        jsonb_build_object('sub', v_id::text, 'email', v_email),
        'email', now(), now(), now()
      );
    when unique_violation then
      null;
    end;
  else
    update auth.users
    set encrypted_password = crypt(p_password, gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = jsonb_build_object(
          'full_name', p_name,
          'username', v_username,
          'role', p_role,
          'owner_id', v_owner::text
        ),
        updated_at = now()
    where id = v_id;
  end if;

  insert into public.hotel_users (owner_id, name, username, password_hash, role)
  values (v_owner, trim(p_name), v_username, coalesce(p_hash, ''), p_role)
  on conflict (owner_id, username) do update
    set name = excluded.name,
        password_hash = excluded.password_hash,
        role = excluded.role;

  insert into public.users (id, owner_id, name, username, role)
  values (v_id, v_owner, trim(p_name), v_username, p_role)
  on conflict (id) do update
    set owner_id = excluded.owner_id,
        name = excluded.name,
        username = excluded.username,
        role = excluded.role;

  return jsonb_build_object(
    'id', v_id,
    'owner_id', v_owner,
    'name', trim(p_name),
    'username', v_username,
    'role', p_role
  );
end;
$$;

revoke all on function public.create_staff_login(text, text, text, text, text) from public, anon;
grant execute on function public.create_staff_login(text, text, text, text, text) to authenticated;
`,b=`-- Admin can remove a staff username. Cannot delete their own login.

create or replace function public.delete_staff_login(
  p_id uuid,
  p_username text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_owner uuid := auth.uid();
  v_username text;
  v_email text;
  v_auth uuid;
begin
  if v_owner is null then
    raise exception 'Sign in as Admin first';
  end if;
  v_username := lower(regexp_replace(trim(coalesce(p_username, '')), '[^a-z0-9._-]', '', 'g'));
  v_email := v_username || '@status-residency.local';

  select u.id into v_auth
  from auth.users u
  where (p_id is not null and u.id = p_id)
     or (v_username <> '' and lower(u.email) = v_email)
  limit 1;

  if v_auth is not null and v_auth = v_owner then
    raise exception 'Cannot delete your own login';
  end if;

  delete from public.hotel_users
  where owner_id = v_owner
    and (
      (p_id is not null and id = p_id)
      or (v_username <> '' and lower(username) = v_username)
    );

  delete from public.users
  where (
      (p_id is not null and id = p_id)
      or (v_auth is not null and id = v_auth)
      or (v_username <> '' and lower(username) = v_username)
    )
    and (owner_id = v_owner or id = v_auth)
    and id <> v_owner;

  if v_auth is not null then
    delete from auth.identities where user_id = v_auth;
    delete from auth.users where id = v_auth;
  end if;

  return jsonb_build_object('ok', true, 'username', v_username);
end;
$$;

revoke all on function public.delete_staff_login(uuid, text) from public, anon;
grant execute on function public.delete_staff_login(uuid, text) to authenticated;
`,x=`-- Staff logins share the admin cash book, complaints and inventory.

update public.users
set owner_id = id
where coalesce(role, 'admin') = 'admin'
  and (owner_id is null or owner_id = id);

update public.users staff
set owner_id = admin.id
from public.users admin
where coalesce(admin.role, 'admin') = 'admin'
  and admin.owner_id = admin.id
  and staff.id <> admin.id
  and coalesce(staff.role, 'admin') <> 'admin'
  and (staff.owner_id is null or staff.owner_id = staff.id);

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

revoke all on function public.hotel_owner_id() from public, anon;
grant execute on function public.hotel_owner_id() to authenticated;
`,S=`-- One hotel, one books. SWR / Kali read and write the admin complaints.

create or replace function public.hotel_primary_owner()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select m.user_id
      from public.ledger_meta m
      left join public.guests g on g.user_id = m.user_id
      group by m.user_id, m.updated_at
      order by count(g.id) desc, m.updated_at desc nulls last
      limit 1
    ),
    (
      select id
      from public.users
      where coalesce(role, 'admin') = 'admin'
      order by created_at asc
      limit 1
    ),
    auth.uid()
  );
$$;

create or replace function public.hotel_owner_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select u.owner_id
      from public.users u
      where u.id = auth.uid()
        and u.owner_id is not null
        and u.owner_id <> u.id
      limit 1
    ),
    public.hotel_primary_owner(),
    auth.uid()
  );
$$;

revoke all on function public.hotel_primary_owner() from public, anon;
grant execute on function public.hotel_primary_owner() to authenticated;
revoke all on function public.hotel_owner_id() from public, anon;
grant execute on function public.hotel_owner_id() to authenticated;

update public.users u
set role = h.role,
    owner_id = h.owner_id
from public.hotel_users h
where lower(u.username) = lower(h.username)
  and h.owner_id is not null;

update public.users
set owner_id = public.hotel_primary_owner()
where id <> public.hotel_primary_owner();

update public.users
set owner_id = id
where id = public.hotel_primary_owner();

insert into public.complaints (user_id, id, room_no, note, level, created_at)
select public.hotel_primary_owner(), c.id, c.room_no, c.note, c.level, c.created_at
from public.complaints c
where c.user_id <> public.hotel_primary_owner()
on conflict (user_id, id) do nothing;

insert into public.inventory (user_id, id, name, last_month, this_month, notes)
select public.hotel_primary_owner(), i.id, i.name, i.last_month, i.this_month, i.notes
from public.inventory i
where i.user_id <> public.hotel_primary_owner()
on conflict (user_id, id) do nothing;
`,C=`-- Complaints + inventory must exist on the admin account so SWR can see them.

create table if not exists public.complaints (
  user_id uuid not null default auth.uid(),
  id text not null,
  room_no text not null default '',
  note text not null default '',
  level text not null default 'yellow',
  created_at text not null default '',
  primary key (user_id, id)
);

create table if not exists public.inventory (
  user_id uuid not null default auth.uid(),
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

revoke all on public.complaints, public.inventory from anon, public;
grant select, insert, update, delete on public.complaints, public.inventory to authenticated;

create or replace function public.hotel_owner_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  linked uuid;
  primary_id uuid;
begin
  if uid is null then
    return null;
  end if;
  select u.owner_id into linked
  from public.users u
  where u.id = uid
    and u.owner_id is not null
    and u.owner_id <> u.id
  limit 1;
  if linked is not null then
    return linked;
  end if;
  begin
    select m.user_id into primary_id
    from public.ledger_meta m
    left join public.guests g on g.user_id = m.user_id
    group by m.user_id, m.updated_at
    order by count(g.id) desc, m.updated_at desc nulls last
    limit 1;
  exception when others then
    primary_id := null;
  end;
  return coalesce(primary_id, uid);
end;
$$;

revoke all on function public.hotel_owner_id() from public, anon;
grant execute on function public.hotel_owner_id() to authenticated;

drop policy if exists "complaints_select" on public.complaints;
drop policy if exists "complaints_insert" on public.complaints;
drop policy if exists "complaints_update" on public.complaints;
drop policy if exists "complaints_delete" on public.complaints;
create policy "complaints_select" on public.complaints
  for select to authenticated
  using (user_id = public.hotel_owner_id() or user_id = auth.uid());
create policy "complaints_insert" on public.complaints
  for insert to authenticated
  with check (user_id = public.hotel_owner_id() or user_id = auth.uid());
create policy "complaints_update" on public.complaints
  for update to authenticated
  using (user_id = public.hotel_owner_id() or user_id = auth.uid())
  with check (user_id = public.hotel_owner_id() or user_id = auth.uid());
create policy "complaints_delete" on public.complaints
  for delete to authenticated
  using (user_id = public.hotel_owner_id() or user_id = auth.uid());

drop policy if exists "inventory_select" on public.inventory;
drop policy if exists "inventory_insert" on public.inventory;
drop policy if exists "inventory_update" on public.inventory;
drop policy if exists "inventory_delete" on public.inventory;
create policy "inventory_select" on public.inventory
  for select to authenticated
  using (user_id = public.hotel_owner_id() or user_id = auth.uid());
create policy "inventory_insert" on public.inventory
  for insert to authenticated
  with check (user_id = public.hotel_owner_id() or user_id = auth.uid());
create policy "inventory_update" on public.inventory
  for update to authenticated
  using (user_id = public.hotel_owner_id() or user_id = auth.uid())
  with check (user_id = public.hotel_owner_id() or user_id = auth.uid());
create policy "inventory_delete" on public.inventory
  for delete to authenticated
  using (user_id = public.hotel_owner_id() or user_id = auth.uid());

notify pgrst, 'reload schema';
`,w=n();function T({userId:e}){let[t,n]=(0,l.useState)(!1);return(0,w.jsxs)(`div`,{className:`flex flex-wrap gap-2`,children:[(0,w.jsx)(r,{type:`button`,onClick:()=>{let e=`${u}\n\n${d}\n\n${f}\n\n${p}\n\n${m}\n\n${h}\n\n${g}\n\n${c}\n\n${_}\n\n${v}\n\n${y}\n\n${b}\n\n${x}\n\n${S}\n\n${C}`;s(e)?a.success(`SQL copied. Paste it in the SQL editor, run it, then retry.`):a.error(`Copy blocked on this computer. Open the SQL box on Register instead.`)},children:`Copy table SQL`}),(0,w.jsx)(r,{type:`button`,variant:`outline`,asChild:!0,children:(0,w.jsx)(`a`,{href:o,target:`_blank`,rel:`noreferrer`,children:`Open SQL editor`})}),e?(0,w.jsx)(r,{type:`button`,variant:`outline`,disabled:t,onClick:()=>{n(!0),i(e).finally(()=>n(!1))},children:t?`Checking…`:`Tables are ready`}):null]})}export{d as a,f as i,b as n,y as r,T as t};