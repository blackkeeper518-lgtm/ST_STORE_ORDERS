# ST / BB Full File Patch

แพ็กนี้เป็นไฟล์เต็มตาม path จริงสำหรับวางทับผ่าน GitHub Desktop โดยแยก ST และ BB เด็ดขาด

## ลำดับการวาง

1. สำรองไฟล์ใน repo ปลายทางก่อนวางทับ
2. แตก ZIP ที่ root ของ repo ให้โฟลเดอร์ `client/`, `sql/` และ `tools/` ทับ path เดิม
3. ห้ามนำไฟล์ของ ST ไปวางใน BB หรือกลับกัน
4. รัน SQL เฉพาะใน Supabase project ของค่ายเดียวกัน
5. ตรวจ build ก่อน commit/push: `npm run build`

## จุดสำคัญ

ห้อง Telegram ใช้แหล่งข้อมูลแยกตามค่ายและไม่บังคับ mapping gate ก่อนส่ง ออเดอร์ที่แมปไม่ได้ยังคงอยู่และใช้ raw evidence เป็น fallback

Lab ใช้เป็นทางผ่าน ทุกออเดอร์ยังคงอยู่ใน Lab; สถานะ `MATCHED`, `REVIEW_NOT_MATCHED` และ `NO_CANDIDATES` เป็นเพียงป้ายตรวจสอบ

BB อ่าน candidate สินค้าจากบล็อกด้านล่างของก้อนออเดอร์ ส่วน ST อ่านจากบล็อกด้านบน

ห้องคลังของทั้งสองค่ายอ่านและเขียน `product_master` โดยตรงเท่านั้น แสดง `stock_qty` และ `stock_status`; ไม่อ่าน `inventory` และไม่ตัดสต๊อกจากออเดอร์

ไฟล์ในแพ็กเป็นไฟล์เต็ม ไม่ใช่ unified diff และแพ็กนี้ยังไม่ได้ push ไป GitHub
