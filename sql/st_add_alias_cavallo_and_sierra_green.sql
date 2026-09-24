-- ST ONLY · ADD FRONT-DESK ALIASES
-- Safe upsert into product_alias_dictionary.
-- Does not modify st_orders, evidence fields, or BB tables.
-- Mapping confirmed from the existing ST product map:
--   คาเขียว       -> CAVALLO_GREEN
--   เซีนร่าเขียว  -> SIERRA_GREEN

INSERT INTO public.product_alias_dictionary (
  sku,
  th_name,
  alias,
  display_for_packer,
  final_display_for_packer,
  raw_sku_from_front,
  raw_th_name_from_front,
  raw_alias_from_front,
  sku_list,
  th_name_list,
  created_at
)
SELECT
  p.master_sku,
  p.th_name,
  v.alias_text,
  COALESCE(NULLIF(BTRIM(p.master_display_for_packer), ''), NULLIF(BTRIM(p.display_for_packer), '')),
  COALESCE(NULLIF(BTRIM(p.master_display_for_packer), ''), NULLIF(BTRIM(p.display_for_packer), '')),
  v.raw_sku,
  v.raw_th_name,
  v.alias_text,
  ARRAY[p.master_sku],
  ARRAY[p.th_name],
  NOW()
FROM (
  VALUES
    ('CAVALLO_GREEN'::text, 'คาเขียว'::text, 'CAVALLO_GREEN'::text, 'คาวาโล่เขียว'::text),
    ('SIERRA_GREEN'::text,  'เซีนร่าเขียว'::text, 'SIERRA_GREEN'::text, 'เซียร์ร่าเขียว'::text)
) AS v(master_sku, alias_text, raw_sku, raw_th_name)
JOIN public.product_master p
  ON LOWER(BTRIM(p.master_sku)) = LOWER(BTRIM(v.master_sku))
ON CONFLICT (alias) DO UPDATE
SET
  sku = EXCLUDED.sku,
  th_name = EXCLUDED.th_name,
  display_for_packer = EXCLUDED.display_for_packer,
  final_display_for_packer = EXCLUDED.final_display_for_packer,
  raw_sku_from_front = EXCLUDED.raw_sku_from_front,
  raw_th_name_from_front = EXCLUDED.raw_th_name_from_front,
  raw_alias_from_front = EXCLUDED.raw_alias_from_front,
  sku_list = EXCLUDED.sku_list,
  th_name_list = EXCLUDED.th_name_list;

-- Verify the two mappings.
SELECT
  id,
  alias,
  sku,
  th_name,
  display_for_packer,
  final_display_for_packer
FROM public.product_alias_dictionary
WHERE alias IN ('คาเขียว', 'เซีนร่าเขียว')
ORDER BY alias;

-- If vw_alias_lookup_pro is installed as a materialized view, refresh it after this insert:
-- REFRESH MATERIALIZED VIEW public.vw_alias_lookup_pro;
