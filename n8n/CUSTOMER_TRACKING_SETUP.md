# Customer + Tracking Setup

รัน `customer-tracking-schema.sql` ใน Supabase ของแต่ละร้านแยกกัน (BB และ ST) ก่อนเปิดหน้าเว็บใหม่

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

หน้าเว็บจะอ่านข้อมูลจากตารางเหล่านี้แบบ read-only จนกว่าแอดมินจะทำ workflow ยืนยันการจับคู่เสร็จ
