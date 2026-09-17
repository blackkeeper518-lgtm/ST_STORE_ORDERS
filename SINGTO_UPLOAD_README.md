# SINGTO STORE SYSTEM

แพ็กเกจนี้เป็นสำเนา ST/SINGTO จากระบบ BB ปัจจุบัน แยกสำหรับสร้างรีโพใหม่ชื่อ `singto-store-system`

ปรับชื่อหน้าเว็บเป็น SINGTO STORE, ค่ายเริ่มต้นเป็น ST, ตารางออเดอร์เริ่มต้นเป็น `st_orders`/`vw_st_orders_all_v2` และโทนสีส้ม-ดำแล้ว

วิธีใช้: สร้าง repository ใหม่ชื่อ `singto-store-system` แล้วอัปโหลดไฟล์ทั้งหมดในแพ็กเกจนี้ลง root ของ repository โดยคงโครงสร้าง `client/`, `server/`, `shared/`, `sql/` และไฟล์ root ไว้เหมือนเดิม

การตรวจสอบในเครื่อง: `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm build`, `pnpm test` ผ่านแล้ว
