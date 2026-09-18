-- public.users already existed without owner_id.
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
