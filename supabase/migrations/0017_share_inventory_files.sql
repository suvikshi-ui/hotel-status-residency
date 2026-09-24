-- Housekeeping and Admin share one inventory book.
-- The function writes onto the hotel owner, so staff RLS cannot split the file.

create or replace function public.save_shared_inventory(files jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  owner uuid := public.hotel_owner_id();
  hotel jsonb;
  existing jsonb;
  merged jsonb;
begin
  if owner is null or owner = auth.uid() then
    select m.user_id
      into owner
    from public.ledger_meta m
    left join public.guests g on g.user_id = m.user_id
    group by m.user_id
    order by count(g.id) desc
    limit 1;
  end if;
  if owner is null then
    owner := auth.uid();
  end if;
  if owner is null then
    raise exception 'No hotel owner';
  end if;
  if coalesce(public.app_role(), '') not in ('admin', 'supervisor', 'staff', 'housekeeping') then
    raise exception 'Not allowed';
  end if;

  insert into public.inventory (user_id, id, name, last_month, this_month, notes)
  select
    owner,
    item->>'id',
    coalesce(item->>'kind', 'file'),
    0,
    coalesce(jsonb_array_length(item->'lines'), 0),
    jsonb_build_object(
      'v', 1,
      'kind', item->>'kind',
      'period', item->>'period',
      'createdAt', item->>'createdAt',
      'lines', coalesce(item->'lines', '[]'::jsonb)
    )::text
  from jsonb_array_elements(coalesce(files, '[]'::jsonb)) item
  where coalesce(item->>'id', '') <> ''
  on conflict (user_id, id) do update
    set name = excluded.name,
        last_month = excluded.last_month,
        this_month = excluded.this_month,
        notes = excluded.notes;

  select coalesce(m.hotel, '{}'::jsonb)
    into hotel
  from public.ledger_meta m
  where m.user_id = owner;

  if hotel is null then
    return;
  end if;

  existing := coalesce(hotel #> '{_books,inventoryFiles}', '[]'::jsonb);
  if jsonb_typeof(existing) <> 'array' then
    existing := '[]'::jsonb;
  end if;

  select coalesce(jsonb_agg(picked.file), '[]'::jsonb)
    into merged
  from (
    select distinct on (row_id) row_file as file
    from (
      select e.value as row_file, e.value->>'id' as row_id, 0 as src
      from jsonb_array_elements(existing) e
      union all
      select n.value, n.value->>'id', 1
      from jsonb_array_elements(coalesce(files, '[]'::jsonb)) n
    ) rows
    where coalesce(row_id, '') <> ''
    order by row_id, src desc
  ) picked;

  update public.ledger_meta
  set hotel = jsonb_set(hotel, '{_books,inventoryFiles}', merged, true),
      updated_at = now()
  where user_id = owner;
end;
$$;

revoke all on function public.save_shared_inventory(jsonb) from public, anon;
grant execute on function public.save_shared_inventory(jsonb) to authenticated;
