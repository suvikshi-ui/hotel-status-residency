-- Staff logins use username@status-residency.local and must be confirmed
-- or Sign in asks for an email. Confirm every auth user so username works.

update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email_confirmed_at is null;
