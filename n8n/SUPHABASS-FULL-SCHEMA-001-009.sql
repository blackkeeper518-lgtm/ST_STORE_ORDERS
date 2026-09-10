-- ============================================================
-- SUPHABASS · FULL SIMPLE SCHEMA
-- Run in Supabase SQL Editor from [1] to [9].
-- Existing central_order_master is preserved; no order-history room is created.
-- Source order evidence: sniper_x_text_clean, then clean_text.
-- Chat history: chat_customer_messages + chat_page_messages.
-- Sent history: append-only supabass_sent_order_archive.
-- ============================================================

-- [1] ORDER MASTER — existing source table
-- This section is intentionally read-only. The table must already exist.
-- Expected table: public.central_order_master
-- Required identity: id, upsert_key, order_number, page_id, source_chat_id,
-- source_payload, order_items, sniper_x_text_clean, clean_text,
-- created_at, updated_at.

do $$
begin
  if to_regclass('public.central_order_master') is null then
    raise exception '[1] Missing required table public.central_order_master';
  end if;
end $$;

-- [1A] MATCHER FIELDS — add missing top-level fields so the full payload is visible.
-- All columns are nullable and additive; existing order data is preserved.
alter table public.central_order_master
  add column if not exists order_date text,
  add column if not exists time_th text,
  add column if not exists day_of_week text,
  add column if not exists thread_id text,
  add column if not exists conversation_key text,
  add column if not exists alias text,
  add column if not exists alias_norm text,
  add column if not exists alias_text text,
  add column if not exists aliases jsonb,
  add column if not exists sku text,
  add column if not exists product_name text,
  add column if not exists th_name text,
  add column if not exists brand text,
  add column if not exists parsed_product_raw text,
  add column if not exists extracted_product_block text,
  add column if not exists display_for_packer text,
  add column if not exists telegram_final_mapped text,
  add column if not exists display_label text,
  add column if not exists quantity numeric,
  add column if not exists qty numeric,
  add column if not exists extracted_qty numeric,
  add column if not exists parsed_quantity numeric,
  add column if not exists unit_price numeric,
  add column if not exists emoji text,
  add column if not exists extracted_emoji text,
  add column if not exists emoji_master text,
  add column if not exists addressclean text,
  add column if not exists parsed_location_only text,
  add column if not exists address_display_packer text,
  add column if not exists short_address text,
  add column if not exists cod_check_status text,
  add column if not exists audit_status text,
  add column if not exists audit_flags text,
  add column if not exists audit_badge text,
  add column if not exists parser_mode text,
  add column if not exists is_ready_to_pack boolean,
  add column if not exists sen_status text,
  add column if not exists telegram_status text,
  add column if not exists line_status text,
  add column if not exists messenger_status text,
  add column if not exists stock_status text,
  add column if not exists is_out_of_stock boolean,
  add column if not exists telegram_message text,
  add column if not exists telegram_chat_id text,
  add column if not exists detected_products jsonb,
  add column if not exists debug_block text,
  add column if not exists debug_prod text,
  add column if not exists warning_tag text,
  add column if not exists repair_log text,
  add column if not exists items_json jsonb,
  add column if not exists items_text text,
  add column if not exists items_count integer,
  add column if not exists telegram_final_payload jsonb;
  -- Optional top-level matcher fields; item-level copies remain in order_items JSON.
alter table public.central_order_master
  add column if not exists product_id text,
  add column if not exists source_sku_result text,
  add column if not exists name_standard text,
  add column if not exists raw_item_text text,
  add column if not exists raw_product_text text,
  add column if not exists line_total numeric,
  add column if not exists match_status text,
  add column if not exists match_confidence numeric,
  add column if not exists match_method text,
  add column if not exists evidence_sources jsonb,
  add column if not exists candidate_skus jsonb,
  add column if not exists source_actor_type text;

-- [1B] MATCHER SUMMARY — top-level order statistics for dashboard/reporting.
alter table public.central_order_master
  add column if not exists catalog_status text,
  add column if not exists catalog_count integer default 0,
  add column if not exists catalog_source text,
  add column if not exists catalog_fallback_enabled boolean default false,
  add column if not exists item_count integer default 0,
  add column if not exists total_quantity numeric default 0,
  add column if not exists matched_count integer default 0,
  add column if not exists review_count integer default 0,
  add column if not exists unmatched_count integer default 0,
  add column if not exists matched_ratio numeric,
  add column if not exists calculated_items_total numeric,
  add column if not exists matcher_status text,
  add column if not exists matcher_version text,
  add column if not exists ingested_at timestamptz default now();

