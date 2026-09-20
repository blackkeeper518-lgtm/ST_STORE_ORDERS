-- ST ONLY
-- Telegram rooms built from real ST order payloads.
-- Queue room: all pending records.
-- Delivery room: pending records from today in Asia/Bangkok.
-- No BB references and no writes to st_orders.

begin;

drop view if exists public.vw_st_telegram_delivery_today;
drop view if exists public.vw_st_telegram_delivery_queue;
drop view if exists public.vw_st_telegram_delivery_source;

create view public.vw_st_telegram_delivery_source as
with raw_rows as (
  select to_jsonb(o) as j
  from public.st_orders as o
), normalized as (
  select
    j,
    coalesce(nullif(btrim(j->>'order_number'), ''), nullif(btrim(j->>'upsert_key'), ''), 'NO_ORDER_NUMBER') as order_key,
    nullif(btrim(coalesce(j->>'order_time', j->>'created_at')), '') as source_time_text,
    coalesce(nullif(btrim(j->>'final_address_for_bill'), ''), nullif(btrim(j->>'full_address'), ''), nullif(btrim(j->>'address_display_packer'), ''), nullif(btrim(j->>'addressclean'), ''), nullif(btrim(j->>'full_address_backup_1'), ''), nullif(btrim(j->>'full_address_backup_2'), ''), nullif(concat_ws(' ', nullif(j->>'short_address', ''), nullif(j->>'district', ''), nullif(j->>'amphoe', ''), nullif(j->>'province', ''), nullif(j->>'zipcode', '')), '')) as address_for_delivery,
    coalesce(nullif(btrim(j->>'final_address_for_bill'), ''), nullif(btrim(j->>'full_address'), ''), nullif(btrim(j->>'address_display_packer'), ''), nullif(btrim(j->>'addressclean'), ''), nullif(btrim(j->>'full_address_backup_1'), ''), nullif(btrim(j->>'full_address_backup_2'), ''), nullif(concat_ws(' ', nullif(j->>'short_address', ''), nullif(j->>'district', ''), nullif(j->>'amphoe', ''), nullif(j->>'province', ''), nullif(j->>'zipcode', '')), '')) as address_for_delivery_source,
    coalesce(nullif(btrim(j->>'single_cleaned_products'), ''), nullif(btrim(j->>'product_display_for_packer'), ''), nullif(btrim(j->>'final_display_for_packer'), ''), nullif(btrim(j->>'telegram_final_mapped'), ''), nullif(btrim(j->>'extracted_product_raw'), ''), nullif(btrim(j->>'product_copy_text'), ''), nullif(btrim(j->>'display_for_packer'), ''), nullif(btrim(j->>'alias'), ''), nullif(btrim(j->>'sku'), '')) as product_from_raw_and_mapping,
    coalesce(nullif(btrim(j->>'master_qty_display'), ''), nullif(btrim(j->>'trusted_master_quantity'), ''), nullif(btrim(j->>'master_quantity'), ''), nullif(btrim(j->>'alien_trusted_master_quantities'), ''), nullif(btrim(j->>'extracted_qty'), ''), nullif(btrim(j->>'quantity'), ''), nullif(btrim(j->>'qty'), '')) as quantity_from_alien_raw_text,
    coalesce(nullif(btrim(j->>'stock_notice'), ''), nullif(btrim(j->>'product_stock_notice'), ''), nullif(btrim(j->>'alien_product_stock_notices'), ''), nullif(btrim(j->>'out_of_stock_notice'), ''), nullif(btrim(j->>'alien_out_of_stock_notices'), '')) as stock_notice,
    coalesce(nullif(btrim(j->>'telegram_status'), ''), nullif(btrim(j->>'telegram_body_status'), ''), nullif(btrim(j->>'delivery_status'), ''), 'PENDING') as telegram_status_value
  from raw_rows
), enriched as (
  select
    n.*,
    case when n.product_from_raw_and_mapping is not null then n.product_from_raw_and_mapping
         when nullif(btrim(n.j->>'master_display_for_packer'), '') is not null
          and n.j->>'master_display_for_packer' !~ '[0-9]{9,10}'
          and n.j->>'master_display_for_packer' !~ '(ต\\.|อ\\.|จ\\.|หมู่|รหัสไปรษณีย์)'
         then btrim(n.j->>'master_display_for_packer')
         else null end as product_for_delivery,
    case when n.product_from_raw_and_mapping is not null then 'RAW_PRODUCT_OR_MAPPING'
         when nullif(btrim(n.j->>'master_display_for_packer'), '') is not null
          and n.j->>'master_display_for_packer' !~ '[0-9]{9,10}'
          and n.j->>'master_display_for_packer' !~ '(ต\\.|อ\\.|จ\\.|หมู่|รหัสไปรษณีย์)'
         then 'MASTER_DISPLAY_FALLBACK'
         else 'NO_PRODUCT' end as product_source,
    case when n.quantity_from_alien_raw_text ~ '[0-9]'
      then substring(n.quantity_from_alien_raw_text from '([0-9]+([.][0-9]+)?)')::numeric end as quantity_from_alien_raw,
    case when n.address_for_delivery is not null then 'ADDRESS_PRIORITY_FALLBACK' else 'NO_ADDRESS' end as address_source
  from normalized as n
)
select
  j->>'id' as id,
  j->>'upsert_key' as upsert_key,
  order_key as order_number,
  source_time_text as order_time,
  j->>'order_time_display' as order_time_display,
  j->>'order_date' as order_date_raw,
  source_time_text::timestamptz as source_time,
  (source_time_text::timestamptz at time zone 'Asia/Bangkok')::date as source_date_bkk,
  j->>'page_name' as page_name,
  coalesce(nullif(btrim(j->>'customer_name'), ''), nullif(btrim(j->>'facebook_name'), '')) as customer_name,
  coalesce(nullif(btrim(j->>'phone'), ''), nullif(btrim(j->>'extracted_phone'), '')) as phone,
  j->>'cod_amount' as cod_amount,
  address_for_delivery,
  address_source,
  product_for_delivery,
  product_source,
  quantity_from_alien_raw,
  quantity_from_alien_raw_text,
  stock_notice,
  coalesce(nullif(btrim(j->>'mapping_status'), ''), nullif(btrim(j->>'web_mapping_status'), ''), 'UNKNOWN') as mapping_status,
  j->>'sku' as sku,
  j->>'line_no' as line_no,
  j->>'shipping_carrier' as shipping_carrier,
  telegram_status_value as telegram_status,
  lower(coalesce(j->>'telegram_sent', 'false')) in ('true', 't', '1') or upper(telegram_status_value) in ('SENT', 'SENT_TO_TELEGRAM', 'DELIVERED') or telegram_status_value = 'ไปแล้วไปลับ' as is_sent,
  j->>'telegram_message' as telegram_message,
  'telegram_message'::text as telegram_message_source,
  j->>'telegram_copy_text' as telegram_copy_text,
  j->>'raw_product_evidence' as raw_product_evidence,
  j->>'product_evidence' as product_evidence,
  j->>'normalized_chat_timeline' as normalized_chat_timeline,
  j->>'clean_text' as clean_text,
  j->>'sniper_x_text_clean' as sniper_x_text_clean,
  j->>'telegram_body' as telegram_body_json
from enriched;

create view public.vw_st_telegram_delivery_queue as
select *, 'PENDING_SEND'::text as queue_status, true as queue_can_send
from public.vw_st_telegram_delivery_source
where not is_sent;

create view public.vw_st_telegram_delivery_today as
select *, 'TODAY_PENDING_SEND'::text as queue_status, true as queue_can_send
from public.vw_st_telegram_delivery_source
where not is_sent
  and source_date_bkk = (now() at time zone 'Asia/Bangkok')::date;

comment on view public.vw_st_telegram_delivery_source is 'ST-only real order payload normalized for Telegram rooms.';
comment on view public.vw_st_telegram_delivery_queue is 'ST-only waiting queue; product/address/quantity use real payload fallbacks.';
comment on view public.vw_st_telegram_delivery_today is 'ST-only delivery room; pending records from today in Asia/Bangkok.';

commit;
