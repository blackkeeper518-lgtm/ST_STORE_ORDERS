# Telegram Send Room สำหรับออเดอร์

## สรุปการออกแบบ

โครงสร้างที่มีอยู่รองรับ `telegram_status`, `telegram_message`, `telegram_chat_id` และ `order_items` แล้ว แต่ workflow export เดิมยังไม่มี node ส่ง Telegram จริง ดังนั้นการทำความสะอาดข้อความและการแตกสินค้าให้ทำใน n8n เพราะเป็นงาน deterministic ที่ตรวจสอบและแก้ alias ได้ง่าย ส่วน Supabase ใช้เก็บผลลัพธ์ที่ normalize แล้ว เป็น source สำหรับ dashboard, queue และประวัติการส่ง

| แนวทาง | ข้อดี | ข้อจำกัด | เหมาะกับงานนี้ |
|---|---|---|---|
| n8n parse → Supabase → Telegram | เห็นทุกขั้นตอน, retry ได้, แก้ alias และ mapping ได้โดยไม่แก้ฐานข้อมูลโดยตรง | ต้องต่อ node และตั้ง credential Telegram | **แนะนำ** |
| Supabase SQL/Function ทำความสะอาดทั้งหมด | query เร็วและรวม logic ในฐานข้อมูล | parser ข้อความไทย/หลายรูปแบบแก้ยาก, debug ยาก | ใช้เฉพาะ query/view และ fallback |

## ไฟล์ที่เพิ่ม

`TELEGRAM_ORDER_TEXT_PARSER.js` รับข้อความต้นฉบับจาก field `text`, `message`, `raw_text` หรือ `telegram_message` แล้วสร้าง header, `order_items[]`, `items_json`, `items_text`, `telegram_status` และ `parse_warnings` โดยไม่ทิ้ง `source_text` เดิม

`TELEGRAM_BUILD_BILL_MESSAGE.js` อ่านข้อมูล header และ `order_items[]` แล้วสร้างข้อความ Telegram แบบ HTML ตามรูปแบบบิลที่ให้มา พร้อม `telegram_send_key` สำหรับกันส่งซ้ำ

`telegram-send-room-migration.sql` เพิ่มคอลัมน์สถานะ, view ห้องส่ง, queue view และ archive แบบ idempotent

## ลำดับ node ที่แนะนำใน n8n

1. รับข้อความจาก Telegram หรือแหล่งออเดอร์เดิม
2. `TELEGRAM_ORDER_TEXT_PARSER`
3. `CENTRAL_ORDER_MASTER_BODY` หรือ sanitizer เดิม
4. Upsert `central_order_master` ด้วย `upsert_key`
5. `SPLIT_CANONICAL_ORDER_ITEMS`
6. Upsert `canonical_order_items` ด้วย conflict key `(order_id,line_no)`
7. `TELEGRAM_BUILD_BILL_MESSAGE`
8. IF: ส่งต่อเฉพาะ `telegram_status = READY_TO_SEND`
9. Telegram → Send Message โดยใช้ `{{$json.telegram_text}}`, Parse Mode `HTML`, Chat ID จาก `telegram_chat_id` หรือ credential/environment ของห้องส่ง
10. เมื่อส่งสำเร็จ ให้ insert/upsert `telegram_send_archive` และ PATCH order เป็น `telegram_status = SENT`, `telegram_sent_at`, `telegram_message_id`, `telegram_sent = true`
11. เมื่อส่งไม่สำเร็จ ให้ PATCH เป็น `RETRY` พร้อม `telegram_last_error`

## กติกาสำคัญ

อย่า parse สินค้าจากข้อความทั้งก้อนซ้ำเมื่อมี `order_items` ที่แตกแล้ว ให้ใช้ child rows จาก `canonical_order_items` เป็นแหล่งหลัก และใช้ JSON `central_order_master.order_items` เป็น fallback สำหรับออเดอร์เก่าเท่านั้น

ถ้าพบสินค้าที่ไม่รู้จักหรือ alias ไม่ชัดเจน ให้สถานะเป็น `REVIEW` และห้ามส่งอัตโนมัติ ตัวอย่าง `CHECK_SKU` ถูกสร้างเป็น `REVIEW` เพื่อให้คนตรวจ ไม่ควรปล่อยผ่านเป็นสินค้า matched

ใช้ `telegram_send_key` และ archive `send_key` เพื่อให้ retry ปลอดภัย ถ้า Telegram ตอบสำเร็จแต่ n8n timeout แล้ว retry ให้ upsert archive ด้วย key เดิมก่อนส่งใหม่ หรือเช็ก archive ก่อนส่งทุกครั้ง

## ผลจากตัวอย่างข้อความ

ข้อความที่มี `MOND_GREEN | 4 คอต` จะกลายเป็น item หนึ่งรายการ โดยมี `sku = MOND_GREEN`, `product_name = ม่อนเขียว`, `quantity = 4` และ `mapping_status = MATCHED`

ข้อความที่มี `คาม่วง 1` และ `คา แตงโม 2` จะกลายเป็นสองรายการ โดย alias เริ่มต้นคือ `CAVALLO_TWIN_X_BALL` จำนวน 1 และ `OS_WATERMELON` จำนวน 2 ตามลำดับ ทั้งสองรายการควรตรวจ alias จริงกับ product master ก่อนเปิดส่งอัตโนมัติใน production

ข้อความบิลแบบ HTML จะใส่ชื่อลูกค้า, เบอร์, ที่อยู่, COD และรายการจาก `order_items` ลงใน `<code>` block เพื่อให้คัดลอกไปประกอบบิลได้ง่าย
