# ชุดไฟล์เต็ม: แยกเส้นทาง BB และ ST

## หลักการ

เว็บแต่ละค่ายต้องเชื่อม Supabase ของตัวเองผ่านหน้า `/connect` และเก็บ URL/Anon Key ใน localStorage ของ browser ของ deployment นั้นเอง. ห้ามฝัง URL ของ BB เป็นค่าเริ่มต้นในโค้ด และห้ามให้หน้า Order Control ใช้ตารางของอีกค่าย.

ฟีเจอร์ใหม่แยกเป็นสองห้อง:

- `/alien-room` — ห้องคำวิบัติ อ่าน `canonical_order_items` ของฐานที่เว็บนี้เชื่อมอยู่ แสดงคำดิบเทียบกับ SKU และ Display จาก Master
- `/stock-room` — คลังสินค้าหลัก อ่าน/เขียน `inventory` ของฐานที่เว็บนี้เชื่อมอยู่

Order Control, Chat และ Daily Summary ยังคงใช้เส้นทาง Canonical ของค่ายนั้น ไม่ถูกเปลี่ยนให้ไปอ่านข้อมูลของอีกค่าย.

## ไฟล์ที่ต้องคัดลอกไปทั้งสอง deployment

```text
app/client/src/App.tsx
app/client/src/components/DashboardLayout.tsx
app/client/src/lib/canonical.ts
app/client/src/pages/ConnectSupabase.tsx
app/client/src/pages/AlienRoom.tsx
app/client/src/pages/StockRoom.tsx
```

ให้วางไฟล์ชุดเดียวกันในโค้ดของ BB และ ST แล้ว build/deploy แยกกัน. ความแตกต่างของข้อมูลจะมาจาก Supabase URL ที่กรอกในหน้า `/connect` ไม่ใช่จากการแก้โค้ดคนละชุด.

## SQL ที่ต้องรัน

รันไฟล์ `inventory-one-shot.sql` แยกใน Supabase BB และ Supabase ST. ไฟล์นี้สร้าง `public.inventory`, คอลัมน์, index, RLS และ policy พื้นฐานแบบรันซ้ำได้.

ห้ามวางข้อความ Error เช่น `Failed to run sql query:` ลงใน SQL Editor.

## ลำดับทดสอบหลัง deploy

1. เปิดเว็บ BB ไปที่ `/connect`, กรอก URL BB และ Anon/Publishable Key ของ BB แล้วกดเชื่อมต่อ.
2. เปิด `/stock-room` ตรวจสินค้าและกดเพิ่มสต๊อกหนึ่งรายการ.
3. เปิด `/alien-room` ตรวจว่าคำดิบของออเดอร์ BB แสดงในคอลัมน์คำดิบ.
4. เปิดเว็บ ST ในโดเมน/เบราว์เซอร์ของ ST ไปที่ `/connect`, กด **ล้างค่าฐานเดิม** หนึ่งครั้ง แล้วกรอก URL ST และ Key ของ ST.
5. เปิด `/stock-room` และ `/alien-room` ของ ST ตรวจว่าข้อมูลเป็นของ ST ไม่ใช่ BB.
6. ตรวจ `/orders` ของ ST ว่ายังแสดงออเดอร์ ST เท่านั้น.

## ข้อจำกัดที่ต้องรู้

localStorage แยกตามโดเมนเว็บ. ถ้าเปิด BB และ ST คนละโดเมน แต่ละเว็บจะจำฐานของตัวเองได้. ถ้าสลับทดสอบสองค่ายในโดเมนเดียวกัน ให้กด **ล้างค่าฐานเดิม** ก่อนกรอกอีกค่าย เพื่อป้องกันอ่านผิดฐาน.

## ผลตรวจล่าสุด

```text
pnpm exec tsc --noEmit  ผ่าน
pnpm run build        ผ่าน
```

Build มีคำเตือนเรื่อง bundle ใหญ่กว่า 500 kB แต่ไม่มี compilation error.
