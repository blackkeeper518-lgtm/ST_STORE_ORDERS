-- ST ONLY · BACKFILL DELIVERY STATUS
-- Run in ST Supabase only. Does not modify n8n payload fields.

ALTER TABLE public.st_orders
  ADD COLUMN IF NOT EXISTS telegram_status text,
  ADD COLUMN IF NOT EXISTS delivery_state text NOT NULL DEFAULT 'WAITING',
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS recalled_at timestamptz,
  ADD COLUMN IF NOT EXISTS recall_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_delivery_note text;

UPDATE public.st_orders
SET telegram_sent = CASE
      WHEN lower(COALESCE(telegram_sent, '')) IN ('true','1','t','sent','delivered','ไปแล้วไปลับ') THEN 'true'
      ELSE 'false'
    END,
    telegram_status = CASE
      WHEN lower(COALESCE(telegram_sent, '')) IN ('true','1','t','sent','delivered','ไปแล้วไปลับ') THEN 'SENT'
      WHEN lower(COALESCE(telegram_status, '')) = 'RECALLED' THEN 'RECALLED'
      ELSE 'WAITING'
    END,
    delivery_state = CASE
      WHEN lower(COALESCE(telegram_sent, '')) IN ('true','1','t','sent','delivered','ไปแล้วไปลับ') THEN 'SENT'
      WHEN lower(COALESCE(telegram_status, '')) = 'RECALLED' THEN 'RECALLED'
      ELSE 'WAITING'
    END
WHERE telegram_status IS NULL
   OR btrim(telegram_status) = ''
   OR delivery_state IS NULL
   OR btrim(delivery_state) = ''
   OR telegram_sent IS NULL
   OR btrim(telegram_sent) = '';

-- ตรวจผลก่อนเปิดเว็บ
SELECT upsert_key, order_number, telegram_sent, telegram_status, delivery_state, sent_at, recalled_at
FROM public.st_orders
ORDER BY COALESCE(order_time, created_at) DESC NULLS LAST
LIMIT 30;
