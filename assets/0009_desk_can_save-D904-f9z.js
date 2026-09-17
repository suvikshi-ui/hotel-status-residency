function e(e){let t=document.createElement(`textarea`);t.value=e,t.setAttribute(`readonly`,``),t.style.position=`fixed`,t.style.top=`0`,t.style.left=`0`,t.style.width=`1px`,t.style.height=`1px`,t.style.opacity=`0`,document.body.appendChild(t),t.focus(),t.select(),t.setSelectionRange(0,e.length);let n=!1;try{n=document.execCommand(`copy`)}catch{n=!1}return document.body.removeChild(t),n}function t(e,t){let n=new Blob([t],{type:`text/plain;charset=utf-8`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=e,i.click(),URL.revokeObjectURL(r)}var n=`-- Any signed-in hotel desk can save the daily register.
-- app_role no longer blocks House / staff from writing guests.

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

revoke all on function public.hotel_owner_id() from public, anon;
revoke all on function public.app_role() from public, anon;
grant execute on function public.hotel_owner_id() to authenticated;
grant execute on function public.app_role() to authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    'ledger_meta','rooms','staff','expenses','balance_received',
    'guests','food','wholesale','advances'
  ]
  loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('drop policy if exists %I on public.%I', t || '_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (user_id = public.hotel_owner_id() or user_id = auth.uid())',
      t || '_insert', t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (user_id = public.hotel_owner_id() or user_id = auth.uid()) with check (user_id = public.hotel_owner_id() or user_id = auth.uid())',
      t || '_update', t
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (user_id = public.hotel_owner_id() or user_id = auth.uid())',
      t || '_delete', t
    );
  end loop;
end $$;
`;export{e as n,t as r,n as t};