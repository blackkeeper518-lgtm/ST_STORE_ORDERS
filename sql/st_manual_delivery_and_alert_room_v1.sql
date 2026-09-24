-- ST ONLY · MANUAL TELEGRAM ROOM + ALERT ROOM v1
-- Run in the ST Supabase project only.
-- No BB tables, BB views, or BB logic are referenced.
-- Read-only views: no order/chat evidence is deleted or rewritten.

begin;

-- ============================================================
-- 1) ST Telegram manual room: every ST order is visible.
-- ============================================================

drop view if exists public.vw_st_telegram_manual_room_v1;

create view public.vw_st_telegram_manual_room_v1 as
with source as (
  select to_jsonb(o) as j
  from public.st_orders o
)
select
  nullif(j->>'id', '') as id,
  nullif(j->>'upsert_key', '') as upsert_key,
  coalesce(nullif(j->>'order_number_display', ''), nullif(j->>'order_number', ''), nullif(j->>'upsert_key', '')) as order_number,
  nullif(j->>'order_number_display', '') as order_number_display,
  nullif(j->>'order_time_display', '') as order_time_display,
  nullif(j->>'order_time', '') as order_time,
  nullif(j->>'created_at', '') as created_at,
  nullif(j->>'updated_at', '') as updated_at,
  nullif(j->>'page_name', '') as page_name,
  nullif(j->>'facebook_name', '') as facebook_name,
  nullif(j->>'customer_name', '') as customer_name,
  nullif(j->>'phone', '') as phone,
  nullif(j->>'extracted_phone', '') as extracted_phone,
  nullif(j->>'cod_amount', '') as cod_amount,
  nullif(j->>'address_display_packer', '') as address_display_packer,
  nullif(j->>'addressclean', '') as addressclean,
  nullif(j->>'full_address', '') as full_address,
  nullif(j->>'province', '') as province,
  nullif(j->>'zipcode', '') as zipcode,
  coalesce(
    nullif(j->>'for_packer_st_display', ''),
    nullif(j->>'product_display_for_packer', ''),
    nullif(j->>'final_display_for_packer', ''),
    nullif(j->>'master_display_for_packer', ''),
    nullif(j->>'display_for_ku', ''),
    nullif(j->>'single_cleaned_products', ''),
    nullif(j->>'extracted_product_raw', ''),
    nullif(j->>'sniper_x_text_clean', '')
  ) as for_packer_st_display,
  nullif(j->>'sniper_x_text_clean', '') as sniper_x_text_clean,
  nullif(j->>'normalized_chat_timeline', '') as normalized_chat_timeline_text,
  nullif(j->>'mapping_status', '') as mapping_status,
  nullif(j->>'stock_notice', '') as stock_notice,
  nullif(j->>'shipping_method', '') as shipping_method,
  nullif(j->>'telegram_sent', '') as telegram_sent,
  nullif(j->>'telegram_status', '') as telegram_status,
  nullif(j->>'delivery_state', '') as delivery_state,
  nullif(j->>'telegram_sent_at', '') as sent_at,
  nullif(j->>'recalled_at', '') as recalled_at,
  nullif(j->>'last_delivery_note', '') as last_delivery_note,
  case
    when lower(coalesce(j->>'telegram_sent', '')) in ('true','1','t','sent','delivered','ไปแล้วไปลับ') then true
    when upper(coalesce(j->>'telegram_status', '')) in ('SENT','DELIVERED','SENT_TO_TELEGRAM') then true
    when upper(coalesce(j->>'delivery_state', '')) = 'SENT' then true
    else false
  end as is_sent
from source;

comment on view public.vw_st_telegram_manual_room_v1 is
  'ST-only manual Telegram room: all ST orders remain visible; no time, mapping, warning, or stock gate.';

-- ============================================================
-- 2) ST alert room: complete order/customer evidence from st_orders.
-- ============================================================
-- "Latest of day" is only chronology. It never declares a real order.

