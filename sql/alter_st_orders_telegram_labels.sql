-- ST ONLY · เพิ่มฟิวด์หัวบิลสินค้าและป้าย Telegram
-- รันในฐานข้อมูล ST เท่านั้น
-- ทุกฟิวด์เป็น TEXT และรันซ้ำได้

ALTER TABLE public.st_orders
  ADD COLUMN IF NOT EXISTS for_packer_st_display TEXT,
  ADD COLUMN IF NOT EXISTS telegram_header TEXT,
  ADD COLUMN IF NOT EXISTS telegram_header_backup TEXT,
  ADD COLUMN IF NOT EXISTS telegram_header_type TEXT,
  ADD COLUMN IF NOT EXISTS order_status_backup TEXT,
  ADD COLUMN IF NOT EXISTS telegram_warning_label TEXT,
  ADD COLUMN IF NOT EXISTS telegram_warning_text TEXT,
  ADD COLUMN IF NOT EXISTS telegram_warning_level TEXT;

ALTER TABLE public.st_orders
  ALTER COLUMN shipping_method SET DEFAULT '⚡FLASH EXPRESS';

ALTER TABLE public.st_orders_duplicate_history
  ADD COLUMN IF NOT EXISTS for_packer_st_display TEXT,
  ADD COLUMN IF NOT EXISTS telegram_header TEXT,
  ADD COLUMN IF NOT EXISTS telegram_header_backup TEXT,
  ADD COLUMN IF NOT EXISTS telegram_header_type TEXT,
  ADD COLUMN IF NOT EXISTS order_status_backup TEXT,
  ADD COLUMN IF NOT EXISTS telegram_warning_label TEXT,
  ADD COLUMN IF NOT EXISTS telegram_warning_text TEXT,
  ADD COLUMN IF NOT EXISTS telegram_warning_level TEXT;

ALTER TABLE public.st_orders_alert
  ADD COLUMN IF NOT EXISTS for_packer_st_display TEXT,
  ADD COLUMN IF NOT EXISTS telegram_header TEXT,
  ADD COLUMN IF NOT EXISTS telegram_header_backup TEXT,
  ADD COLUMN IF NOT EXISTS telegram_header_type TEXT,
  ADD COLUMN IF NOT EXISTS order_status_backup TEXT,
  ADD COLUMN IF NOT EXISTS telegram_warning_label TEXT,
  ADD COLUMN IF NOT EXISTS telegram_warning_text TEXT,
  ADD COLUMN IF NOT EXISTS telegram_warning_level TEXT;

COMMENT ON COLUMN public.st_orders.for_packer_st_display IS 'ST canonical product display stamped by n8n; Telegram/web primary field';
COMMENT ON COLUMN public.st_orders.single_cleaned_products IS 'ST product display fallback when for_packer_st_display is empty';
COMMENT ON COLUMN public.st_orders.telegram_header IS 'SB-crafted Telegram bill header';
COMMENT ON COLUMN public.st_orders.telegram_warning_label IS 'Telegram-visible warning label, separate from bill header';
