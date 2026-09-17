/*
  DIAGNOSTIC ONLY
  Run once in BB and once in ST Supabase SQL Editor.
  This file does not alter tables or views.
*/

-- 1) Read the exact SQL definition currently installed.
select
  schemaname,
  viewname,
  definition
from pg_views
where schemaname = 'public'
  and viewname = 'vw_orders_web_chat';

-- 2) Detect common time-window predicates in the installed definition.
select
  case
    when definition ~* 'current_date|current_timestamp|now\\s*\\(\\)|interval\\s+''[0-9]+\\s+(day|days|hour|hours)''' then 'WARNING: dynamic time window found'
    else 'OK: no obvious dynamic time window found'
  end as time_window_check,
  regexp_matches(
    definition,
    '(?i)(where|and).*?(current_date|current_timestamp|now\\s*\\(\\)|interval\\s+''[^'']+'')',
    'g'
  ) as matching_fragments
from pg_views
where schemaname = 'public'
  and viewname = 'vw_orders_web_chat';

-- 3) Check whether the View exposes the fields required by the web room.
select
  c.column_name,
  c.data_type,
  c.ordinal_position
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name = 'vw_orders_web_chat'
order by c.ordinal_position;

-- 4) Compare available canonical data with View data for the last 30 days.
-- Adjust the timestamp column only if the View uses a different name.
select
  'canonical_orders' as source,
  count(*) as rows_last_30_days,
  min(order_time) as oldest_order_time,
  max(order_time) as newest_order_time
from public.canonical_orders
where order_time >= now() - interval '30 days'
  and order_time < now()
union all
select
  'vw_orders_web_chat' as source,
  count(*) as rows_last_30_days,
  min(order_time) as oldest_order_time,
  max(order_time) as newest_order_time
from public.vw_orders_web_chat
where order_time >= now() - interval '30 days'
  and order_time < now();

-- 5) Daily comparison. A large gap indicates View rules are filtering data.
with days as (
  select generate_series(
    (current_date - interval '29 days')::date,
    current_date,
    interval '1 day'
  )::date as day
), raw_counts as (
  select (order_time at time zone 'Asia/Bangkok')::date as day, count(*) as raw_count
  from public.canonical_orders
  where order_time >= now() - interval '30 days'
  group by 1
), view_counts as (
  select (order_time at time zone 'Asia/Bangkok')::date as day, count(*) as view_count
  from public.vw_orders_web_chat
  where order_time >= now() - interval '30 days'
  group by 1
)
select
  d.day,
  coalesce(r.raw_count, 0) as raw_count,
  coalesce(v.view_count, 0) as view_count,
  coalesce(r.raw_count, 0) - coalesce(v.view_count, 0) as difference
from days d
left join raw_counts r using (day)
left join view_counts v using (day)
order by d.day desc;

/*
  EXPECTED POLICY

  The operational View should NOT contain a rolling filter such as:
    where order_time >= now() - interval '1 day'

  It may contain stable business filters such as:
    order_status not in ('TEST', 'CANCELLED')

  If a date range is required, apply it in the web query:
    where order_time >= :from_timestamp
      and order_time <  :to_timestamp

  Keep the View history-capable for at least 90 days (or the agreed retention period).
  Do not use SELECT * in a production View replacement without first checking the
  existing column contract; CREATE OR REPLACE VIEW cannot freely change column names
  or order.
*/

-- 6) Optional index check. Views do not have indexes; base tables do.
select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('canonical_orders', 'canonical_order_items')
order by tablename, indexname;
