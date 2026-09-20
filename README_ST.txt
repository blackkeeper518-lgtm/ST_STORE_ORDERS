ชุดนี้สำหรับระบบ ST เท่านั้น
ห้ามนำไปใส่โปรเจค BB

ไฟล์ที่ต้องวางทับตาม path เดิม:
1. client/src/lib/canonical.ts
2. client/src/pages/TelegramDeliveryRoom.tsx
3. sql/vw_st_telegram_rooms_fast.sql

หลังอัปไฟล์โค้ดแล้ว ให้รัน SQL ใน Supabase โปรเจค ST เท่านั้น:
1. sql/vw_st_orders_all_v2.sql (ถ้ายังไม่เคยรัน)
2. sql/vw_st_telegram_rooms_fast.sql

สายข้อมูล:
เว็บออเดอร์ ST -> ห้องกลาง Telegram ST -> ห้องส่ง Telegram ST

สินค้าใช้ลำดับ:
final_display_for_packer -> single_cleaned_products -> single_cleaned_block

ห้ามรัน SQL นี้ใน BB และห้ามใช้ vw_st_alien_master_center เป็น source ห้อง Telegram
