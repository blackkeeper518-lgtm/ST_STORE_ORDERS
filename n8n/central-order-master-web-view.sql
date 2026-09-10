-- SUPHABASS simple web View
-- One responsibility: expose the complete central_order_master row to the web.
-- All source fields are preserved exactly as-is. No JSON rebuilding or field guessing.

create or replace view public.vw_orders_web_all_fields as
select m.*
from public.central_order_master as m;

comment on view public.vw_orders_web_all_fields is
  'SUPHABASS simple read-only web View. It exposes every field from central_order_master without transforming or dropping source data.';

grant select on public.vw_orders_web_all_fields to anon, authenticated;
