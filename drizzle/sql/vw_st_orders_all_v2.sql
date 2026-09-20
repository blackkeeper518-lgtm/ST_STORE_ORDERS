-- ST ONLY
-- Read-only order source for the ST deployment.
-- No BB references, shared order tables, guessed columns, or data writes.

do $$
begin
  if to_regclass('public.vw_st_orders_all_v2') is null then
    execute $view$
      create view public.vw_st_orders_all_v2 as
      select o.*
      from public.st_orders as o
    $view$;
  else
    execute $view$
      create or replace view public.vw_st_orders_all_v2 as
      select o.*
      from public.st_orders as o
    $view$;
  end if;
end
$$;

comment on view public.vw_st_orders_all_v2 is
  'ST-only read view over public.st_orders; source for the ST web deployment.';

-- Apply the SELECT grant only if the ST Supabase project requires it.
-- grant select on public.vw_st_orders_all_v2 to anon, authenticated;
