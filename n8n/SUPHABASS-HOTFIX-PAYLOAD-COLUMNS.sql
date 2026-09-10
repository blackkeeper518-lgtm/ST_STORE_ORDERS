-- SUPHABASS HOTFIX: run once when PostgREST reports PGRST204 for a payload column.
-- Safe and additive: no data is deleted or rewritten.

alter table public.central_order_master
  add column if not exists product_display_candidates jsonb,
  add column if not exists full_address_backup_1 text,
  add column if not exists full_address_backup_2 text,
  add column if not exists address_candidates jsonb,
  add column if not exists final_address_for_bill text,
  add column if not exists thread_id text,
  add column if not exists threadid text,
  add column if not exists extracted_phone text,
  add column if not exists raw_text_with_phone text,
  add column if not exists full_chunk_text text,
  add column if not exists "threadId" text,
  add column if not exists payload_snapshot jsonb,
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
  add column if not exists matcher_version text;

-- Tell PostgREST/Supabase to refresh its database schema cache immediately.
notify pgrst, 'reload schema';

-- n8n must use the Supabase service_role key.
-- Do not grant INSERT/UPDATE to anon; service_role bypasses RLS and is server-side only.
grant select, insert, update on public.central_order_master to service_role;
drop policy if exists central_order_master_service_write on public.central_order_master;
create policy central_order_master_service_write
  on public.central_order_master
  for all to service_role
  using (true)
  with check (true);

notify pgrst, 'reload schema';
