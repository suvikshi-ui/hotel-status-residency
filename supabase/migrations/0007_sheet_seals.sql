-- Saved entries stay frozen on every desk.
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
