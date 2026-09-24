-- ST TELEGRAM DELIVERY VIEW / CLEAN BUILD
-- อ่านจาก public.st_orders โดยตรง ไม่พึ่ง vw_st_orders_all_v2 หรือวิว Telegram เดิม
-- ฟิวสินค้า: for_packer_st_display -> single_cleaned_products
-- หัวบิล: telegram_header จาก SB
-- ป้ายเตือน: telegram_warning_* แยกจากหัวบิล

begin;

CREATE OR REPLACE FUNCTION public.st_order_display_time(p_value text)
RETURNS timestamptz LANGUAGE plpgsql IMMUTABLE AS $function$
DECLARE parts text[]; yy integer; mm integer; dd integer; hh integer; mi integer; ss integer;
BEGIN
  parts := regexp_split_to_array(trim(coalesce(p_value,'')), '[ /:-]+');
  IF array_length(parts,1) < 6 THEN RETURN NULL; END IF;
  dd := parts[1]::integer; mm := parts[2]::integer; yy := parts[3]::integer; hh := parts[4]::integer; mi := parts[5]::integer; ss := parts[6]::integer;
  IF yy < 2400 THEN yy := 2500 + yy; END IF; IF yy > 2400 THEN yy := yy - 543; END IF;
  RETURN make_timestamptz(yy, mm, dd, hh, mi, ss, 'Asia/Bangkok');
EXCEPTION WHEN others THEN RETURN NULL;
END;
$function$;

drop view if exists public.vw_st_telegram_delivery_today_fast cascade;
drop view if exists public.vw_st_telegram_delivery_yesterday_after_14_fast cascade;
drop view if exists public.vw_st_telegram_delivery_queue_fast cascade;
drop view if exists public.vw_st_telegram_delivery_source_fast cascade;

