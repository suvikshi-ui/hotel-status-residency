-- Admin can remove a staff username. Cannot delete their own login.

create or replace function public.delete_staff_login(
  p_id uuid,
  p_username text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_owner uuid := auth.uid();
  v_username text;
  v_email text;
  v_auth uuid;
begin
  if v_owner is null then
    raise exception 'Sign in as Admin first';
  end if;
  v_username := lower(regexp_replace(trim(coalesce(p_username, '')), '[^a-z0-9._-]', '', 'g'));
  v_email := v_username || '@status-residency.local';

  select u.id into v_auth
  from auth.users u
  where (p_id is not null and u.id = p_id)
     or (v_username <> '' and lower(u.email) = v_email)
  limit 1;

  if v_auth is not null and v_auth = v_owner then
    raise exception 'Cannot delete your own login';
  end if;

  delete from public.hotel_users
  where owner_id = v_owner
    and (
      (p_id is not null and id = p_id)
      or (v_username <> '' and lower(username) = v_username)
    );

  delete from public.users
  where (
      (p_id is not null and id = p_id)
      or (v_auth is not null and id = v_auth)
      or (v_username <> '' and lower(username) = v_username)
    )
    and (owner_id = v_owner or id = v_auth)
    and id <> v_owner;

  if v_auth is not null then
    delete from auth.identities where user_id = v_auth;
    delete from auth.users where id = v_auth;
  end if;

  return jsonb_build_object('ok', true, 'username', v_username);
end;
$$;

revoke all on function public.delete_staff_login(uuid, text) from public, anon;
grant execute on function public.delete_staff_login(uuid, text) to authenticated;
