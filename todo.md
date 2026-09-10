# SUPHABASS Order Desk — Delivery Checklist

## Completed features

- ย้ายแหล่งอ่านออเดอร์หลักไปที่ `vw_orders_web_all_fields` โดยมี fallback เป็น `canonical_orders` และกำหนด `desk_key` / `source_system` เป็น `suphabass`.
- เพิ่ม tRPC router contracts สำหรับ Order Control, chat, stock, mapping, aliases, vault และ health endpoint.
- เพิ่ม `ORDER_MERGE_BEFORE_CANONICAL` ให้รวม fragments ด้วย `upsert_key`/order identity และเลือกที่อยู่ที่ครบที่สุดจาก evidence fields.
- เพิ่ม `CANONICAL_SUPHABASS_PAYLOAD` เพื่อ preserve `source_payload`, evidence text, raw product wording, `order_items`, `items_json`, `upsert_key` และ desk identity.
- เพิ่ม `SPLIT_CANONICAL_ORDER_ITEMS` เพื่อสร้าง child rows ด้วย `(order_id, line_no)` และกรอง item ที่ไม่มี raw product text.
- เพิ่ม SQL migration สำหรับ `canonical_orders` และ `canonical_order_items` พร้อม indexes และ JSON/evidence columns.
- เพิ่มหน้า `/connect` สำหรับ Supabase URL + public anon key โดยเก็บเฉพาะ localStorage; ห้ามใช้ service-role key ใน browser.
- เพิ่ม browser fallback ของ Order Control ให้อ่าน `vw_orders_web_all_fields` ได้เมื่อ server-side Supabase function ใช้งานไม่ได้.
- คง admin protection สำหรับ Project Vault.
- ล้าง runtime/source references ของ legacy `bb_orders`, `bb_order_items_fix` และ `bb_order` เหลือศูนย์.

## Verification

- `pnpm check` ผ่าน.
- `pnpm build` ผ่าน; มีเพียงคำเตือน bundle size ของ Vite.
- `pnpm test` ผ่าน: 13 tests ผ่าน, 2 optional integration tests ถูก skip เมื่อไม่มี Supabase/service secrets ใน sandbox.
- n8n merge/payload/splitter syntax checks ผ่านเมื่อห่อเป็น Code node function.
- Smoke check: root `/`, `/connect` และ `/api/trpc/health` ตอบ HTTP 200; health คืน `deskKey: "suphabass"`.

## Remaining operational setup

- นำ `n8n/suphabass-canonical-schema.sql` ไป apply ใน Supabase SQL Editor ด้วย migration/service-role workflow.
- ตั้งค่า Supabase URL และ public anon key ที่หน้า `/connect` หากต้องการ browser fallback.
- ตั้งค่า server-only `SUPABASE_URL` และ `SUPABASE_SERVICE_ROLE_KEY` ใน WebDev secrets เพื่อให้ server-side order/chat reads ทำงาน.
- ปรับ n8n workflow ให้เรียง node: parser → `ORDER_MERGE_BEFORE_CANONICAL` → `CANONICAL_SUPHABASS_PAYLOAD` → canonical header upsert → `SPLIT_CANONICAL_ORDER_ITEMS` → item upsert.

## Known non-blocking notes

- `pnpm` แสดง warning ว่า legacy `pnpm` field ใน package.json ถูก ignore โดย pnpm รุ่นปัจจุบัน; ไม่กระทบ build/test.
- Live Supabase integration test และ vault access secret test ถูก skip เมื่อไม่มี secrets ใน sandbox; ทั้งสองจะรันอัตโนมัติเมื่อกำหนด env.

## Latest update — central_order_master web/bill View

- เพิ่ม `n8n/central-order-master-web-view.sql` สำหรับสร้าง `public.vw_orders_web_all_fields` จาก `public.central_order_master`.
- View ใช้ `m.*` เพื่อเก็บทุกคอลัมน์ต้นทาง และเพิ่ม `web_telegram_payload`, `web_address_all_fields`, `web_product_all_fields`, `web_source_row_backup`, `web_bill_header` และ fallback display/address fields.
- Server จะอ่าน `vw_orders_web_all_fields` ก่อน แล้ว fallback ไป `central_order_master` และ `canonical_orders`.
- ก่อนใช้งานจริง ให้รัน SQL View ใน Supabase SQL Editor ด้วยสิทธิ์ migration/service-role; browser ใช้ anon key อ่านอย่างเดียว.
- Verification ล่าสุด: `pnpm check`, `pnpm build`, `pnpm test` ผ่าน; 13 tests passed, 2 optional integration tests skipped without secrets.
