import{I as e,N as t}from"./store-G_9N-FRE.js";import{n}from"./dist-DNN4Szzp.js";import{r}from"./utils-DuW_DAKh.js";import{l as i,n as a}from"./supabase-sync-CUKQ5VDF.js";import{E as o}from"./index-BFz1k6WD.js";var s=e(t(),1),c=`-- Hotel Status Residency — per-user cash book
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
`,l=r();function u({userId:e}){let[t,r]=(0,s.useState)(!1);return(0,l.jsxs)(`div`,{className:`flex flex-wrap gap-2`,children:[(0,l.jsx)(o,{type:`button`,onClick:()=>{navigator.clipboard.writeText(c).then(()=>n.success(`SQL copied. Paste it in the SQL editor, run it, then retry.`),()=>n.error(`Could not copy SQL`))},children:`Copy table SQL`}),(0,l.jsx)(o,{type:`button`,variant:`outline`,asChild:!0,children:(0,l.jsx)(`a`,{href:i,target:`_blank`,rel:`noreferrer`,children:`Open SQL editor`})}),e?(0,l.jsx)(o,{type:`button`,variant:`outline`,disabled:t,onClick:()=>{r(!0),a(e).finally(()=>r(!1))},children:t?`Checking…`:`Tables are ready`}):null]})}export{u as t};