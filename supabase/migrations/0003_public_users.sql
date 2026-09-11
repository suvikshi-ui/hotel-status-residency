-- App roles live in public.users. After login the client reads role here.
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
