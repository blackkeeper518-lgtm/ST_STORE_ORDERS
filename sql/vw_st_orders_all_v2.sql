-- ST ONLY · CLEAN REBUILD
-- Run in the ST Supabase project only.
-- Drops and recreates the read view because CREATE OR REPLACE cannot reorder old view columns.

drop view if exists public.vw_st_orders_all_v2 cascade;

create view public.vw_st_orders_all_v2 as
select o.*,
  coalesce(nullif(to_jsonb(o)->>'for_packer_st_display', ''), nullif(to_jsonb(o)->>'single_cleaned_products', '')) as for_packer_st_display_web,
  coalesce(nullif(case when coalesce(to_jsonb(o)->>'telegram_header', '') !~ '(🌻|ข้อมูลครบ|ครบหมด|พร้อมยิงแฟลช)' then btrim(to_jsonb(o)->>'telegram_header') end, ''), nullif(case when coalesce(to_jsonb(o)->>'telegram_header_backup', '') !~ '(🌻|ข้อมูลครบ|ครบหมด|พร้อมยิงแฟลช)' then btrim(to_jsonb(o)->>'telegram_header_backup') end, ''), '🚀 [บิลสมบูรณ์ - 🎯ORDER_SNIPER_X]') as telegram_header_web,
  coalesce(nullif(to_jsonb(o)->>'telegram_header_type', ''), 'DEFAULT') as telegram_header_type_web,
  coalesce(nullif(to_jsonb(o)->>'order_status', ''), 'ORDER_SNIPER_X') as order_status_display_web,
  coalesce(nullif(to_jsonb(o)->>'order_status_backup', ''), nullif(to_jsonb(o)->>'routing_tag', ''), 'ORDER_SNIPER_X') as order_status_backup_web,
  case when lower(coalesce(to_jsonb(o)->>'should_alert', 'false')) in ('true', '1', 't', 'yes') or nullif(to_jsonb(o)->>'alert_level', '') is not null or nullif(to_jsonb(o)->>'alert_title', '') is not null then coalesce(nullif(to_jsonb(o)->>'alert_title', ''), nullif(to_jsonb(o)->>'alert_level', ''), '⚠️ รอตรวจสอบ') end as telegram_warning_label_web,
  case when lower(coalesce(to_jsonb(o)->>'should_alert', 'false')) in ('true', '1', 't', 'yes') or nullif(to_jsonb(o)->>'alert_text', '') is not null or nullif(to_jsonb(o)->>'warn_text', '') is not null then coalesce(nullif(to_jsonb(o)->>'alert_text', ''), nullif(to_jsonb(o)->>'warn_text', ''), nullif(to_jsonb(o)->>'alert_reason', '')) end as telegram_warning_text_web,
  coalesce(nullif(to_jsonb(o)->>'alert_level', ''), case when lower(coalesce(to_jsonb(o)->>'should_alert', 'false')) in ('true', '1', 't', 'yes') then 'WARN' end) as telegram_warning_level_web
from public.st_orders as o;

comment on view public.vw_st_orders_all_v2 is
  'ST-only read view; *_web aliases avoid collisions with stamped source columns.';
