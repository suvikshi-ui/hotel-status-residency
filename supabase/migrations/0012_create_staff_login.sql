-- Create staff username/password without sending a confirmation email.
-- auth.signUp hits "email rate limit exceeded" on this hotel.

create or replace function public.create_staff_login(
  p_name text,
  p_username text,
  p_password text,
  p_hash text,
  p_role text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_owner uuid := auth.uid();
  v_username text;
  v_email text;
  v_id uuid;
  v_instance uuid;
begin
  if v_owner is null then
    raise exception 'Sign in as Admin first';
  end if;
  v_username := lower(regexp_replace(trim(coalesce(p_username, '')), '[^a-z0-9._-]', '', 'g'));
  if length(trim(coalesce(p_name, ''))) = 0 then
    raise exception 'Enter a name';
  end if;
  if length(v_username) < 3 then
    raise exception 'Username must be at least 3 letters';
  end if;
  if length(coalesce(p_password, '')) < 6 then
    raise exception 'Password must be at least 6 characters';
  end if;
  v_email := v_username || '@status-residency.local';

  select id into v_id from auth.users where lower(email) = v_email limit 1;
  if v_id is null then
    v_id := gen_random_uuid();
    select instance_id into v_instance from auth.users where instance_id is not null limit 1;
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) values (
      coalesce(v_instance, '00000000-0000-0000-0000-000000000000'),
      v_id,
      'authenticated',
      'authenticated',
      v_email,
      crypt(p_password, gen_salt('bf')),
      now(),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object(
        'full_name', p_name,
        'username', v_username,
        'role', p_role,
        'owner_id', v_owner::text
      ),
      now(), now(), '', '', '', ''
    );
    begin
      insert into auth.identities (
        provider_id, user_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) values (
        v_id::text, v_id,
        jsonb_build_object('sub', v_id::text, 'email', v_email),
        'email', now(), now(), now()
      );
    exception when undefined_column then
      insert into auth.identities (
        id, user_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) values (
        v_id, v_id,
        jsonb_build_object('sub', v_id::text, 'email', v_email),
        'email', now(), now(), now()
      );
    when unique_violation then
      null;
    end;
  else
    update auth.users
    set encrypted_password = crypt(p_password, gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = jsonb_build_object(
          'full_name', p_name,
          'username', v_username,
          'role', p_role,
          'owner_id', v_owner::text
        ),
        updated_at = now()
    where id = v_id;
  end if;

  insert into public.hotel_users (owner_id, name, username, password_hash, role)
  values (v_owner, trim(p_name), v_username, coalesce(p_hash, ''), p_role)
  on conflict (owner_id, username) do update
    set name = excluded.name,
        password_hash = excluded.password_hash,
        role = excluded.role;

  insert into public.users (id, owner_id, name, username, role)
  values (v_id, v_owner, trim(p_name), v_username, p_role)
  on conflict (id) do update
    set owner_id = excluded.owner_id,
        name = excluded.name,
        username = excluded.username,
        role = excluded.role;

  return jsonb_build_object(
    'id', v_id,
    'owner_id', v_owner,
    'name', trim(p_name),
    'username', v_username,
    'role', p_role
  );
end;
$$;

revoke all on function public.create_staff_login(text, text, text, text, text) from public, anon;
grant execute on function public.create_staff_login(text, text, text, text, text) to authenticated;
