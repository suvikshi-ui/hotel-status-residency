-- Opening balance already lives on ledger_meta.opening / opening_date.
-- Daily register locks become first-class columns (not localStorage, not
-- buried only inside hotel jsonb).

alter table public.ledger_meta
  add column if not exists locked_dates jsonb not null default '{}'::jsonb;

alter table public.ledger_meta
  add column if not exists lock_rev jsonb not null default '{}'::jsonb;

update public.ledger_meta
set
  locked_dates = coalesce(nullif(hotel -> '_lockedDates', 'null'::jsonb), '{}'::jsonb),
  lock_rev = coalesce(nullif(hotel -> '_lockRev', 'null'::jsonb), '{}'::jsonb)
where
  (locked_dates = '{}'::jsonb or locked_dates is null)
  and hotel ? '_lockedDates';
