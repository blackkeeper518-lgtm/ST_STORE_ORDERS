-- ST ONLY · CHECK PRODUCT LINES AND COT QUANTITY
-- Read-only. Does not update any data.

WITH source AS (
  SELECT
    upsert_key,
    order_number,
    order_time_display,
    COALESCE(NULLIF(BTRIM(for_packer_st_display), ''), NULLIF(BTRIM(single_cleaned_products), '')) AS product_text,
    cod_amount
  FROM public.st_orders
), lines AS (
  SELECT
    s.*,
    NULLIF(BTRIM(line), '') AS product_line
  FROM source s
  CROSS JOIN LATERAL regexp_split_to_table(COALESCE(s.product_text, ''), E'\\r?\\n') AS line
), parsed AS (
  SELECT
    l.*,
    COALESCE((regexp_match(
      l.product_line,
      '(?i)(?:x|จำนวน)?\\s*([0-9]+(?:\\.[0-9]+)?)\\s*คอต'
    ))[1]::numeric, 0) AS cot_quantity
  FROM lines l
  WHERE l.product_line IS NOT NULL
)
SELECT
  upsert_key,
  order_number,
  order_time_display,
  product_text,
  COUNT(*) AS product_line_count,
  SUM(cot_quantity) AS total_cot,
  cod_amount,
  CASE
    WHEN COUNT(*) = 1 THEN 'สินค้า 1 รายการ'
    WHEN COUNT(*) = 2 THEN 'สินค้า 2 รายการ'
    WHEN COUNT(*) = 3 THEN 'สินค้า 3 รายการ'
    ELSE 'สินค้า ' || COUNT(*) || ' รายการ'
  END AS product_line_status,
  CASE
    WHEN COUNT(*) = 0 THEN 'REVIEW_NO_PRODUCT_LINE'
    WHEN BOOL_AND(cot_quantity > 0) THEN 'PASS_COT_FOUND'
    ELSE 'REVIEW_COT_MISSING'
  END AS cot_check_status,
  string_agg(product_line, E'\n' ORDER BY product_line) AS parsed_product_lines
FROM parsed
GROUP BY upsert_key, order_number, order_time_display, product_text, cod_amount
ORDER BY order_time_display DESC NULLS LAST;
