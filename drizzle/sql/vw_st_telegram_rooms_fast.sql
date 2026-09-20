-- ST ONLY / TELEGRAM ROOMS FINAL
-- Source: public.vw_st_orders_all_v2
-- Read-only views; no product_alien_terms table is referenced.

begin;

drop view if exists public.vw_st_telegram_delivery_today_fast;
drop view if exists public.vw_st_telegram_delivery_yesterday_after_14_fast;
drop view if exists public.vw_st_telegram_delivery_queue_fast;
drop view if exists public.vw_st_telegram_delivery_source_fast;

create view public.vw_st_telegram_delivery_source_fast as
with base as (
  select to_jsonb(o) as j from public.vw_st_orders_all_v2 o
), prepared as (
  select
    j,
    coalesce(nullif(btrim(j->>'order_number_display'), ''), nullif(btrim(j->>'order_number'), ''), nullif(btrim(j->>'upsert_key'), ''), 'NO_ORDER_NUMBER') as order_number_final,
    coalesce(nullif(btrim(j->>'address_display_packer'), ''), nullif(btrim(j->>'address_display_primary'), ''), nullif(btrim(j->>'final_address_for_bill'), ''), nullif(btrim(j->>'full_address'), ''), nullif(btrim(j->>'addressclean'), ''), nullif(btrim(j->>'full_address_backup_1'), ''), nullif(btrim(j->>'full_address_backup_2'), ''), nullif(concat_ws(' ', j->>'short_address', j->>'district', j->>'amphoe', j->>'province', j->>'zipcode'), '')) as address_final,
    coalesce(
      case when nullif(btrim(j->>'single_cleaned_products'), '') is not null and j->>'single_cleaned_products' !~* '(เบอร์โทร|โทรศัพท์|ที่อยู่|จุดสังเกตุ|จังหวัด|อำเภอ|ตำบล|รหัสไปรษณีย์)' then btrim(j->>'single_cleaned_products') end,
      nullif(btrim(j->>'final_display_for_packer'), ''), nullif(btrim(j->>'master_display_for_packer'), ''), nullif(btrim(j->>'product_display_for_packer'), ''), nullif(btrim(j->>'product_lines'), ''), nullif(btrim(j->>'telegram_final_mapped'), ''), nullif(btrim(j->>'product_copy_text'), ''), nullif(btrim(j->>'extracted_product_raw'), ''), nullif(btrim(j->>'display_for_packer'), ''), nullif(btrim(j->>'product_name'), ''), nullif(btrim(j->>'th_name'), ''), nullif(btrim(j->>'sku'), ''), nullif(btrim(j->>'master_sku'), '')
    ) as product_text_final,
    coalesce(nullif(btrim(j->>'master_qty_display'), ''), nullif(btrim(j->>'quantity'), ''), nullif(btrim(j->>'qty'), ''), nullif(btrim(j->>'extracted_qty'), ''), nullif(btrim(j->>'master_extracted_qty'), '')) as quantity_final,
    coalesce(nullif(btrim(j->>'sku'), ''), nullif(btrim(j->>'master_sku'), ''), nullif(btrim(j->>'extracted_sku'), '')) as sku_final,
    coalesce(nullif(btrim(j->>'telegram_status'), ''), nullif(btrim(j->>'telegram_body_status'), ''), nullif(btrim(j->>'delivery_status'), ''), 'PENDING') as telegram_status_final,
    coalesce(nullif(btrim(j->>'order_time'), ''), nullif(btrim(j->>'order_message_created_at'), ''), nullif(btrim(j->>'facebook_message_created_at'), ''), nullif(btrim(j->>'facebook_created_at'), ''), nullif(btrim(j->>'fb_created_at'), ''), nullif(btrim(j->>'order_close_time_from_chat'), ''), nullif(btrim(j->>'occurred_at'), ''), nullif(btrim(j->>'created_at'), '')) as source_time_text
  from base
), classified as (
  select p.*, case when nullif(btrim(p.product_text_final), '') is null then false when p.product_text_final ~* '^(📦|รูปกล่อง|รูปภาพ|image|photo|attachment|sticker)([[:space:]]|$)' then false when p.product_text_final ~* '(เอเลี่ยน|alien_raw)' then false else true end as is_mapped
  from prepared p
), dressed as (
  select
    c.*, upper(regexp_replace(coalesce(nullif(to_jsonb(pm)->>'shipping_lane', ''), nullif(to_jsonb(pm)->>'delivery_lane', ''), nullif(to_jsonb(pm)->>'product_lane', ''), nullif(to_jsonb(pm)->>'temperature_zone', ''), nullif(to_jsonb(pm)->>'category', ''), nullif(to_jsonb(pm)->>'emoji', ''), ''), '[^A-Za-z0-9ก-๙]+', '', 'g')) as lane_key, coalesce(nullif(to_jsonb(pm)->>'master_display_for_packer', ''), nullif(to_jsonb(pm)->>'master_display', ''), nullif(to_jsonb(pm)->>'display_for_packer', ''), c.product_text_final) as master_display_for_packer, pm.th_name as master_th_name, pm.stock_qty as master_stock_qty, pm.stock_status as master_stock_status,
    pm.stock_qty as stock_qty, pm.stock_status as stock_status,
    case when pm.master_sku is null then 'UNKNOWN' when coalesce(pm.stock_qty, 0) <= 0 or upper(coalesce(pm.stock_status, '')) like '%OUT%' or upper(coalesce(pm.stock_status, '')) like '%หมด%' then 'OUT_OF_STOCK' else 'IN_STOCK' end as product_stock_state,
    case when not c.is_mapped then 'REVIEW_PRODUCT' else 'MAPPED_FROM_ORDER_TABLE' end as mapping_status_fast,
    case
      when pm.master_sku is null then '🕵️ สินค้าหายตัวเท่ๆ'
      when coalesce(pm.stock_qty, 0) <= 0 or upper(coalesce(pm.stock_status, '')) like '%OUT%' or upper(coalesce(pm.stock_status, '')) like '%หมด%' then format('❌สินค้าหมดแล้วแม่❌ (%s)
💬 “%s”', coalesce(pm.th_name, c.product_text_final, 'ไม่ระบุสินค้า'), case upper(regexp_replace(coalesce(to_jsonb(pm)->>'brand', to_jsonb(pm)->>'brand_name', to_jsonb(pm)->>'manufacturer', pm.master_sku, ''), '[^A-Za-z0-9]', '', 'g'))
        when 'VESS' then 'เวสหมดแล้ว แอดตามหา GPS ยังไม่เจอ!'
        when 'MOND' then 'ม่อนขอลาไปหลบในเงามืดก่อนจาร์ย!'
        when 'OS' then 'โอเอสโดนเหมาเกลี้ยง เหลือแต่ความสดในความทรงจำ!'
        when 'ORIS' then 'โอริสแอบดีดหนีไปเที่ยวแล้วจาร์ย!'
        when 'MILANO' then 'มิลาโน่ขอไปเดินพรมแดงก่อน ไม่ว่างเข้าคลัง!'
        when 'PLATINUM' then 'แพลตตินั่มพรีเมียมเกินไป โดนเหมาหมดแล้วจาร์ย!'
        when 'JOHN' then 'จอนหนีไปสปาแล้วจาร์ย ขอพักยาวหน่อย!'
        when 'ROYAL' then 'รอยัลบอกขอลา ไปเป็นราชาแล้ว!'
        when 'SMS' then 'SMS งอนระบบแล้ว ทุบซิมหนีไปเรียบร้อย!'
        when 'GOLDMOUNT' then 'โกลด์เมาท์หนีไปขูดเลขเด็ดแล้วจาร์ย!'
        when 'SEVIOS' then 'ซีวอสแรงกว่าศรัทธา สต็อกหมดแล้วซิ่งหนีไปปากช่อง!'
        when 'SIERRA' then 'เซียร์ร่าทุบซิมหนีเข้าป่าไปแล้วจาร์ย!'
        when 'CAVALLO' then 'คาวาโร่ควบม้าหนีออกจากคลังไปแล้ว!'
        when 'VOXX' then 'ว็อกซ์หนีไปหน้าเวทีหมอลำแล้วจาร์ย!'
        when 'WALTON' then 'วอลตันซ้อนมอเตอร์ไซค์หนีไปรับลมทะเลแล้ว!'
        when 'TEXAS' then 'เท็กซัสควบม้าหนีข้ามแดนไปแล้วจาร์ย!'
        when 'BAROESAN' then 'บารูซันขอลาพักยาว ปิดสัญญาณหนีแล้ว!'
        when 'MARLBORO' then 'มาร์ลโบโร่โดนเหมาเกลี้ยง ไม่เหลือให้แอดแล้ว!'
        when 'GM' then 'แอดลืมสั่งเอง โทษใครล่ะ? โทษ GM ที่ขายดีเกิ๊น!'
        when 'KRONGTHIP' then 'กรองทิพย์หนีไปลุ้นหวยแล้วจาร์ย!'
        when 'LM' then 'แอลเอ็มตัวตึง ดึงเข้ากลุ่มไปหมดแล้ว!'
        when 'SUK' then 'สุขหนีไปจำศีล แต่แอดมินไม่สุขด้วยแล้ว!'
        when 'BLUEICE' then 'บลูไอซ์แข็งเป๊กจนระบบล็อกแล้วจาร์ย!'
        when 'DANDJ' then 'ดีแอนด์เจแพ็กกระเป๋าหนีไปแล้ว!'
        when 'CANYON' then 'แคนยอนปิดเครื่องหนีเข้าป่าไปแล้ว!'
        when 'CAPITAL' then 'แคปิตอลหอบทุนหนีไปเปิดร้านแล้วจาร์ย!'
        when '235' then '235 ขอลาไปเปลี่ยนชื่อแก้เคล็ดก่อน!'
        else (array['แอดลืมสั่งเอง โทษใครล่ะ? ของขายดีเกิ๊น!','ลูกค้าเหมาเกลี้ยง แอดยืนงงในดงคลัง!','น้องสินค้าขอลาพัก สต็อกหมดแล้วจาร์ย!'])[1 + (abs(hashtext(coalesce(pm.master_sku, ''))) % 3)]
      end) end as master_stock_notice
  from classified c left join public.product_master pm on lower(coalesce(pm.master_sku, '')) = lower(coalesce(c.sku_final, ''))
)
select
  d.j->>'id' as id, d.j->>'upsert_key' as upsert_key, d.order_number_final as order_number, d.j->>'order_number_display' as order_number_display,
  d.source_time_text::timestamptz as source_time, (d.source_time_text::timestamptz at time zone 'Asia/Bangkok')::date as source_date_bkk,
  coalesce(d.j->>'facebook_time_display', d.j->>'order_time_display', d.j->>'order_time', '') as order_time_display, d.j->>'order_time' as facebook_order_time,
  d.j->>'page_name' as page_name, coalesce(nullif(btrim(d.j->>'facebook_name'), ''), nullif(btrim(d.j->>'customer_name'), '')) as facebook_name, coalesce(nullif(btrim(d.j->>'customer_name'), ''), nullif(btrim(d.j->>'facebook_name'), '')) as customer_name,
  coalesce(nullif(btrim(d.j->>'extracted_phone'), ''), nullif(btrim(d.j->>'phone'), '')) as extracted_phone, d.j->>'cod_amount' as cod_amount, d.address_final as address_for_delivery,
  d.j->>'address_display_packer' as address_display_packer, d.j->>'addressclean' as addressclean, d.j->>'full_address' as full_address, d.j->>'province' as province, d.j->>'zipcode' as zipcode,
  d.j->>'raw_text_with_phone' as raw_text_with_phone, d.j->>'raw_product_evidence' as raw_product_evidence, d.j->>'normalized_chat_timeline' as normalized_chat_timeline,
  d.master_display_for_packer as n8n_product_display, d.master_display_for_packer as single_cleaned_products, d.master_display_for_packer as final_display_for_packer, d.master_display_for_packer as master_display_for_packer, d.product_text_final as product_evidence_display,
  case when d.product_stock_state = 'OUT_OF_STOCK' then d.master_stock_notice when d.is_mapped then d.master_display_for_packer else '🕵️ สินค้าหายตัวเท่ๆ' end as product_for_delivery, d.quantity_final as quantity_from_order_table, d.j->>'quantity' as quantity, d.j->>'qty' as qty, d.j->>'extracted_qty' as extracted_qty, d.j->>'master_qty_display' as master_qty_display,
  d.sku_final as sku, d.j->>'master_sku' as master_sku, d.lane_key, d.master_th_name, d.master_stock_qty, d.master_stock_status, d.stock_qty, d.stock_status, d.master_stock_notice, d.product_stock_state,
  d.is_mapped, d.mapping_status_fast, d.mapping_status_fast as mapping_status, d.mapping_status_fast as web_mapping_status, d.telegram_status_final as telegram_status,
  (lower(coalesce(d.j->>'telegram_sent', 'false')) in ('true','t','1') or upper(d.telegram_status_final) in ('SENT','SENT_TO_TELEGRAM','DELIVERED') or d.telegram_status_final = 'ไปแล้วไปลับ') as is_sent,
  format('%s\n━━━━━━━━━━━━━━━━━━━━\n⏰ <b>เวลาสั่งซื้อ:</b> %s\n🆔 <b>เลขออเดอร์:</b> <code>%s</code>\n📢 <b>ชื่อเพจ:</b> %s\n👤 <b>Facebook:</b> %s\n💰 <b>ยอด COD:</b> <code>%s</code> บาท\n━━━━━━━━━━━━━━━━━━━━\n<code>%s</code>\n<code>%s</code>\n<code>%s</code>\n📦 <b>รายการสินค้า:</b>\n%s\n━━━━━━━━━━━━━━━━━━━━', case
      when d.product_stock_state = 'OUT_OF_STOCK' then d.master_stock_notice
      when d.lane_key in ('COOL','COLD','GREEN','สายเย็น') then (array['❄️ [สายเย็นสุดขั้ว · เย็นชาเหมือนเธอ แต่สินค้าเจอแล้วโอนไว]','🧊 [สายเย็นรถแช่ · คุมอุณหภูมิระดับพรีเมียม แข็งเป๊กยันปลายทาง]','🌬️ [สายเย็นสปีด · ถึงจะแช่แข็ง แต่ความแรงระดับจรวด]','🐧 [ออเดอร์แช่เย็น · เย็นกายสบายใจ ช้าไปไอติมละลาย]','🥶 [สายเย็นพร้อมลุย · ล็อกความสด บดความช้า ล่าความไว]'])[1 + (abs(hashtext(coalesce(d.order_number_final, ''))) % 5)]
      when d.lane_key in ('HOT','RED','ร้อน','สายร้อน') then (array['💥 [สายร้อนด่วนจี๋ · แรงกว่าศรัทธา ก็ออเดอร์จาร์ยนี่แหละ]','🔥 [สายร้อนสปีด · วิ่งตัดหน้ายมบาล เพื่อไปส่งงานให้ทันรอบ]','⚡ [สายร้อนยิงยับ · อย่ากะพริบตา เพราะความเร็วเราเหนือกฎหมาย]','🚨 [สายร้อน VIP · บิลนี้ห้ามดอง ถ้าดองคลังมีเรื่องแน่]','🚀 [สายร้อนพร้อมบวก · เคลียร์ทางให้หน่อย รถแรงกำลังจะไป]'])[1 + (abs(hashtext(coalesce(d.order_number_final, ''))) % 5)]
      when d.lane_key in ('FRUIT','FRUITS','ผลไม้','สายผลไม้') then (array['🍉 [ผลไม้พรีเมียม · สดกว่านี้ก็ต้องกินบนต้น]','🥭 [สายผลไม้ · ส่งไวระเบิด คัดสดๆ ไม่สดคัดทิ้ง]','🍇 [ผลไม้ด่วน · ช้าหมดอดหวาน เจอกันปลายทาง]','🍊 [สายผลไม้ · แพ็กอย่างดี ถ้าบุบสลายเคลมยันเงา]','🍍 [ผลไม้พร้อมยิง · สดใหม่สะท้านทรวง หลุดคิวคือพลาด]'])[1 + (abs(hashtext(coalesce(d.order_number_final, ''))) % 5)]
      else coalesce(nullif(btrim(d.j->>'sticker_node'), ''), nullif(btrim(d.j->>'status_sticker'), ''), nullif(btrim(d.j->>'order_stamp'), ''), '🚀') || ' <b>[บิลสมบูรณ์ - ' || coalesce(nullif(btrim(d.j->>'order_status'), ''), nullif(btrim(d.j->>'routing_tag'), ''), 'ORDER_SNIPER_X') || ']</b>'
    end, coalesce(d.j->>'facebook_time_display', d.j->>'order_time_display', d.j->>'order_time', ''), d.order_number_final, coalesce(d.j->>'page_name',''), coalesce(d.j->>'facebook_name', d.j->>'customer_name',''), coalesce(d.j->>'cod_amount',''), coalesce(d.j->>'customer_name',''), coalesce(d.j->>'phone', d.j->>'extracted_phone',''), coalesce(d.address_final,'ไม่ระบุที่อยู่'), case when d.product_stock_state = 'OUT_OF_STOCK' then d.master_stock_notice when d.is_mapped then d.master_display_for_packer else '🕵️ สินค้าหายตัวเท่ๆ' end) as telegram_message_dynamic,
  d.j->>'telegram_message' as telegram_message, d.j->>'telegram_copy_text' as telegram_copy_text, d.j->>'telegram_sent' as telegram_sent, d.j as source_order_row
