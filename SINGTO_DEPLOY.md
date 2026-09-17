# Singto Store — Separate Deployment

ชุดนี้เป็น source แยกสำหรับเว็บสิงโตโดยเฉพาะ ไม่ใช้ตัวเลือก BB/ST และไม่ใช้ localStorage/config ของเว็บ BB

## Supabase

ตั้งค่าใน `/connect` ด้วยฐานข้อมูลของสิงโตเท่านั้น และใช้ตารางหลัก:

```text
st_orders
```

ถ้าเป็น View ให้ใส่ชื่อ View สิงโตที่ใช้งานจริงแทน `st_orders`

## Render

สร้าง Web Service ใหม่จาก repository นี้ ใช้ branch `main` และตั้ง Root Directory เป็น project root โดยไม่ต้องตั้ง `VITE_STORE_CODE` เพราะ source ถูกล็อกเป็น ST แล้ว

Build command:

```text
pnpm install --frozen-lockfile && pnpm build
```

Start command ให้ใช้คำสั่งเดิมของ repo/Render ที่ใช้อยู่