-- [1C] DISPLAY / BACKUP CANDIDATES — retain every address and product display candidate.
alter table public.central_order_master
  add column if not exists product_display_candidates jsonb,
  add column if not exists full_address_backup_1 text,
  add column if not exists full_address_backup_2 text,
  add column if not exists address_candidates jsonb,
  add column if not exists final_address_for_bill text;

-- [1D] FULL PAYLOAD SNAPSHOT — no source key is discarded, even when its
-- top-level column is not yet promoted to the master table.
alter table public.central_order_master
  add column if not exists thread_id text,
  add column if not exists extracted_phone text,
  add column if not exists raw_text_with_phone text,
  add column if not exists payload_snapshot jsonb;

-- [1E] FULL PAYLOAD COLUMNS — generated from the attached payload sample.
alter table public.central_order_master
  add column if not exists address_candidates jsonb,
  add column if not exists address_display_packer text,
  add column if not exists address_line_1 text,
  add column if not exists address_line_2 text,
  add column if not exists addressclean text,
  add column if not exists alias text,
  add column if not exists alias_norm text,
  add column if not exists amphoe text,
  add column if not exists assigned_hashtag text,
  add column if not exists bubble_window numeric,
  add column if not exists calculated_items_total numeric,
  add column if not exists catalog_count numeric,
  add column if not exists catalog_fallback_enabled boolean,
  add column if not exists catalog_source text,
  add column if not exists catalog_status text,
  add column if not exists chat_timeline jsonb,
  add column if not exists clean_text text,
  add column if not exists cod_amount numeric,
  add column if not exists created_at text,
  add column if not exists customer_name text,
  add column if not exists day_of_week text,
  add column if not exists display_for_packer text,
  add column if not exists district text,
  add column if not exists emoji text,
  add column if not exists expected_cod numeric,
  add column if not exists extracted_emoji text,
  add column if not exists extracted_phone text,
  add column if not exists extracted_qty numeric,
  add column if not exists facebook_name text,
  add column if not exists final_address_for_bill text,
  add column if not exists final_display_for_packer text,
  add column if not exists full_address text,
  add column if not exists full_address_backup_1 text,
  add column if not exists full_address_backup_2 text,
  add column if not exists full_chunk_text text,
  add column if not exists has_cod boolean,
  add column if not exists has_phone boolean,
  add column if not exists ingested_at text,
  add column if not exists item_count numeric,
  add column if not exists lock_status text,
  add column if not exists matched_count numeric,
  add column if not exists matched_ratio numeric,
  add column if not exists matcher_status text,
  add column if not exists matcher_version text,
  add column if not exists message_id text,
  add column if not exists order_date text,
  add column if not exists order_items jsonb,
  add column if not exists order_number text,
  add column if not exists order_status text,
  add column if not exists order_time text,
  add column if not exists page_id text,
  add column if not exists page_name text,
  add column if not exists phone text,
  add column if not exists product_display_candidates jsonb,
  add column if not exists province text,
  add column if not exists qty numeric,
  add column if not exists quantity numeric,
  add column if not exists raw_text text,
  add column if not exists raw_text_with_phone text,
  add column if not exists raw_text_with_phone_timed text,
  add column if not exists recipient_id text,
  add column if not exists review_count numeric,
  add column if not exists short_address text,
  add column if not exists single_cleaned_block text,
  add column if not exists sku text,
  add column if not exists sniper_x_text_clean text,
  add column if not exists telegram_body jsonb,
  add column if not exists telegram_copy_text text,
  add column if not exists telegram_final_mapped text,
  add column if not exists telegram_message text,
  add column if not exists telegram_sent boolean,
  add column if not exists th_name text,
  add column if not exists "threadId" text,
  add column if not exists threadid text,
  add column if not exists thread_id text,
  add column if not exists time_th text,
  add column if not exists total_quantity numeric,
  add column if not exists unit_price numeric,
  add column if not exists unmatched_count numeric,
  add column if not exists updated_at text,
  add column if not exists upsert_key text,
  add column if not exists zipcode text;

-- [2] PRODUCT MASTER — use the existing product table; do not create or alter it.
do $$
begin
  if to_regclass('public.product_master') is null then
    raise exception '[2] Missing required existing table public.product_master';
  end if;
end $$;

-- [2A] PRODUCT STOCK AUTO-LINK — keep stock_qty and stock_status aligned.
-- The existing product_master.status is intentionally left untouched.
create or replace function public.fn_auto_link_product_stock()
returns trigger as $$
begin
  if coalesce(new.stock_qty, 0) > 0 then
    new.stock_status := '✅ INSTOCK';
  else
    new.stock_qty := 0;
    new.stock_status := '❌ OUT_OF_STOCK';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_auto_link_product_stock on public.product_master;
