-- Staff logins share the admin cash book, complaints and inventory.

update public.users
set owner_id = id
where coalesce(role, 'admin') = 'admin'
  and (owner_id is null or owner_id = id);

update public.users staff
set owner_id = admin.id
from public.users admin
where coalesce(admin.role, 'admin') = 'admin'
  and admin.owner_id = admin.id
  and staff.id <> admin.id
  and coalesce(staff.role, 'admin') <> 'admin'
  and (staff.owner_id is null or staff.owner_id = staff.id);

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

revoke all on function public.hotel_owner_id() from public, anon;
grant execute on function public.hotel_owner_id() to authenticated;
