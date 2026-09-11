import{it as e,tt as t}from"./store-B3yUW8jZ.js";import{D as n,F as r,G as i,I as a,K as o,L as s,M as c,P as l,R as u,a as d,j as f,o as p,z as m}from"./index-BqwhRajO.js";import{i as h,n as g,r as _,t as v}from"./tabs-C1jUkooz.js";var y=e(t(),1),b=`-- Hotel Status Residency — per-user cash book
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
`,x=`-- Hotel logins created by Admin (name, username, password, role).
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
`,S=`-- App roles live in public.users. After login the client reads role here.
-- Housekeeping only opens the complaint sheet.

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  owner_id uuid references auth.users (id) on delete cascade,
  name text not null default '',
  username text,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

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
`,C=`-- Strong RLS: owner from public.users (not JWT metadata).
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
`,w=o();function T({userId:e}){let[t,i]=(0,y.useState)(!1);return(0,w.jsxs)(`div`,{className:`flex flex-wrap gap-2`,children:[(0,w.jsx)(n,{type:`button`,onClick:()=>{navigator.clipboard.writeText(`${b}\n\n${x}\n\n${S}\n\n${C}`).then(()=>r.success(`SQL copied. Paste it in the SQL editor, run it, then retry.`),()=>r.error(`Could not copy SQL`))},children:`Copy table SQL`}),(0,w.jsx)(n,{type:`button`,variant:`outline`,asChild:!0,children:(0,w.jsx)(`a`,{href:s,target:`_blank`,rel:`noreferrer`,children:`Open SQL editor`})}),e?(0,w.jsx)(n,{type:`button`,variant:`outline`,disabled:t,onClick:()=>{i(!0),c(e).finally(()=>i(!1))},children:t?`Checking…`:`Tables are ready`}):null]})}function E(){let{signIn:e,signUp:t,configured:o}=f(),s=i(),[c,b]=(0,y.useState)(`signin`),[x,S]=(0,y.useState)(!1),[C,E]=(0,y.useState)(``),[D,O]=(0,y.useState)(``),[k,A]=(0,y.useState)(``),[j,M]=(0,y.useState)(``),[N,P]=(0,y.useState)(!1);(0,y.useEffect)(()=>{if(!o)return;let e=!0;return a().from(`rooms`).select(`no`).limit(1).then(({error:t})=>{e&&t&&l(t)&&P(!0)}),()=>{e=!1}},[o]);async function F(t){if(t.preventDefault(),!C.trim()||!D){r.error(`Enter email and password`);return}S(!0);try{await e(C,D),r.success(`Signed in`),s({to:`/`})}catch(e){r.error(e instanceof Error?e.message:`Sign-in failed`)}finally{S(!1)}}async function I(e){if(e.preventDefault(),!k.trim()){r.error(`Enter your name`);return}if(!C.trim()||!D){r.error(`Enter email and password`);return}if(D.length<6){r.error(`Password must be at least 6 characters`);return}if(D!==j){r.error(`Passwords do not match`);return}S(!0);try{await t(C,D,k)===`confirm`?(r.success(`Check your email to confirm, then sign in.`),b(`signin`),O(``),M(``)):(r.success(`Account created`),s({to:`/`}))}catch(e){r.error(e instanceof Error?e.message:`Sign-up failed`)}finally{S(!1)}}return(0,w.jsxs)(`div`,{className:`min-h-dvh bg-bg md:grid md:grid-cols-[minmax(0,18rem)_1fr]`,children:[(0,w.jsxs)(`aside`,{className:`hidden flex-col justify-between bg-sidebar px-8 py-10 text-sidebar-fg md:flex`,children:[(0,w.jsxs)(`div`,{children:[(0,w.jsx)(m,{mark:!0,className:`h-14 w-auto`}),(0,w.jsx)(`p`,{className:`mt-8 text-xs font-medium uppercase tracking-[0.18em] text-sidebar-muted`,children:`Staff ledger`}),(0,w.jsx)(`h1`,{className:`mt-2 font-display text-3xl font-semibold leading-tight tracking-tight`,children:`Hotel Status Residency`}),(0,w.jsx)(`p`,{className:`mt-3 text-sm leading-relaxed text-sidebar-muted`,children:`Night audit, register and cash book — sign in with the hotel email to open your books.`})]}),(0,w.jsx)(`p`,{className:`text-[11px] uppercase tracking-[0.14em] text-sidebar-muted`,children:`Mahape`})]}),(0,w.jsxs)(`main`,{className:`flex min-h-dvh flex-col items-center justify-center px-4 py-10`,children:[(0,w.jsxs)(`div`,{className:`mb-8 flex flex-col items-center text-center md:hidden`,children:[(0,w.jsx)(m,{mark:!0,className:`h-12 w-auto`}),(0,w.jsx)(`h1`,{className:`mt-4 font-display text-2xl font-semibold tracking-tight`,children:`Hotel Status Residency`}),(0,w.jsx)(`p`,{className:`mt-1 text-sm text-muted`,children:`Staff ledger · Mahape`})]}),(0,w.jsxs)(`div`,{className:`paper-card w-full max-w-md rounded-xl p-6 md:p-8`,children:[(0,w.jsx)(`p`,{className:`text-xs font-medium uppercase tracking-[0.18em] text-muted`,children:c===`signup`?`New staff`:`Welcome back`}),(0,w.jsx)(`h2`,{className:`mt-1 font-display text-2xl font-semibold tracking-tight`,children:c===`signup`?`Create account`:`Sign in`}),(0,w.jsx)(`p`,{className:`mt-1 text-sm text-muted`,children:`Username or email, and password.`}),o?null:(0,w.jsxs)(`p`,{className:`mt-5 rounded-lg bg-due/12 px-3 py-3 text-sm text-due`,children:[`Project is connected at`,` `,(0,w.jsx)(`span`,{className:`font-medium break-all`,children:u}),`. Send the publishable (anon) key from Supabase → Settings → API to finish sign-in.`]}),o&&N?(0,w.jsxs)(`div`,{className:`mt-5 rounded-lg bg-bg-warm px-3 py-3`,children:[(0,w.jsx)(`p`,{className:`text-sm text-fg`,children:`Rooms, staff, expenses and balance tables still need to be created once in your project. After that, sign-in will copy this device's old books into your account.`}),(0,w.jsx)(`div`,{className:`mt-3`,children:(0,w.jsx)(T,{})})]}):null,(0,w.jsxs)(v,{value:c,onValueChange:b,className:`mt-6`,children:[(0,w.jsxs)(_,{className:`grid w-full grid-cols-2`,children:[(0,w.jsx)(h,{value:`signin`,children:`Sign in`}),(0,w.jsx)(h,{value:`signup`,children:`Create account`})]}),(0,w.jsx)(g,{value:`signin`,className:`mt-5`,children:(0,w.jsxs)(`form`,{className:`grid gap-3`,onSubmit:F,children:[(0,w.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,w.jsx)(d,{htmlFor:`email`,children:`Username or email`}),(0,w.jsx)(p,{id:`email`,type:`text`,autoComplete:`username`,value:C,onChange:e=>E(e.target.value),required:!0})]}),(0,w.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,w.jsx)(d,{htmlFor:`password`,children:`Password`}),(0,w.jsx)(p,{id:`password`,type:`password`,autoComplete:`current-password`,value:D,onChange:e=>O(e.target.value),required:!0})]}),(0,w.jsx)(n,{type:`submit`,className:`mt-2 w-full`,disabled:x,children:x?`Signing in…`:`Sign in`})]})}),(0,w.jsx)(g,{value:`signup`,className:`mt-5`,children:(0,w.jsxs)(`form`,{className:`grid gap-3`,onSubmit:I,children:[(0,w.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,w.jsx)(d,{htmlFor:`name`,children:`Name`}),(0,w.jsx)(p,{id:`name`,autoComplete:`name`,value:k,onChange:e=>A(e.target.value),required:!0})]}),(0,w.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,w.jsx)(d,{htmlFor:`email-up`,children:`Email`}),(0,w.jsx)(p,{id:`email-up`,type:`email`,autoComplete:`email`,value:C,onChange:e=>E(e.target.value),required:!0})]}),(0,w.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,w.jsx)(d,{htmlFor:`password-up`,children:`Password`}),(0,w.jsx)(p,{id:`password-up`,type:`password`,autoComplete:`new-password`,value:D,onChange:e=>O(e.target.value),required:!0,minLength:6})]}),(0,w.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,w.jsx)(d,{htmlFor:`confirm`,children:`Confirm password`}),(0,w.jsx)(p,{id:`confirm`,type:`password`,autoComplete:`new-password`,value:j,onChange:e=>M(e.target.value),required:!0,minLength:6})]}),(0,w.jsx)(n,{type:`submit`,className:`mt-2 w-full`,disabled:x,children:x?`Creating…`:`Create account`})]})})]})]})]})]})}export{E as component};