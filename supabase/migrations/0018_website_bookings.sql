-- Bookings made on www.hotelstatusresidency.com, pushed by the website server
-- (service role key, upsert on id). Desk logins can read; only the service
-- role writes. Safe to re-run.
create table if not exists public.website_bookings (
  id text primary key,
  guest_name text not null default '',
  phone text not null default '',
  email text not null default '',
  room_type text not null default '',
  rooms integer not null default 1,
  guests integer not null default 1,
  check_in date not null,
  check_out date not null,
  total_amount numeric not null default 0,
  amount_paid numeric not null default 0,
  balance numeric not null default 0,
  status text not null default 'confirmed',
  payment_status text not null default 'unpaid',
  payment_mode text not null default 'full',
  booked_at timestamptz,
  synced_at timestamptz not null default now()
);

create index if not exists website_bookings_check_in_idx on public.website_bookings (check_in);

alter table public.website_bookings enable row level security;
alter table public.website_bookings force row level security;

revoke all on public.website_bookings from anon, public;
grant select on public.website_bookings to authenticated;

drop policy if exists website_bookings_read on public.website_bookings;
create policy website_bookings_read on public.website_bookings
  for select to authenticated using (true);
