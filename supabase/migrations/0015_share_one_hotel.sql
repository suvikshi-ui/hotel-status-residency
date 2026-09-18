-- One hotel, one books. SWR / Kali read and write the admin complaints.

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
