-- Alien Inspector Master Center
-- Read-only projection for the web. This never creates or updates product_master.
-- Raw evidence remains in product_alien_terms; Product Master remains authoritative.

begin;

-- Evidence-derived fields are stored on the Alien record, not invented by the UI.
alter table if exists public.product_alien_terms
  add column if not exists master_quantity numeric,
  add column if not exists master_quantity_source text,
  add column if not exists master_quantity_status text,
  add column if not exists master_unit text,
  add column if not exists order_payload jsonb,
  add column if not exists normalized_chat_timeline jsonb,
  add column if not exists chat_timeline jsonb,
  add column if not exists product_evidence jsonb,
  add column if not exists product_fields jsonb;

alter table if exists public.product_alien_map_reviews
  add column if not exists master_sku text,
  add column if not exists master_quantity numeric,
  add column if not exists master_quantity_source text,
  add column if not exists master_quantity_status text,
  add column if not exists master_unit text;

-- The view is the web's single read model:
--   raw evidence       -> product_alien_terms
--   verified master    -> product_master.master_sku/master_display_for_packer
--   real stock         -> inventory
--   review decision    -> product_alien_map_reviews
-- It deliberately does not fall back to order display fields.
drop view if exists public.vw_product_alien_inspector;
create view public.vw_product_alien_inspector as
select
  t.id as alien_term_id,
  t.upsert_key,
  t.order_number,
  t.facebook_name,
  t.customer_id,
  t.thread_id,
  t.page_id,
  t.page_name,
  t.line_no,

  -- Highest-priority evidence: untouched values from the Alien term.
  t.raw_text,
  t.raw_text_full,
  t.alias_text,
  t.alias_norm,
  t.normalized_chat_timeline,
  t.chat_timeline,
  t.product_evidence,
  t.quantity,
  t.qty,
  t.extracted_qty,
  case
    when t.master_quantity is not null then t.master_quantity
    when nullif(btrim(coalesce(t.quantity, '')), '') ~ '^\\d+(\\.\\d+)?$' then nullif(btrim(t.quantity), '')::numeric
    when nullif(btrim(coalesce(t.qty, '')), '') ~ '^\\d+(\\.\\d+)?$' then nullif(btrim(t.qty), '')::numeric
    when nullif(btrim(coalesce(t.extracted_qty, '')), '') ~ '^\\d+(\\.\\d+)?$' then nullif(btrim(t.extracted_qty), '')::numeric
    else null
  end as master_quantity,
  coalesce(t.master_quantity_source, case when t.master_quantity is not null then 'TRUSTED_MASTER_QUANTITY' else 'TRUSTED_ORDER_QUANTITY' end) as master_quantity_source,
  coalesce(t.master_quantity_status, 'DERIVED_FOR_VIEW') as master_quantity_status,
  coalesce(nullif(btrim(t.master_unit), ''), case
    when t.master_quantity is not null
      or btrim(coalesce(t.quantity, '')) ~ '^\\d+(\\.\\d+)?$'
      or btrim(coalesce(t.qty, '')) ~ '^\\d+(\\.\\d+)?$'
      or btrim(coalesce(t.extracted_qty, '')) ~ '^\\d+(\\.\\d+)?$'
    then 'คอต.'
  end) as master_unit,

  -- Product Master is the only source of the mapped display.
  pm.id as product_master_id,
  pm.sku as master_sku,
  pm.master_display_for_packer,
  pm.th_name,
  pm.name_standard,
  pm.status as master_status,

  -- Inventory is the only source of live stock.
  i.id as inventory_id,
  i.stock_qty,
  i.stock_status,

  r.id as review_id,
  coalesce(r.mapping_status, t.mapping_status, 'REVIEW') as mapping_status,
  coalesce(r.review_reason, t.review_reason) as review_reason,
  r.reviewer_note,
  r.reviewed_by,
  r.reviewed_at,

  -- MATCHED is possible only when evidence, Product Master, and its
  -- prebuilt display are all present. The UI must not promote REVIEW rows.
  case
    when t.raw_text is not null
      and btrim(t.raw_text) <> ''
      and pm.id is not null
      and pm.master_display_for_packer is not null
      and btrim(pm.master_display_for_packer) <> ''
      and coalesce(r.mapping_status, t.mapping_status, 'REVIEW') in ('MATCHED', 'APPROVED', 'RESOLVED')
    then 'MATCHED'
    when t.raw_text is null or btrim(t.raw_text) = '' then 'RAW_MISSING'
    when pm.id is null or pm.master_display_for_packer is null or btrim(pm.master_display_for_packer) = '' then 'REVIEW'
    else coalesce(r.mapping_status, t.mapping_status, 'REVIEW')
  end as audit_status,

  -- This is presentation only. It does not alter the stored Master Display.
  case
    when pm.master_display_for_packer is not null
      and btrim(pm.master_display_for_packer) <> ''
      and (t.master_quantity is not null
        or btrim(coalesce(t.quantity, '')) ~ '^\\d+(\\.\\d+)?$'
        or btrim(coalesce(t.qty, '')) ~ '^\\d+(\\.\\d+)?$'
        or btrim(coalesce(t.extracted_qty, '')) ~ '^\\d+(\\.\\d+)?$')
    then pm.master_display_for_packer || ' ' || coalesce(
      t.master_quantity,
      case when btrim(coalesce(t.quantity, '')) ~ '^\\d+(\\.\\d+)?$' then btrim(t.quantity)::numeric end,
      case when btrim(coalesce(t.qty, '')) ~ '^\\d+(\\.\\d+)?$' then btrim(t.qty)::numeric end,
      case when btrim(coalesce(t.extracted_qty, '')) ~ '^\\d+(\\.\\d+)?$' then btrim(t.extracted_qty)::numeric end
    )::text || ' คอต.'
    when pm.master_display_for_packer is not null
      and btrim(pm.master_display_for_packer) <> ''
    then pm.master_display_for_packer
    else null
  end as master_display_with_quantity
from public.product_alien_terms t
left join lateral (
  select r.*
  from public.product_alien_map_reviews r
  where r.alien_term_id = t.id
  order by r.updated_at desc nulls last, r.id desc
  limit 1
) r on true
left join public.product_master pm
  on lower(btrim(pm.sku)) = lower(btrim(coalesce(r.master_sku, r.observed_sku, t.sku)))
left join lateral (
  select i.*
  from public.inventory i
  where i.product_id = pm.id
     or lower(btrim(coalesce(i.sku, ''))) = lower(btrim(pm.sku))
  order by (i.product_id = pm.id) desc, i.updated_at desc nulls last, i.id desc
  limit 1
) i on true;

comment on view public.vw_product_alien_inspector is
  'Alien read model: raw evidence first, Product Master display read-only, inventory stock, no Master creation.';

commit;

-- Verification:
-- select alien_term_id, order_number, raw_text, master_sku,
--        master_display_for_packer, master_quantity, master_unit,
--        stock_qty, stock_status, audit_status
-- from public.vw_product_alien_inspector
-- order by order_number, line_no;
