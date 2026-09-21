# ST Telegram Delivery Upload Bundle

อัปไฟล์ตาม path เดิมใน repository ของ ST

ไฟล์สำคัญ:
- client/src/pages/TelegramDeliveryRoom.tsx — ห้องส่ง Telegram + ประวัติ + Refresh
- sql/vw_st_telegram_rooms_fast.sql — view กลางสำหรับข้อความ Telegram แบบ HTML
- client/src/pages/SecretGallery.tsx — ห้องลับสำหรับ Supabase URL/Key
- client/src/App.tsx — route /connect เด้งเข้าห้องลับ และแยก config เฉพาะค่าย
- client/src/lib/canonical.ts — การอ่าน/บันทึก config ของค่ายนี้

หมายเหตุ: ZIP นี้ไม่รวม credentials และไม่ deploy ให้อัตโนมัติ