create view public.vw_st_telegram_delivery_source_fast as
with base as (
  select to_jsonb(o) as j
  from public.st_orders o
), prepared as (
  select
    j,
    coalesce(nullif(btrim(j->>'order_number_display'), ''), nullif(btrim(j->>'order_number'), ''), nullif(btrim(j->>'upsert_key'), ''), 'NO_ORDER_NUMBER') as order_number_final,
    nullif(btrim(j->>'order_time_display'), '') as order_time_display_final,
    coalesce(nullif(btrim(j->>'order_time'), ''), nullif(btrim(j->>'created_at'), '')) as source_time_text,
    coalesce(nullif(btrim(j->>'address_display_packer'), ''), nullif(btrim(j->>'addressclean'), ''), nullif(btrim(j->>'final_address_for_bill'), ''), nullif(btrim(j->>'full_address'), ''), nullif(concat_ws(' ', j->>'short_address', j->>'district', j->>'amphoe', j->>'province', j->>'zipcode'), '')) as address_final,
    coalesce(nullif(btrim(j->>'for_packer_st_display'), ''), nullif(btrim(j->>'single_cleaned_products'), '')) as product_text_final,
    coalesce(nullif(case when coalesce(j->>'telegram_header', '') !~ '(🌻|ข้อมูลครบ|ครบหมด|พร้อมยิงแฟลช)' then btrim(j->>'telegram_header') end, ''), nullif(case when coalesce(j->>'telegram_header_backup', '') !~ '(🌻|ข้อมูลครบ|ครบหมด|พร้อมยิงแฟลช)' then btrim(j->>'telegram_header_backup') end, ''), '🚀 [บิลสมบูรณ์ - 🎯ORDER_SNIPER_X]') as telegram_header_final,
    case when coalesce(j->>'alert_title', '') !~ '(🌻|ข้อมูลครบ|ครบหมด|พร้อมยิงแฟลช)' then coalesce(nullif(btrim(j->>'alert_title'), ''), nullif(btrim(j->>'alert_level'), ''), '⚠️ รอตรวจสอบ') end as warning_label_candidate,
    case when coalesce(concat_ws(' ', j->>'alert_text', j->>'warn_text', j->>'alert_reason'), '') !~ '(🌻|ข้อมูลครบ|ครบหมด|พร้อมยิงแฟลช)' then coalesce(nullif(btrim(j->>'alert_text'), ''), nullif(btrim(j->>'warn_text'), ''), nullif(btrim(j->>'alert_reason'), '')) end as warning_text_candidate
  from base
), dressed as (
  select
    p.*,
    public.st_order_display_time(p.order_time_display_final) as source_time,
    case when lower(coalesce(p.j->>'should_alert', 'false')) in ('true','1','t','yes') or p.warning_text_candidate is not null or nullif(btrim(p.j->>'alert_title'), '') is not null or nullif(btrim(p.j->>'alert_level'), '') is not null then p.warning_label_candidate end as warning_label_final,
    case when lower(coalesce(p.j->>'should_alert', 'false')) in ('true','1','t','yes') or p.warning_text_candidate is not null or nullif(btrim(p.j->>'alert_title'), '') is not null or nullif(btrim(p.j->>'alert_level'), '') is not null then p.warning_text_candidate end as warning_text_final
  from prepared p
)
select
  j->>'id' as id,
  j->>'upsert_key' as upsert_key,
  order_number_final as order_number,
  j->>'order_number_display' as order_number_display,
  source_time,
  order_time_display_final as order_time_display,
  j->>'page_name' as page_name,
  coalesce(nullif(btrim(j->>'facebook_name'), ''), nullif(btrim(j->>'customer_name'), '')) as facebook_name,
  coalesce(nullif(btrim(j->>'customer_name'), ''), nullif(btrim(j->>'facebook_name'), '')) as customer_name,
  coalesce(nullif(btrim(j->>'phone'), ''), nullif(btrim(j->>'extracted_phone'), '')) as phone,
  j->>'extracted_phone' as extracted_phone,
  j->>'cod_amount' as cod_amount,
  address_final as address_for_delivery,
  j->>'address_display_packer' as address_display_packer,
  j->>'addressclean' as addressclean,
  j->>'province' as province,
  j->>'zipcode' as zipcode,
  product_text_final as for_packer_st_display,
  product_text_final as single_cleaned_products,
  j->>'quantity' as quantity,
  j->>'qty' as qty,
  j->>'extracted_qty' as extracted_qty,
  j->>'shipping_method' as shipping_method,
  coalesce(nullif(btrim(j->>'order_status'), ''), 'ORDER_SNIPER_X') as order_status,
  coalesce(nullif(btrim(j->>'order_status_backup'), ''), nullif(btrim(j->>'routing_tag'), ''), 'ORDER_SNIPER_X') as order_status_backup,
  telegram_header_final as telegram_header,
  coalesce(nullif(btrim(j->>'telegram_header_type'), ''), 'DEFAULT') as telegram_header_type,
  warning_label_final as telegram_warning_label,
  warning_text_final as telegram_warning_text,
  nullif(btrim(j->>'alert_level'), '') as telegram_warning_level,
  j->>'alert_status' as alert_status,
  j->>'alert_reason' as alert_reason,
  j->>'should_alert' as should_alert,
  j->>'warn_text' as warn_text,
  j->>'missingFields' as missingFields,
  j->>'telegram_sent' as telegram_sent,
  lower(coalesce(j->>'telegram_sent', 'false')) in ('true','1','t','sent','delivered','ไปแล้วไปลับ') as is_sent,
  j->>'chat_timeline' as chat_timeline,
  j->>'normalized_chat_timeline' as normalized_chat_timeline,
  null::text as telegram_message,
  j->>'telegram_copy_text' as telegram_copy_text,
  format(E'%s\n━━━━━━━━━━━━━━━━━━━━\n⏰ <b>เวลาสั่งซื้อ:</b> %s\n🆔 <b>เลขออเดอร์:</b> <code>%s</code>\n📢 <b>ชื่อเพจ:</b> %s\n👤 <b>Facebook:</b> %s\n💰 <b>ยอด COD:</b> <code>%s</code> บาท\n━━━━━━━━━━━━━━━━━━━━\n<code>%s</code>\n<code>%s</code>\n<code>%s</code>\n📦 <b>รายการสินค้า:</b>\n<code>%s</code>\n━━━━━━━━━━━━━━━━━━━━\n🚚 <b>ขนส่ง:</b> %s%s\n━━━━━━━━━━━━━━━━━━━━',
    telegram_header_final,
    coalesce(order_time_display_final, ''), order_number_final,
    coalesce(j->>'page_name',''), coalesce(j->>'customer_name', j->>'facebook_name',''), coalesce(j->>'cod_amount',''),
    coalesce(j->>'customer_name', j->>'facebook_name',''), coalesce(j->>'phone', j->>'extracted_phone',''), coalesce(address_final, 'ไม่ระบุที่อยู่'), coalesce(product_text_final, 'ตรวจสอบสินค้า — ไม่ทิ้งรายการ'), coalesce(nullif(btrim(j->>'shipping_method'), ''), '⚡FLASH EXPRESS'), CASE WHEN concat_ws(E'\n', warning_label_final, warning_text_final) <> '' THEN E'\n' || concat_ws(E'\n', warning_label_final, warning_text_final) ELSE '' END) as telegram_message_dynamic,
  j as source_order_row
from dressed;

create view public.vw_st_telegram_delivery_queue_fast as
select *, 'PENDING_REVIEW_OR_SEND'::text as queue_status
from public.vw_st_telegram_delivery_source_fast
where not is_sent;

create view public.vw_st_telegram_delivery_today_fast as
select *, 'CURRENT_CUTOFF_SEND_READY'::text as queue_status
from public.vw_st_telegram_delivery_source_fast
where not is_sent;

create view public.vw_st_telegram_delivery_yesterday_after_14_fast as
select *, 'ROLLING_SEND_READY'::text as queue_status
from public.vw_st_telegram_delivery_source_fast
where not is_sent and source_time::time >= time '22:30';

comment on view public.vw_st_telegram_delivery_source_fast is 'ST clean Telegram source; direct from st_orders; product and SB header are explicit.';
comment on view public.vw_st_telegram_delivery_queue_fast is 'ST clean Telegram queue; sent rows excluded.';

commit;
