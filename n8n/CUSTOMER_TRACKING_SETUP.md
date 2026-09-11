# Customer + Tracking Setup

รัน `customer-tracking-schema.sql` ใน Supabase ของแต่ละร้านแยกกัน (BB และ ST) ก่อนเปิดหน้าเว็บใหม่ ห้ามใช้ฐานข้อมูลร่วมกัน เพราะ `customer_key`, ที่อยู่ และประวัติการส่งต้องแยกตามร้าน

## สถานะห้องของ ST ตอนนี้

ST ยังไม่มีห้อง Telegram สำหรับออเดอร์ ปัจจุบันมีเฉพาะห้องแชทลูกค้าและแชทเพจ ดังนั้นชุด Customer + Tracking นี้ทำงานโดยเก็บข้อมูลเข้า Supabase และแสดงผลแบบ read-only ก่อน ไม่ต้องมี Telegram room และจะไม่พยายามส่งข้อความออกไปเอง เมื่อสร้างห้องออเดอร์ภายหลัง ค่อยต่อ node ส่งบิลเข้าห้องนั้นเป็นขั้นตอนแยก

## ตารางที่เพิ่ม

- `customer_profiles`: Customer Key จากเบอร์โทรและสถานะลูกค้า
- `customer_addresses`: Address fingerprint และรหัสตำบล/อำเภอ/จังหวัด
- `order_customer_links`: ความสัมพันธ์ลูกค้ากับออเดอร์
- `parcel_order_matches`: ผลจับคู่ parcels กับ order_id พร้อมคะแนนและหลักฐาน
- `shipment_events`: ประวัติสถานะพัสดุแบบกันข้อมูลซ้ำ
- `vw_customer_history`: View สำหรับหน้า Customer History

## Workflow n8n ที่ต้องต่อ

1. `customer-profile-sync`: อ่านออเดอร์ใหม่ → normalize phone/address → lookup ตารางพื้นที่ไทย → upsert customer_profiles/customer_addresses และ order_customer_links
2. `parcel-order-matching`: เวลา 19:00 → อ่าน parcels → ใช้ customer mapping + phone + address fingerprint + postcode + COD → upsert parcel_order_matches
3. `shipment-status-sync`: อ่านสถานะขนส่ง → insert shipment_events แบบ idempotent → อัปเดตสถิติลูกค้า
4. `customer-segment-refresh`: คำนวณ `new`, `regular`, `review` จากประวัติจริง

ไฟล์ Code node ที่เตรียมไว้แล้ว:

- `CUSTOMER_PROFILE_SYNC.js`
- `PARCEL_ORDER_MATCHING.js`
- `SHIPMENT_STATUS_SYNC.js`
- `CUSTOMER_SEGMENT_REFRESH.js`

ให้วางแต่ละไฟล์ใน n8n Code node แล้วต่อ HTTP Request ไป Supabase ตาม `record_type` ที่ node คืนออกมา โดยใช้ upsert keys ดังนี้:

| record_type | ตาราง | conflict key |
|---|---|---|
| `customer_profile` | `customer_profiles` | `customer_key` |
| `customer_address` | `customer_addresses` | `customer_id,address_fingerprint` |
| `order_customer_link` | `order_customer_links` | `order_id` |
| `parcel_order_match` | `parcel_order_matches` | `parcel_id` |
| `shipment_event` | `shipment_events` | `tracking_number,status,event_at` |
| `customer_segment` | `customer_profiles` | `id` หรือ `customer_key` |

ตั้ง schedule ของ `parcel-order-matching` เป็น 19:00 ตามเวลาไทย และตั้ง `shipment-status-sync` ให้ทำงานตามรอบที่ผู้ให้บริการขนส่งรองรับ การจับคู่ที่คะแนนต่ำกว่า 75 หรือมีหลาย candidate ให้คงสถานะ `review` ห้ามโปรโมตเป็น `matched` อัตโนมัติ

หน้าเว็บจะอ่านข้อมูลจาก `vw_customer_history` และตารางผลจับคู่แบบ read-only จนกว่าแอดมินจะทำ workflow ยืนยันการจับคู่เสร็จ ส่วนการเขียนข้อมูลให้ทำผ่าน n8n/service-role เท่านั้น
