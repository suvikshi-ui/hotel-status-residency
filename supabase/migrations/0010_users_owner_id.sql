-- public.users already existed without owner_id.
-- Add the column first, then the policy.

alter table public.users
  add column if not exists owner_id uuid references auth.users (id) on delete cascade;

update public.users set owner_id = id where owner_id is null;

alter table public.users enable row level security;

drop policy if exists "users_own" on public.users;
create policy "users_own" on public.users
  for all to authenticated
  using (id = auth.uid() or owner_id = auth.uid())
  with check (id = auth.uid() or owner_id = auth.uid());

revoke all on public.users from anon, public;
grant select, insert, update, delete on public.users to authenticated;
