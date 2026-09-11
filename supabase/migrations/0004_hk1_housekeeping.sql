-- Delete hk1@hotel.com from Authentication and recreate as housekeeping.
-- Run once in the Supabase SQL editor.

do $$
declare
  uid uuid := gen_random_uuid();
  owner uuid;
begin
  delete from public.users
  where id in (select id from auth.users where email = 'hk1@hotel.com')
     or lower(coalesce(username, '')) = 'hk1';

  delete from public.hotel_users
  where lower(username) in ('hk1', 'hk1@hotel.com');

  delete from auth.identities
  where user_id in (select id from auth.users where email = 'hk1@hotel.com');

  delete from auth.users where email = 'hk1@hotel.com';

  select id into owner
  from auth.users
  order by created_at nulls last
  limit 1;

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    is_sso_user,
    is_anonymous
  ) values (
    '00000000-0000-0000-0000-000000000000',
    uid,
    'authenticated',
    'authenticated',
    'hk1@hotel.com',
    extensions.crypt('pass123', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Housekeeping","username":"hk1","role":"housekeeping"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    '',
    false,
    false
  );

  insert into auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    gen_random_uuid(),
    uid,
    uid::text,
    jsonb_build_object(
      'sub', uid::text,
      'email', 'hk1@hotel.com',
      'email_verified', true
    ),
    'email',
    now(),
    now(),
    now()
  );

  insert into public.users (id, owner_id, name, username, role)
  values (
    uid,
    coalesce(owner, uid),
    'Housekeeping',
    'hk1',
    'housekeeping'
  );
end $$;