from dressed d;

create view public.vw_st_telegram_delivery_queue_fast as select *, 'PENDING_REVIEW_OR_SEND'::text as queue_status from public.vw_st_telegram_delivery_source_fast where not is_sent;
create view public.vw_st_telegram_delivery_today_fast as select *, 'TODAY_SEND_READY'::text as queue_status from public.vw_st_telegram_delivery_source_fast where not is_sent and source_date_bkk = (now() at time zone 'Asia/Bangkok')::date;
create view public.vw_st_telegram_delivery_yesterday_after_14_fast as select *, 'FROM_YESTERDAY_14_TO_TODAY_14_SEND_READY'::text as queue_status from public.vw_st_telegram_delivery_source_fast where not is_sent and source_time >= (((now() at time zone 'Asia/Bangkok')::date - 1) + time '14:00:00') at time zone 'Asia/Bangkok' and source_time < (((now() at time zone 'Asia/Bangkok')::date) + time '14:00:00') at time zone 'Asia/Bangkok';

comment on view public.vw_st_telegram_delivery_source_fast is 'ST Telegram source from vw_st_orders_all_v2; review and out-of-stock rows are retained.';
comment on view public.vw_st_telegram_delivery_queue_fast is 'ST Telegram waiting queue; sent rows excluded.';
comment on view public.vw_st_telegram_delivery_today_fast is 'ST Telegram today room by Facebook order time in Asia/Bangkok.';
comment on view public.vw_st_telegram_delivery_yesterday_after_14_fast is 'ST Telegram rolling room from yesterday 14:00 to today 14:00 Asia/Bangkok.';

commit;

-- Verify after running:
-- select count(*) from public.vw_st_telegram_delivery_queue_fast;
-- select order_number, order_time_display, product_for_delivery, quantity_from_order_table, master_stock_notice, is_sent from public.vw_st_telegram_delivery_queue_fast order by source_time desc limit 20;
-- select mapping_status, count(*) from public.vw_st_telegram_delivery_source_fast group by mapping_status;
-- select product_stock_state, count(*) from public.vw_st_telegram_delivery_source_fast group by product_stock_state;
-- select telegram_status, is_sent, count(*) from public.vw_st_telegram_delivery_source_fast group by telegram_status, is_sent;
-- select * from public.vw_st_telegram_delivery_source_fast where source_time is null or telegram_message_dynamic is null;
