-- ST ONLY / CENTRAL PRODUCT MASTER FIELDS
-- Additive migration: does not overwrite existing product values.
-- Run only in the ST Supabase database.

begin;

alter table public.product_master add column if not exists master_display_for_packer text;
alter table public.product_master add column if not exists stock_qty numeric;
alter table public.product_master add column if not exists stock_status text;
alter table public.product_master add column if not exists shipping_lane text;
alter table public.product_master add column if not exists normal_header_variants jsonb not null default '[]'::jsonb;
-- Existing product_master fields are used for stock messaging:
-- out_of_stock_joke = out-of-stock message; stock_notice = in-stock message.

comment on column public.product_master.master_display_for_packer is 'ST canonical finished display; show exactly as stored after SKU mapping.';
comment on column public.product_master.stock_qty is 'ST canonical current stock quantity used by Telegram and web.';
comment on column public.product_master.stock_status is 'ST canonical stock state, for example IN_STOCK or OUT_OF_STOCK.';
comment on column public.product_master.shipping_lane is 'ST canonical product lane: COOL, HOT, or FRUIT; do not infer from free text.';
comment on column public.product_master.normal_header_variants is 'ST JSON array of approved normal-order header strings; one is selected deterministically per order.';
comment on column public.product_master.out_of_stock_joke is 'ST short brand-specific out-of-stock notice; existing field.';
comment on column public.product_master.stock_notice is 'ST in-stock notice; existing field.';

create index if not exists product_master_shipping_lane_idx on public.product_master (shipping_lane);
create index if not exists product_master_stock_status_idx on public.product_master (stock_status);

commit;

-- Example shape only; do not paste these values unless they are approved for the matching master SKU:
-- update public.product_master
-- set shipping_lane = 'FRUIT',
--     normal_header_variants = '["🍉 [ผลไม้พรีเมียม · สดกว่านี้ก็ต้องกินบนต้น]"]'::jsonb,
--     out_of_stock_notice = 'มุกสั้นเฉพาะแบรนด์'
-- where master_sku = 'EXACT_MASTER_SKU';

-- Verify columns:
-- select master_sku, master_display_for_packer, stock_qty, stock_status, shipping_lane, normal_header_variants, out_of_stock_notice from public.product_master limit 20;
