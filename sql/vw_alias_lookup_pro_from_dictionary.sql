-- ST ONLY · ALIAS LOOKUP PRO
-- Uses the real product_alias_dictionary schema.
-- Read-only lookup; does not modify orders.

DROP MATERIALIZED VIEW IF EXISTS public.vw_alias_lookup_pro;

CREATE MATERIALIZED VIEW public.vw_alias_lookup_pro AS
WITH combined_sources AS (
  SELECT
    BTRIM(alias_part) AS alias_raw,
    p.master_sku AS sku_master,
    p.th_name,
    p.emoji,
    COALESCE(NULLIF(BTRIM(p.master_display_for_packer), ''), NULLIF(BTRIM(p.display_for_packer), '')) AS display_for_packer,
    1 AS priority_source
  FROM public.product_master p
  CROSS JOIN LATERAL regexp_split_to_table(COALESCE(p.alias, ''), '[,\n|]+') AS a(alias_part)
  WHERE p.status = 'ACTIVE'
    AND NULLIF(BTRIM(alias_part), '') IS NOT NULL

  UNION ALL

  SELECT
    BTRIM(alias_part) AS alias_raw,
    COALESCE(NULLIF(BTRIM(d.sku), ''), m.master_sku) AS sku_master,
    COALESCE(NULLIF(BTRIM(d.th_name), ''), m.th_name, 'ตรวจสอบรายการสินค้า') AS th_name,
    m.emoji,
    COALESCE(NULLIF(BTRIM(d.final_display_for_packer), ''), NULLIF(BTRIM(d.display_for_packer), ''), NULLIF(BTRIM(m.master_display_for_packer), ''), NULLIF(BTRIM(m.display_for_packer), '')) AS display_for_packer,
    2 AS priority_source
  FROM public.product_alias_dictionary d
  CROSS JOIN LATERAL regexp_split_to_table(COALESCE(d.alias, ''), '[,\n|]+') AS a(alias_part)
  LEFT JOIN public.product_master m
    ON LOWER(BTRIM(d.sku)) = LOWER(BTRIM(m.master_sku))
  WHERE NULLIF(BTRIM(alias_part), '') IS NOT NULL
)
SELECT DISTINCT ON (LOWER(alias_raw))
  alias_raw,
  LOWER(alias_raw) AS alias_normalized,
  sku_master,
  th_name,
  emoji,
  display_for_packer,
  LENGTH(alias_raw) AS alias_length,
  CASE WHEN LENGTH(alias_raw) < 2 THEN 'REVIEW_ALIAS_TOO_SHORT' ELSE 'USABLE_ALIAS' END AS alias_quality,
  priority_source,
  COALESCE((regexp_match(alias_raw, '([0-9]+)\s*(คอต|ห่อ|ชิ้น|กล่อง|ลัง)', 'i'))[1]::integer, (regexp_match(alias_raw, '([0-9]+)\s*$', 'i'))[1]::integer, 1) AS extracted_qty
FROM combined_sources
ORDER BY LOWER(alias_raw), priority_source, LENGTH(alias_raw) DESC;

CREATE UNIQUE INDEX IF NOT EXISTS ux_alias_lookup_pro_normalized
  ON public.vw_alias_lookup_pro (alias_normalized);
CREATE INDEX IF NOT EXISTS idx_alias_lookup_pro_sku
  ON public.vw_alias_lookup_pro (sku_master);
