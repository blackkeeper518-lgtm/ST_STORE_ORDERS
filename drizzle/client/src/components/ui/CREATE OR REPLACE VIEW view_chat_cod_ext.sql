CREATE OR REPLACE VIEW view_chat_cod_extracted WITH (security_invoker = false) AS
SELECT 
  *,
  -- 1. แกะตัวเลขยอดเงิน COD ออกมา (เช่น 700)
  (regexp_match(message_text, '(?:ยอดรวม\[?COD\]?|COD)\s*[:\s]*([\d,]+)'))[1] AS cod_amount_text,
  
  -- 2. แปลงเป็นตัวเลข Numeric เพื่อนำไป SUM / คำนวณต่อได้ทันที
  NULLIF(
    regexp_replace(
      (regexp_match(message_text, '(?:ยอดรวม\[?COD\]?|COD)\s*[:\s]*([\d,]+)'))[1], 
      ',', '', 'g'
    ), 
    ''
  )::numeric AS cod_amount
FROM chat_page_messages
WHERE message_text LIKE '%COD%';

-- ปลดล็อกสิทธิ์ให้ n8n อ่านข้อมูลได้
GRANT SELECT ON view_chat_cod_extracted TO anon, authenticated, service_role;