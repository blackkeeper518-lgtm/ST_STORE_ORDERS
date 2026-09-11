-- NIGHTOPS canonical order source migration
-- central_order_master is the only trusted order source for the application.
-- Run this in Supabase SQL Editor before connecting the new n8n payload.
-- Do not delete bb_order or bb_order_items_fix yet; keep them as archived backup.

alter table public.central_order_master
  add column if not exists items_json jsonb not null default '[]'::jsonb,
  add column if not exists items_text text,
  add column if not exists items_count integer not null default 0,
  add column if not exists total_quantity numeric not null default 0,
  add column if not exists packer_copy_text text,
  add column if not exists source_system text default 'front_house';

create index if not exists central_order_master_canonical_created_idx
  on public.central_order_master (created_at desc);
create index if not exists central_order_master_canonical_order_number_idx
  on public.central_order_master (order_number);
create index if not exists central_order_master_canonical_page_thread_idx
  on public.central_order_master (page_id, thread_id, created_at desc);

-- Backfill one legacy product into the new multi-item field only when empty.
update public.central_order_master
set items_json = jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
      'sku', sku,
      'th_name', th_name,
      'label_display', coalesce(display_label, display_for_packer),
      'display_for_packer', display_for_packer,
      'quantity', case when coalesce(telegram_body->>'quantity', '') ~ '^[0-9]+(\\.[0-9]+)?$' then (telegram_body->>'quantity')::numeric else 1 end,
      'unit_price', null
    )))
where (items_json = '[]'::jsonb or items_json is null)
  and (sku is not null or th_name is not null or display_label is not null or display_for_packer is not null);

update public.central_order_master
set items_count = jsonb_array_length(items_json),
    total_quantity = coalesce((
      select sum(case when coalesce(item->>'quantity', '') ~ '^[0-9]+(\\.[0-9]+)?$' then (item->>'quantity')::numeric else 1 end)
      from jsonb_array_elements(items_json) as item
    ), 0),
    items_text = (
      select string_agg(
        coalesce(item->>'label_display', item->>'display_for_packer', item->>'th_name', item->>'sku', 'สินค้า')
        || ' ' || coalesce(item->>'quantity', '1') || ' ชิ้น', E'\n'
      )
      from jsonb_array_elements(items_json) as item
    )
where items_json is not null;

comment on column public.central_order_master.items_json is
  'Canonical ordered item lines; each object should include sku, th_name, label_display, quantity, unit_price';
comment on column public.central_order_master.items_text is
  'Human-readable multi-item lines for packer and Telegram';
comment on column public.central_order_master.total_quantity is
  'Total quantity across all item lines';

-- n8n canonical payload example:
-- {
--   "order_number": "ORD-...",
--   "items_json": [
--     {"sku":"MOND_GREEN","th_name":"ม่อนเขียว","label_display":"🟩 MOND_GREEN","quantity":2,"unit_price":350},
--     {"sku":"SEVIOS_RED","th_name":"ซีวอสแดง","label_display":"🟥 SEVIOS_RED","quantity":1,"unit_price":350}
--   ],
--   "items_count": 2,
--   "total_quantity": 3,
--   "items_text": "🟩 MOND_GREEN 2 ชิ้น\n🟥 SEVIOS_RED 1 ชิ้น",
--   "packer_copy_text": "..."
-- }
