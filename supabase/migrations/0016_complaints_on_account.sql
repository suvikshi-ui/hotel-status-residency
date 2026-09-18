-- Complaints + inventory must exist on the admin account so SWR can see them.

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
