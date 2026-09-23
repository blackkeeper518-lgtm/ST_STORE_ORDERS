# ST Theme Patch

แพ็กเกจนี้มีเฉพาะไฟล์ที่แก้สำหรับ `ST_STORE_ORDERS` เท่านั้น ไม่มีไฟล์ BB และไม่มี `node_modules`, `dist` หรือ `.git`

## วิธีใช้

1. แตก ZIP
2. เข้าโฟลเดอร์ `ST_THEME_PATCH`
3. คัดลอกโฟลเดอร์ `client` ไปทับในรีโพ `ST_STORE_ORDERS` เดิม โดยคงโครงสร้างโฟลเดอร์ไว้
4. อัปโหลดไฟล์ที่อยู่ใต้ `client/src/...` ไปที่:
   `https://github.com/blackkeeper518-lgtm/ST_STORE_ORDERS/upload/main`
5. Commit เช่น `Apply ST orange HUD theme and ST-only layout`

ไฟล์ในแพตช์นี้เป็นไฟล์ที่แก้ธีมและ ST isolation:

- `client/src/components/DashboardLayout.tsx`
- `client/src/index.css`
- `client/src/lib/canonical.ts`
- `client/src/pages/ConnectSupabase.tsx`
- `client/src/pages/DailyChatSummary.tsx`
- `client/src/pages/OrderControl.tsx`
- `client/src/pages/ParcelMapping.tsx`
- `client/src/pages/SecretGallery.tsx`
- `client/src/pages/StockRoom.tsx`
- `client/src/pages/TelegramDeliveryRoom.tsx`

หลังอัปโหลด Render จะ build ตามการตั้งค่าเดิมของรีโพ
