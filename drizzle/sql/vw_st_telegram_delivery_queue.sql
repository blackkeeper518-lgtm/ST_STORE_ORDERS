-- ST ONLY
-- Read-only pending queue for the ST Telegram Delivery room.
-- No BB references. No writes to orders. No large raw/chat JSON payloads.

begin;

drop view if exists public.vw_st_telegram_delivery_queue;

create view public.vw_st_telegram_delivery_queue as
with source_rows as (
  select to_jsonb(o) as j
  from public.st_orders as o
), pending as (
  select j
  from source_rows
  where upper(coalesce(
    nullif(btrim(j->>'telegram_status'), ''),
    nullif(btrim(j->>'telegram_body_status'), ''),
    nullif(btrim(j->>'delivery_status'), ''),
    ''
  )) not in ('SENT', 'SENT_TO_TELEGRAM', 'DELIVERED')
    and lower(coalesce(j->>'telegram_sent', 'false')) not in ('true', 't', '1')
    and lower(coalesce(j->>'telegram_body_status', '')) <> 'ไปแล้วไปลับ'
  limit 400
)
select
  j->>'id' as id,
  j->>'upsert_key' as upsert_key,
  coalesce(nullif(btrim(j->>'order_number'), ''), nullif(btrim(j->>'upsert_key'), ''), 'NO_ORDER_NUMBER') as order_number,
  j->>'order_time' as order_time,
  j->>'order_time_display' as order_time_display,
  j->>'order_date' as order_date,
  j->>'time_th' as time_th,
  j->>'page_name' as page_name,
  coalesce(nullif(btrim(j->>'customer_name'), ''), nullif(btrim(j->>'facebook_name'), ''), 'ไม่ระบุชื่อ') as customer_name,
  j->>'facebook_name' as facebook_name,
  coalesce(nullif(btrim(j->>'phone'), ''), nullif(btrim(j->>'extracted_phone'), '')) as phone,
  j->>'extracted_phone' as extracted_phone,
  j->>'cod_amount' as cod_amount,
  coalesce(nullif(btrim(j->>'full_address'), ''), nullif(btrim(j->>'address_display_packer'), ''), nullif(btrim(j->>'addressclean'), ''), 'ไม่ระบุที่อยู่') as full_address,
  j->>'address_display_packer' as address_display_packer,
  j->>'addressclean' as addressclean,
  j->>'short_address' as short_address,
  j->>'district' as district,
  j->>'amphoe' as amphoe,
  j->>'province' as province,
  j->>'zipcode' as zipcode,
  coalesce(nullif(btrim(j->>'master_display_for_packer'), ''), nullif(btrim(j->>'display_for_packer'), ''), nullif(btrim(j->>'product_name'), ''), nullif(btrim(j->>'th_name'), ''), nullif(btrim(j->>'master_sku'), ''), nullif(btrim(j->>'sku'), ''), 'ตรวจสอบสินค้า — ไม่ทิ้งรายการ') as display_for_packer,
  coalesce(nullif(btrim(j->>'master_quantity'), ''), nullif(btrim(j->>'quantity'), ''), nullif(btrim(j->>'qty'), ''), nullif(btrim(j->>'extracted_qty'), '')) as master_quantity,
  coalesce(nullif(btrim(j->>'master_sku'), ''), nullif(btrim(j->>'sku'), '')) as master_sku,
  j->>'unit_price' as unit_price,
  j->>'telegram_status' as telegram_status,
  j->>'telegram_body_status' as telegram_body_status,
  j->>'telegram_sent' as telegram_sent,
  j->>'raw_text' as raw_text,
  j->>'raw_text_with_phone_timed' as raw_text_with_phone_timed,
  coalesce(nullif(btrim(j->>'shipping_carrier'), ''), '') as shipping_carrier,
  'PENDING_SEND'::text as queue_status,
  true as queue_can_send,
  coalesce(nullif(btrim(j->>'telegram_status'), ''), nullif(btrim(j->>'telegram_body_status'), ''), nullif(btrim(j->>'delivery_status'), ''), 'PENDING') as queue_delivery_status
from pending;

comment on view public.vw_st_telegram_delivery_queue is
  'ST-only pending Telegram delivery queue; max 400 rows; read-only.';

commit;

-- Optional verification:
-- select count(*) from public.vw_st_telegram_delivery_queue;
