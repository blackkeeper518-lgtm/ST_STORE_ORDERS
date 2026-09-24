-- ST ONLY · STAMP TELEGRAM HEADER BY PRODUCT LANE
-- Run in ST Supabase only. Existing non-empty custom headers are preserved.

CREATE OR REPLACE FUNCTION public.st_header_for_product(p_product text, p_key text)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $function$
DECLARE lane text; pick integer; headers text[];
BEGIN
  IF lower(coalesce(p_product,'')) ~ '(mango|แตงโม|watermelon|berry|blueberry|องุ่น|grape|ส้ม|orange|สับปะรด|pineapple|ผลไม้|cavallo)' THEN
    lane := 'FRUIT';
    headers := ARRAY['🍉 [ผลไม้พรีเมียม · สดกว่านี้ก็ต้องกินบนต้น]','🥭 [สายผลไม้ · ส่งไวระเบิด คัดสดๆ ไม่สดคัดทิ้ง]','🍇 [ผลไม้ด่วน · ช้าหมดอดหวาน เจอกันปลายทาง]','🍊 [สายผลไม้ · แพ็กอย่างดี ถ้าบุบสลายเคลมยันเงา]','🍍 [ผลไม้พร้อมยิง · สดใหม่สะท้านทรวง หลุดคิวคือพลาด]'];
  ELSIF lower(coalesce(p_product,'')) ~ '(red|แดง|hot|ร้อน|เผ็ด|spicy|fire)' THEN
    lane := 'HOT';
    headers := ARRAY['💥 [สายร้อนด่วนจี๋ · แรงกว่าศรัทธา ก็ออเดอร์จาร์นนี่แหละ]','🔥 [สายร้อนสปีด · วิ่งตัดหน้ายมบาล เพื่อไปส่งงานให้ทันรอบ]','⚡ [สายร้อนยิงยับ · อย่ากะพริบตา เพราะความเร็วเราเหนือกฎหมาย]','🚨 [สายร้อน VIP · บิลนี้ห้ามดอง คลังมีเรื่องแน่]','🚀 [สายร้อนพร้อมบวก · เคลียร์ทางให้หน่อย รถแรงกำลังจะไป]'];
  ELSE
    lane := 'COOL';
    headers := ARRAY['❄️ [สายเย็นสุดขั้ว · เย็นชาเหมือนเธอ แต่สินค้าเจอแล้วโอนไว]','🧊 [สายเย็นรถแช่ · คุมอุณหภูมิระดับพรีเมียม แข็งเป๊กยันปลายทาง]','🌬️ [สายเย็นสปีด · ถึงจะแช่แข็ง แต่ความแรงระดับจรวด]','🐧 [ออเดอร์แช่เย็น · เย็นกายสบายใจ ช้าไปไอติมละลาย]','🥶 [สายเย็นพร้อมลุย · ล็อกความสด บดความช้า ล่าความไว]'];
  END IF;
  pick := abs((('x' || substr(md5(coalesce(p_key,p_product,'')), 1, 8))::bit(32)::bigint % array_length(headers,1))::integer) + 1;
  RETURN headers[pick];
END;
$function$;

CREATE OR REPLACE FUNCTION public.st_stamp_telegram_header()
RETURNS trigger LANGUAGE plpgsql AS $function$
DECLARE product_text text; lane text;
BEGIN
  product_text := coalesce(NEW.for_packer_st_display, NEW.single_cleaned_products, NEW.product_name, NEW.sku, '');
  IF lower(product_text) ~ '(mango|แตงโม|watermelon|berry|blueberry|องุ่น|grape|ส้ม|orange|สับปะรด|pineapple|ผลไม้|cavallo)' THEN lane := 'FRUIT';
  ELSIF lower(product_text) ~ '(red|แดง|hot|ร้อน|เผ็ด|spicy|fire)' THEN lane := 'HOT';
  ELSE lane := 'COOL'; END IF;
  IF nullif(btrim(NEW.telegram_header),'') IS NULL OR NEW.telegram_header ~ '(🌻|ข้อมูลครบ|ครบหมด|พร้อมยิงแฟลช|ORDER_SNIPER_X)' THEN NEW.telegram_header := public.st_header_for_product(product_text, NEW.upsert_key); END IF;
  IF nullif(btrim(NEW.telegram_header_type),'') IS NULL THEN NEW.telegram_header_type := lane; END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_st_stamp_telegram_header ON public.st_orders;
CREATE TRIGGER trg_st_stamp_telegram_header BEFORE INSERT OR UPDATE OF for_packer_st_display, single_cleaned_products, telegram_header ON public.st_orders FOR EACH ROW EXECUTE FUNCTION public.st_stamp_telegram_header();

UPDATE public.st_orders
SET telegram_header_type = CASE WHEN lower(coalesce(for_packer_st_display, single_cleaned_products, product_name, sku, '')) ~ '(mango|แตงโม|watermelon|berry|blueberry|องุ่น|grape|ส้ม|orange|สับปะรด|pineapple|ผลไม้|cavallo)' THEN 'FRUIT' WHEN lower(coalesce(for_packer_st_display, single_cleaned_products, product_name, sku, '')) ~ '(red|แดง|hot|ร้อน|เผ็ด|spicy|fire)' THEN 'HOT' ELSE 'COOL' END,
    telegram_header = CASE WHEN nullif(btrim(telegram_header),'') IS NULL OR telegram_header ~ '(🌻|ข้อมูลครบ|ครบหมด|พร้อมยิงแฟลช|ORDER_SNIPER_X)' THEN public.st_header_for_product(coalesce(for_packer_st_display, single_cleaned_products, product_name, sku, ''), upsert_key) ELSE telegram_header END
WHERE nullif(btrim(telegram_header),'') IS NULL OR telegram_header ~ '(🌻|ข้อมูลครบ|ครบหมด|พร้อมยิงแฟลช|ORDER_SNIPER_X)' OR nullif(btrim(telegram_header_type),'') IS NULL;
