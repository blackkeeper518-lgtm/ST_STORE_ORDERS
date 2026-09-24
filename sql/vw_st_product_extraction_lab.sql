-- ST ONLY · PRODUCT EXTRACTION LAB
-- Read-only view. It never updates, moves, or deletes orders.
-- ST rule: admin product lines usually appear near the top and may have no คอต.

DROP VIEW IF EXISTS public.vw_st_product_extraction_lab;

CREATE VIEW public.vw_st_product_extraction_lab AS
WITH order_source AS (
  SELECT
    o.upsert_key,
    o.order_number,
    o.order_time_display,
    COALESCE(NULLIF(BTRIM(o.sniper_x_text_clean), ''), NULLIF(BTRIM(o.clean_text), ''), '') AS source_text,
    COALESCE(NULLIF(BTRIM(o.for_packer_st_display), ''), NULLIF(BTRIM(o.single_cleaned_products), ''), '') AS stamped_product_text
  FROM public.st_orders o
), raw_lines AS (
  SELECT
    s.*,
    x.line_no::int AS source_line_no,
    BTRIM(x.line_text) AS line_text
  FROM order_source s
  CROSS JOIN LATERAL regexp_split_to_table(s.source_text, E'\r?\n') WITH ORDINALITY AS x(line_text, line_no)
), top_boundary AS (
  SELECT
    r.upsert_key,
    COALESCE(
      MIN(r.source_line_no) FILTER (WHERE r.line_text ~* '(┌|🚨|สรุปรายการสั่งซื้อ|เลขที่ออเดอร์|เวลาสั่งซื้อ|COD|ยอดรวม|👤|ชื่อ\s*:|ที่อยู่|โทร|📮)'),
      15
    ) AS boundary_line_no
  FROM raw_lines r
  GROUP BY r.upsert_key
), top_lines AS (
  SELECT
    r.upsert_key,
    r.order_number,
    r.order_time_display,
    r.source_text,
    r.stamped_product_text,
    r.source_line_no,
    r.line_text AS candidate_text
  FROM raw_lines r
  JOIN top_boundary b ON b.upsert_key = r.upsert_key
  WHERE r.source_line_no < b.boundary_line_no
    AND r.source_line_no <= 14
    AND BTRIM(r.line_text) <> ''
    AND BTRIM(r.line_text) !~* '(รายการสินค้า|ขนส่ง|สถานะ|เลขออเดอร์|เลขที่ออเดอร์|เวลาสั่งซื้อ|ยอดรวม|จัดส่ง|ขอบคุณ|COD|ที่อยู่|โทร|เบอร์|LINE\s*:|ไลน์\s*:|https?://|www\.|รหัสไปรษณีย์|ชื่อ\s*:|ยอดรวมCOD)'
    AND (
      EXISTS (
        SELECT 1
        FROM public.product_master p
        WHERE BTRIM(r.line_text) ILIKE '%' || p.master_sku || '%'
           OR (NULLIF(BTRIM(p.alias), '') IS NOT NULL AND BTRIM(r.line_text) ILIKE '%' || p.alias || '%')
           OR (NULLIF(BTRIM(p.th_name), '') IS NOT NULL AND BTRIM(r.line_text) ILIKE '%' || p.th_name || '%')
      )
      OR BTRIM(r.line_text) ~* '.+[ก-๙A-Za-z_]+\s*[0-9]{1,2}\s*(?:คอต)?\s*$'
      OR BTRIM(r.line_text) ~* '(🟢|🟡|🔴|🟠|🟣|🔵|🟩|🟨|🟥|🟧|🟪|🟦|🍉|🥭|🍇|🍊|🍍)'
    )
), enriched AS (
  SELECT
    c.*,
    COALESCE((regexp_match(c.candidate_text, '(?i)([0-9]+)\\s*คอต'))[1]::numeric, 1) AS cot_quantity,
    pm.master_sku,
    pm.th_name,
    COALESCE(
      NULLIF(BTRIM(pm.master_display_for_packer), ''),
      NULLIF(BTRIM(pm.display_for_packer), ''),
      BTRIM(c.candidate_text)
    ) AS master_display,
    CASE WHEN pm.master_sku IS NULL THEN 'REVIEW_NOT_MATCHED' ELSE 'MATCHED' END AS line_mapping_status
  FROM top_lines c
  LEFT JOIN LATERAL (
    SELECT p.*
    FROM public.product_master p
    WHERE c.candidate_text ILIKE '%' || p.master_sku || '%'
       OR (NULLIF(BTRIM(p.alias), '') IS NOT NULL AND c.candidate_text ILIKE '%' || p.alias || '%')
       OR (NULLIF(BTRIM(p.th_name), '') IS NOT NULL AND c.candidate_text ILIKE '%' || p.th_name || '%')
    ORDER BY CASE WHEN c.candidate_text ILIKE '%' || p.master_sku || '%' THEN 0 ELSE 1 END,
             LENGTH(p.master_sku) DESC
    LIMIT 1
  ) pm ON TRUE
), all_candidates AS (
  SELECT
    s.*,
    NULL::int AS source_line_no,
    NULL::text AS candidate_text,
    NULL::numeric AS cot_quantity,
    NULL::text AS master_sku,
    NULL::text AS th_name,
    NULL::text AS master_display,
    'NO_CANDIDATES'::text AS line_mapping_status
  FROM order_source s
  WHERE NOT EXISTS (SELECT 1 FROM enriched e WHERE e.upsert_key = s.upsert_key)
  UNION ALL
  SELECT * FROM enriched
)
SELECT
  upsert_key,
  order_number,
  order_time_display,
  'ST_TOP_ADMIN_PRODUCT_BLOCK'::text AS lab_extraction_mode,
  source_text AS lab_source_text,
  stamped_product_text,
  COALESCE(jsonb_agg(jsonb_build_object(
    'source_line_no', source_line_no,
    'raw_text', candidate_text,
    'cot_quantity', cot_quantity,
    'master_sku', master_sku,
    'th_name', th_name,
    'master_display', master_display,
    'line_mapping_status', line_mapping_status
  ) ORDER BY source_line_no) FILTER (WHERE candidate_text IS NOT NULL), '[]'::jsonb) AS lab_product_candidates,
  COUNT(candidate_text)::int AS lab_product_line_count,
  COALESCE(SUM(cot_quantity), 0) AS lab_total_cot,
  COUNT(*) FILTER (WHERE line_mapping_status = 'MATCHED')::int AS lab_matched_line_count,
  CASE
    WHEN COUNT(candidate_text) = 0 THEN 'ALIEN_NO_ST_PRODUCT_LINES'
    WHEN COUNT(*) FILTER (WHERE line_mapping_status <> 'MATCHED') > 0 THEN 'REVIEW_MASTER_MATCH'
    ELSE 'PASS'
  END AS lab_status,
  CASE
    WHEN COUNT(candidate_text) = 0 THEN 'ไม่พบบรรทัดสินค้าด้านบนที่ชน Master'
    WHEN COUNT(*) FILTER (WHERE line_mapping_status <> 'MATCHED') > 0 THEN 'มีบรรทัดด้านบนที่ยังชน Master ไม่ได้'
    ELSE 'จับบรรทัดสินค้า ST และชน Master ได้'
  END AS lab_reason
FROM all_candidates
GROUP BY upsert_key, order_number, order_time_display, source_text, stamped_product_text;

COMMENT ON VIEW public.vw_st_product_extraction_lab IS 'ST read-only product extraction lab; source remains st_orders.';
