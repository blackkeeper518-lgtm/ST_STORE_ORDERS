-- ST ONLY · TELEGRAM DELIVERY VIEW V1
-- New view family. Does not replace legacy Telegram views.
-- Product source: vw_st_product_extraction_lab.lab_product_candidates.
-- Header source: telegram_header from the ST order row.
-- Warnings stay at the bottom of the bill.

DROP VIEW IF EXISTS public.vw_st_telegram_delivery_lab_queue;
DROP VIEW IF EXISTS public.vw_st_telegram_delivery_lab_repair;
DROP VIEW IF EXISTS public.vw_st_telegram_delivery_lab;

CREATE VIEW public.vw_st_telegram_delivery_lab AS
WITH base AS (
  SELECT
    o.upsert_key,
    o.order_number,
    o.order_number_display,
    o.order_time_display,
    o.page_name,
    o.facebook_name,
    o.customer_name,
    o.phone,
    o.extracted_phone,
    o.cod_amount,
    COALESCE(NULLIF(BTRIM(o.address_display_packer), ''), NULLIF(BTRIM(o.addressclean), ''), NULLIF(BTRIM(o.full_address), ''), 'ไม่ระบุที่อยู่') AS address_final,
    COALESCE(NULLIF(BTRIM(o.shipping_method), ''), '⚡FLASH EXPRESS') AS shipping_final,
    o.telegram_header,
    o.telegram_header_type,
    o.telegram_sent,
    o.should_alert,
    o.alert_title,
    o.alert_level,
    o.alert_text,
    o.warn_text,
    o.alert_reason,
    l.lab_product_candidates,
    l.lab_product_line_count,
    l.lab_total_cot,
    l.lab_matched_line_count,
    l.lab_status,
    l.lab_reason
  FROM public.st_orders o
  LEFT JOIN public.vw_st_product_extraction_lab l
    ON l.upsert_key = o.upsert_key
), products AS (
  SELECT
    b.*,
    COALESCE(
      string_agg(
        regexp_replace(
          COALESCE(NULLIF(BTRIM(item->>'master_display'), ''), '📦 ' || COALESCE(item->>'raw_text', 'ตรวจสอบสินค้า')),
          '[[:space:]]*(x[[:space:]]*)?[0-9]+([.][0-9]+)?[[:space:]]*คอต[.]?[[:space:]]*$',
          '',
          'i'
        )
        || ' x ' || COALESCE(NULLIF(item->>'cot_quantity', ''), '1') || ' คอต',
        E'\n' ORDER BY NULLIF(item->>'source_line_no', '')::integer
      ) FILTER (WHERE item IS NOT NULL),
      '📦 ตรวจสอบสินค้า — ไม่ทิ้งรายการ'
    ) AS product_text
  FROM base b
  LEFT JOIN LATERAL jsonb_array_elements(COALESCE(b.lab_product_candidates, '[]'::jsonb)) item ON TRUE
  GROUP BY b.upsert_key, b.order_number, b.order_number_display, b.order_time_display, b.page_name,
    b.facebook_name, b.customer_name, b.phone, b.extracted_phone, b.cod_amount, b.address_final,
    b.shipping_final, b.telegram_header, b.telegram_header_type, b.telegram_sent, b.should_alert,
    b.alert_title, b.alert_level, b.alert_text, b.warn_text, b.alert_reason,
    b.lab_product_candidates, b.lab_product_line_count, b.lab_total_cot, b.lab_matched_line_count,
    b.lab_status, b.lab_reason
), dressed AS (
  SELECT
    p.*,
    CASE
      WHEN NULLIF(BTRIM(p.telegram_header), '') IS NOT NULL
       AND p.telegram_header !~ '(🌻|ข้อมูลครบ|ครบหมด|พร้อมยิงแฟลช)'
      THEN BTRIM(p.telegram_header)
      ELSE '🚀 [บิลสมบูรณ์ - 🎯ORDER_SNIPER_X]'
    END AS header_final,
    CASE
      WHEN LOWER(COALESCE(p.should_alert::text, 'false')) IN ('true','1','t','yes')
        OR NULLIF(BTRIM(COALESCE(p.alert_title, '')), '') IS NOT NULL
        OR NULLIF(BTRIM(COALESCE(p.alert_level, '')), '') IS NOT NULL
        OR NULLIF(BTRIM(COALESCE(p.alert_text, '')), '') IS NOT NULL
        OR NULLIF(BTRIM(COALESCE(p.warn_text, '')), '') IS NOT NULL
      THEN concat_ws(E'\n', NULLIF(BTRIM(p.alert_title), ''), NULLIF(BTRIM(p.alert_level), ''), NULLIF(BTRIM(p.alert_text), ''), NULLIF(BTRIM(p.warn_text), ''), NULLIF(BTRIM(p.alert_reason), ''))
      ELSE ''
    END AS warning_final
  FROM products p
)
SELECT
  d.*,
  LOWER(COALESCE(d.telegram_sent::text, 'false')) IN ('true','1','t','yes','sent','delivered','ไปแล้วไปลับ') AS is_sent,
  format(E'%s\n━━━━━━━━━━━━━━━━━━━━\n⏰ <b>เวลาสั่งซื้อ:</b> %s\n🆔 <b>เลขออเดอร์:</b> <code>%s</code>\n📢 <b>ชื่อเพจ:</b> %s\n👤 <b>Facebook:</b> %s\n💰 <b>ยอด COD:</b> <code>%s</code> บาท\n━━━━━━━━━━━━━━━━━━━━\n<code>%s</code>\n<code>%s</code>\n<code>%s</code>\n📦 <b>รายการสินค้าสำหรับจัดของ:</b>\n<code>%s</code>\n━━━━━━━━━━━━━━━━━━━━\n🚚 <b>ขนส่ง:</b> %s%s',
    d.header_final,
    COALESCE(d.order_time_display, ''), COALESCE(d.order_number_display, d.order_number, d.upsert_key),
    COALESCE(d.page_name, ''), COALESCE(d.customer_name, d.facebook_name, ''), COALESCE(d.cod_amount::text, ''),
    COALESCE(d.customer_name, d.facebook_name, ''), COALESCE(d.phone, d.extracted_phone, ''), d.address_final,
    d.product_text, d.shipping_final,
    CASE WHEN d.warning_final <> '' THEN E'\n🚨 <b>ป้ายเตือน</b>\n' || d.warning_final ELSE '' END
  ) AS telegram_message_dynamic
FROM dressed d;

CREATE VIEW public.vw_st_telegram_delivery_lab_queue AS
SELECT *, 'READY_TO_SEND'::text AS queue_status
FROM public.vw_st_telegram_delivery_lab
WHERE NOT is_sent AND lab_status = 'PASS';

CREATE VIEW public.vw_st_telegram_delivery_lab_repair AS
SELECT *, 'REPAIR_REQUIRED'::text AS queue_status
FROM public.vw_st_telegram_delivery_lab
WHERE NOT is_sent AND COALESCE(lab_status, 'ALIEN') <> 'PASS';
