BB_STORE_ORDERS — รวม logic ตอบแชทและธีมม่วง

ฐานที่ใช้
Repository คือ blackkeeper518-lgtm/BB_STORE_ORDERS ที่ commit 548782c0c3a8380f28163d2eba8054ef20083b1f

สิ่งที่เปลี่ยน
เพิ่มการเลือก Meta page token ด้วย page_id และ portal_key, ส่ง pageName/portalKey/chatLinkKey ไปกับคำสั่งตอบกลับ, แสดงข้อความตอบกลับทันทีระหว่างรอผล, และบันทึกข้อความขาออกหลัง Meta รับข้อความแล้ว

การเขียน Supabase ใช้ insert ปกติทุกครั้ง ไม่ใช้ ON CONFLICT หรือ upsert จึงไม่ต้องมี unique constraint บน dedupe_key และไม่กันข้อความซ้ำตามที่ผู้ใช้ระบุ หากส่งคำสั่งเขียนซ้ำ ระบบก็จะเพิ่มแถวใหม่ทุกครั้ง

เพิ่มป้าย neon สีม่วง, สัญญาณ COD วันนี้, ไฟขอบห้อง และแผง COD signal โดยรักษาแบรนด์ BB และฟีเจอร์เดิมของ repo เก่าไว้

ไฟล์ที่เปลี่ยน: client/src/index.css, client/src/lib/canonical.ts, client/src/pages/ChatHub.tsx, server/meta.ts, server/routers.ts และ server/supabase.ts

ตรวจสอบ: `pnpm build` ผ่านหลังแก้ writeback ล่าสุด; `git diff --check` ผ่าน ส่วน `pnpm check` เดิมเรียก `tsc --noEmit` แต่ repo ไม่มี tsconfig.json จึงแสดง help แทนการตรวจ type

วิธีใช้ patch
1. เปิด working copy ของ repo ที่ commit ด้านบน
2. ใช้ `git apply BB_STORE_ORDERS-chat-reply-purple-theme.patch`
3. รัน `pnpm install --frozen-lockfile && pnpm build`
4. สำหรับ Render ใช้ Build Command: `pnpm install --frozen-lockfile && pnpm build`

ยังไม่ได้ push ขึ้น GitHub หรือ deploy และไม่ได้เปลี่ยนค่า environment variables ใน Render.
