-- ST ONLY · ISOLATE TIGER OUTPUT
-- Tiger may write ONLY to these new columns.
-- Existing raw/evidence/mapped columns are intentionally untouched.

ALTER TABLE public.st_orders
  ADD COLUMN IF NOT EXISTS tiger_input_text text,
  ADD COLUMN IF NOT EXISTS tiger_detected_sku text,
  ADD COLUMN IF NOT EXISTS tiger_detected_product text,
  ADD COLUMN IF NOT EXISTS tiger_detected_quantity text,
  ADD COLUMN IF NOT EXISTS tiger_output_display text,
  ADD COLUMN IF NOT EXISTS tiger_mapping_status text,
  ADD COLUMN IF NOT EXISTS tiger_confidence text,
  ADD COLUMN IF NOT EXISTS tiger_reason text,
  ADD COLUMN IF NOT EXISTS tiger_processed_at timestamptz;

COMMENT ON COLUMN public.st_orders.tiger_input_text IS 'Tiger input snapshot; never replaces normalized_chat_timeline or raw evidence';
COMMENT ON COLUMN public.st_orders.tiger_output_display IS 'Tiger proposal only; human/system approval required before copying to for_packer_st_display';
COMMENT ON COLUMN public.st_orders.tiger_mapping_status IS 'Tiger result: PROPOSED, MATCHED, REVIEW, REJECTED';

CREATE INDEX IF NOT EXISTS idx_st_orders_tiger_status ON public.st_orders (tiger_mapping_status);