drop view if exists public.vw_st_order_alert_room_v1;

with base as (
  select
    o.id,
    to_jsonb(o) as j,
    lower(regexp_replace(coalesce(nullif(btrim(o.phone), ''), nullif(btrim(o.extracted_phone), ''), ''), '[^0-9]', '', 'g')) as phone_key,
    lower(regexp_replace(coalesce(nullif(btrim(o.customer_name), ''), nullif(btrim(o.facebook_name), ''), ''), '[[:space:][:punct:]]+', '', 'g')) as customer_key,
    coalesce(nullif(btrim(o.cod_amount::text), ''), '0')::numeric as cod_value,
    lower(coalesce(o.product_display_for_packer, o.final_display_for_packer, o.sniper_x_text_clean, '')) as product_key,
    coalesce(nullif(o.order_time, ''), nullif(o.created_at, ''), '') as event_key
  from public.st_orders o
), classified as (
  select
    b.*,
    coalesce(nullif(b.phone_key, ''), nullif(b.customer_key, ''), nullif(b.j->>'thread_id', '')) as person_key,
    case
      when b.product_key ~ '(หนูส่งต่อให้ทีม|ส่งต่อให้ทีม|ทีมจะดูแลจัดส่ง|รับทราบว่าพี่ขอรับ|ยอดรวม.*ชำระแบบเก็บเงินปลายทาง|จัดส่งชื่อ)' then true
      when lower(coalesce(b.j->>'sniper_x_text_clean', '')) ~ '(order summary|bot summary|สรุปออเดอร์|บอทสรุป)' then true
      else false
    end as is_bot_summary
  from base b
), enriched as (
  select
    c.*,
    count(*) over (partition by c.person_key) as customer_bill_count,
    sum(c.cod_value) over (partition by c.person_key) as customer_cod_total,
    count(*) over (partition by c.person_key, c.cod_value, c.product_key) as duplicate_signature_count,
    case
      when jsonb_typeof(c.j->'normalized_chat_timeline') = 'array' then jsonb_array_length(c.j->'normalized_chat_timeline')
      when nullif(c.j->>'normalized_chat_timeline', '') is not null then 1
      else 0
    end as chat_message_count
  from classified c
)
select
  id,
  nullif(j->>'upsert_key', '') as upsert_key,
  coalesce(nullif(j->>'order_number', ''), nullif(j->>'upsert_key', '')) as order_number,
  nullif(j->>'order_time_display', '') as order_time_display,
  nullif(j->>'page_name', '') as page_name,
  nullif(j->>'facebook_name', '') as facebook_name,
  nullif(j->>'customer_name', '') as customer_name,
  nullif(j->>'phone', '') as phone,
  cod_value,
  nullif(j->>'for_packer_st_display', '') as for_packer_st_display,
  nullif(j->>'product_display_for_packer', '') as product_display_for_packer,
  nullif(j->>'sniper_x_text_clean', '') as sniper_x_text_clean,
  j->'normalized_chat_timeline' as normalized_chat_timeline,
  nullif(j->>'thread_id', '') as thread_id,
  person_key,
  customer_bill_count,
  customer_cod_total,
  chat_message_count,
  is_bot_summary,
  duplicate_signature_count,
  case
    when is_bot_summary then 'SUMMARY_SIGNAL_REVIEW'
    when duplicate_signature_count > 1 then 'POSSIBLE_DUPLICATE_REVIEW'
    else 'HISTORY_COMPARE'
  end as alert_status
from enriched;

comment on view public.vw_st_order_alert_room_v1 is
  'ST-only alert room: complete ST order evidence and chronology; never declares the latest row to be the real order.';

commit;

-- Checks:
-- select alert_status, count(*) from public.vw_st_order_alert_room_v1 group by alert_status;
-- select customer_name, phone, customer_bill_count, customer_cod_total,
--        chat_message_count, alert_status
-- from public.vw_st_order_alert_room_v1
-- order by order_time_display desc nulls last;
