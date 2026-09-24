-- ST ONLY · READ PRODUCT LAB CANDIDATES
-- Read-only query. Does not update any order.

SELECT
  l.order_number,
  l.upsert_key,
  l.order_time_display,
  l.lab_status,
  l.lab_product_line_count,
  l.lab_total_cot,
  l.lab_matched_line_count,
  item->>'source_line_no' AS source_line_no,
  item->>'raw_text' AS raw_text,
  item->>'master_sku' AS master_sku,
  item->>'th_name' AS th_name,
  item->>'master_display' AS master_display,
  COALESCE(NULLIF(item->>'cot_quantity', ''), '1') AS quantity,
  item->>'line_mapping_status' AS line_mapping_status
FROM public.vw_st_product_extraction_lab AS l
CROSS JOIN LATERAL jsonb_array_elements(
  COALESCE(l.lab_product_candidates, '[]'::jsonb)
) AS item
ORDER BY
  l.order_time_display DESC NULLS LAST,
  l.order_number,
  NULLIF(item->>'source_line_no', '')::integer;
