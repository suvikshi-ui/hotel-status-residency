-- Daily register Save cube was hitting "permission denied" because
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