create trigger trg_auto_link_product_stock
before insert or update of stock_qty on public.product_master
for each row
execute function public.fn_auto_link_product_stock();

-- Re-evaluate existing products immediately.
update public.product_master
set stock_qty = stock_qty;

-- [3] PRODUCT MAP + TYPO LEARNING + BILL LABELS
-- Product alias/map table: stable approved aliases only.
create table if not exists public.product_alias_map (
  id bigint generated by default as identity primary key,
  alias_norm text not null unique,
  alias_text text not null,
  sku text,
  product_id bigint,
  mapping_status text not null default 'REVIEW',
  confidence numeric,
  match_method text,
  evidence_count integer not null default 0,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_product_alias_map_sku on public.product_alias_map (sku);
create index if not exists idx_product_alias_map_status on public.product_alias_map (mapping_status);

-- Typo/unknown-word learning table: no silent conversion to a product.
create table if not exists public.product_typo_learning (
  id bigint generated by default as identity primary key,
  typo_norm text not null unique,
  typo_text text not null,
  suggested_sku text,
  suggested_product_name text,
  learning_status text not null default 'REVIEW',
  occurrence_count integer not null default 1,
  examples jsonb not null default '[]'::jsonb,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_product_typo_learning_status on public.product_typo_learning (learning_status);

-- Bill headers / labels / badges. Keep presentation separate from raw order_status.
create table if not exists public.bill_labels (
  id bigint generated by default as identity primary key,
  label_key text not null unique,
  label_text text not null,
  label_subtext text,
  status_code text,
  color_code text,
  emoji text,
  is_active boolean not null default true,
  priority integer not null default 100,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_bill_labels_active_priority on public.bill_labels (is_active, priority);

-- [4] CHAT ROOM: CUSTOMER MESSAGES
create table if not exists public.chat_customer_messages (
  id bigint generated by default as identity primary key,
  provider_message_id text,
  page_id text not null,
  page_name text,
  thread_id text not null,
  sender_id text,
  sender_name text,
  customer_name text,
  message_text text,
  attachments jsonb not null default '[]'::jsonb,
  occurred_at timestamptz,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (provider_message_id)
);
create index if not exists idx_chat_customer_room on public.chat_customer_messages (page_id, thread_id, occurred_at desc, id desc);

-- [5] CHAT ROOM: PAGE / SYSTEM MESSAGES
create table if not exists public.chat_page_messages (
  id bigint generated by default as identity primary key,
  provider_message_id text,
  page_id text not null,
  page_name text,
  thread_id text not null,
  sender_id text,
  sender_name text,
  message_text text,
  message_kind text,
  attachments jsonb not null default '[]'::jsonb,
  occurred_at timestamptz,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (provider_message_id)
);
create index if not exists idx_chat_page_room on public.chat_page_messages (page_id, thread_id, occurred_at desc, id desc);

-- [6] WEB READ VIEW — one row per order, with chat_timeline attached.
-- The central order row remains untouched; timeline is read from the two chat rooms.
-- Drop first because m.* changes the view column order when new master fields are added.
drop view if exists public.vw_orders_web_all_fields;
create view public.vw_orders_web_all_fields as
select
  m.*,
  coalesce(chat.chat_timeline, '[]'::jsonb) as chat_timeline,
  coalesce(nullif(btrim(m.sniper_x_text_clean), ''), nullif(btrim(m.clean_text), ''), nullif(btrim(m.source_text), '')) as order_evidence_text,
  coalesce(nullif(btrim(m.full_address), ''), nullif(btrim(concat_ws(' ', m.address_line_1, m.address_line_2, m.district, m.amphoe, m.province, m.zipcode)), '')) as address_for_bill,
  coalesce(m.order_items, m.order_items_preserved, '[]'::jsonb) as product_items_for_bill
from public.central_order_master as m
left join lateral (
  select jsonb_agg(x.event order by x.event_at nulls last, x.event_id) as chat_timeline
  from (
    select
      jsonb_build_object(
        'id', c.id,
        'room', 'customer',
        'page_id', c.page_id,
        'thread_id', c.thread_id,
        'sender_name', c.sender_name,
        'customer_name', c.customer_name,
        'text', c.message_text,
        'occurred_at', c.occurred_at,
        'source_payload', c.source_payload
      ) as event,
      c.occurred_at as event_at,
      c.id as event_id
    from public.chat_customer_messages c
    where c.page_id = m.page_id and c.thread_id = m.source_chat_id
    union all
    select
      jsonb_build_object(
        'id', p.id,
        'room', 'page',
        'page_id', p.page_id,
        'thread_id', p.thread_id,
        'sender_name', p.sender_name,
        'text', p.message_text,
        'message_kind', p.message_kind,
        'occurred_at', p.occurred_at,
        'source_payload', p.source_payload
      ) as event,
      p.occurred_at as event_at,
      p.id as event_id
    from public.chat_page_messages p
    where p.page_id = m.page_id and p.thread_id = m.source_chat_id
  ) x
) chat on true;

comment on view public.vw_orders_web_all_fields is
  'SUPHABASS web read view: central_order_master plus chat_timeline from customer/page message rooms.';

-- [7] SEND VIEW — one clean payload source for Telegram/send workflow.
-- It reads; it does not send and it does not mutate source data.
create or replace view public.vw_orders_to_send as
select
  m.id,
  m.upsert_key,
  m.order_number,
  m.order_time,
  m.page_id,
  m.page_name,
  m.recipient_id,
  m.assigned_hashtag,
  m.facebook_name,
  m.customer_name,
  m.phone,
  m.full_address,
  m.address_line_1,
  m.address_line_2,
  m.district,
  m.amphoe,
  m.province,
  m.zipcode,
  m.raw_cod_amount,
  m.cod_amount,
  m.expected_cod,
  m.raw_order_status,
  m.mapping_status,
  m.order_status,
  m.status_color,
  m.day_emoji,
  m.final_display_for_packer,
  m.mapped_product_lines,
  m.packer_pick_text,
  m.telegram_body,
  m.telegram_text,
  m.telegram_copy_text,
  m.source_text,
  m.sniper_x_text_clean,
  m.clean_text,
  m.single_cleaned_block,
  m.raw_text_with_phone_timed,
  m.order_items,
  m.order_items_preserved,
  m.item_count,
  m.total_quantity,
  m.matched_count,
  m.review_count,
  m.unmatched_count,
  m.source_payload,
  coalesce(nullif(btrim(m.sniper_x_text_clean), ''), nullif(btrim(m.clean_text), ''), nullif(btrim(m.source_text), '')) as order_evidence_text,
  coalesce(nullif(btrim(m.full_address), ''), nullif(btrim(concat_ws(' ', m.address_line_1, m.address_line_2, m.district, m.amphoe, m.province, m.zipcode)), '')) as address_for_bill,
  coalesce(m.order_items, m.order_items_preserved, '[]'::jsonb) as product_items_for_bill,
  concat('SUPHABASS // ', coalesce(nullif(btrim(m.order_number_display), ''), nullif(btrim(m.order_number), ''), concat('ORDER-', m.id::text))) as bill_header,
  coalesce(m.telegram_text, m.telegram_copy_text, m.final_display_for_packer, m.packer_pick_text) as send_text_candidate
from public.central_order_master m
where coalesce(m.telegram_sent, false) = false;

-- [8] APPEND-ONLY SENT ARCHIVE — sent rows stay forever.
create table if not exists public.suphabass_sent_order_archive (
  id bigint generated by default as identity primary key,
  sent_key text not null unique,
  order_id bigint,
  upsert_key text,
  order_number text,
  sent_at timestamptz not null default now(),
  telegram_chat_id text,
  telegram_message_id text,
  telegram_text text,
  telegram_body jsonb not null default '{}'::jsonb,
  source_snapshot jsonb not null default '{}'::jsonb,
  send_result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_suphabass_sent_archive_order on public.suphabass_sent_order_archive (order_number, sent_at desc);
create index if not exists idx_suphabass_sent_archive_time on public.suphabass_sent_order_archive (sent_at desc);

-- [9] SENT HISTORY VIEW — permanent read view over the append-only archive.
create or replace view public.vw_orders_sent_history as
select
  a.*
from public.suphabass_sent_order_archive a;

comment on table public.suphabass_sent_order_archive is
  'SUPHABASS append-only Telegram send archive. Never update or delete rows.';
comment on view public.vw_orders_sent_history is
  'Permanent sent-order history; source is append-only supabass_sent_order_archive.';

-- Read access for browser/dashboard views. Keep inserts to archive server-side/n8n only.
grant select on public.vw_orders_web_all_fields to anon, authenticated;
grant select on public.vw_orders_to_send to anon, authenticated;
grant select on public.vw_orders_sent_history to anon, authenticated;

-- Recommended RLS posture after creation:
-- enable row level security on all tables;
-- grant browser SELECT only on the three views;
-- keep INSERT into supabass_sent_order_archive server-side/n8n with service-role.
-- Refresh PostgREST after additive columns/views are created.
notify pgrst, 'reload schema';
