# ST Telegram Delivery Room Package

แพ็กเกจนี้สำหรับโปรเจกต์ ST เท่านั้น ห้ามนำ SQL ไปใช้ในฐานข้อมูล BB

## หน้าเว็บ

วางไฟล์ตามโครงสร้างเดิม:

```text
client/src/pages/TelegramDeliveryRoom.tsx
client/src/lib/canonical.ts
client/src/lib/telegramDelivery.ts
```

Route เดิมยังใช้:

```text
/telegram-delivery
```

ห้อง ST รองรับการติ๊กเลือกออเดอร์ทีละรายการหรือเปิดเลือกทั้งหมด, ปล่อยรันเฉพาะรายการที่เลือก, คัดลอกบิล, แก้ไข, ส่งจากเว็บ, ส่งจากภายนอก และกด `ติ๊ก SENT` ภายหลังได้ โดยการปล่อยรันไม่เปลี่ยน SENT อัตโนมัติ และการเตือนไม่บล็อกการส่ง

## SQL ที่ให้มา

รันใน Supabase ST เท่านั้น ตามลำดับที่เหมาะสม:

1. `vw_st_orders_all_v2.sql`
2. `vw_st_product_extraction_lab.sql`
3. `st_stamp_telegram_header_by_product_lane.sql`
4. `st_manual_delivery_and_alert_room_v1.sql`

SQL เป็นแหล่งสำหรับคิวออเดอร์, Lab, หัวบิล และห้องตรวจ/ส่งของ ST

## กฎข้อมูล

- ST ใช้แหล่งข้อมูล ST เท่านั้น
- สินค้าจาก Lab เป็นแหล่งแสดงสินค้า
- ถ้าแมปไม่ได้ ให้เก็บ raw evidence และขึ้นป้ายตรวจ
- หัวบิลต้องอ่านจากฟิลด์หัวบิลแบบไดนามิกของฐานข้อมูลเมื่อมีค่า
- ส่งจากเว็บหรือส่งจากภายนอกได้ แล้วกลับมากด `ติ๊ก SENT`
- ห้ามรัน SQL ชุดนี้ใน BB
