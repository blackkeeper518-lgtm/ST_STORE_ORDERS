-- เปิดสิทธิ์อ่าน/เขียนสำหรับ chat_customer_messages และ chat_page_messages
-- ใช้ใน Supabase SQL Editor ของโปรเจกต์ ST
--
-- คำเตือนด้านความปลอดภัย:
-- ชุดนี้เปิดให้ role anon อ่านและเขียนข้อมูลแชทได้จาก REST API
-- ถ้า n8n ใช้งานได้ ควรเปลี่ยนไปใช้ SUPABASE_SERVICE_ROLE_KEY
-- แล้วไม่ต้องเปิด policy ให้ anon (ดู SQL ทางเลือกท้ายไฟล์)

begin;

-- 1) ให้ REST API มองเห็น schema และตาราง
 grant usage on schema public to anon, authenticated;
 grant select, insert, update on table
   public.chat_customer_messages,
   public.chat_page_messages
   to anon, authenticated;

-- identity columns ต้องใช้ sequence ตอน insert หากไม่ได้ส่ง id มาเอง
grant usage, select on sequence
  public.chat_customer_messages_id_seq,
  public.chat_page_messages_id_seq
  to anon, authenticated;

-- 2) เปิด RLS อย่างชัดเจน
alter table public.chat_customer_messages enable row level security;
alter table public.chat_page_messages enable row level security;

-- 3) ลบ policy เดิมชื่อเดียวกันก่อน เพื่อให้รันซ้ำได้
 drop policy if exists "chat_customer_messages_select_api" on public.chat_customer_messages;
 drop policy if exists "chat_customer_messages_insert_api" on public.chat_customer_messages;
 drop policy if exists "chat_customer_messages_update_api" on public.chat_customer_messages;
 drop policy if exists "chat_page_messages_select_api" on public.chat_page_messages;
 drop policy if exists "chat_page_messages_insert_api" on public.chat_page_messages;
 drop policy if exists "chat_page_messages_update_api" on public.chat_page_messages;

-- 4) สิทธิ์อ่านห้องแชทลูกค้า
create policy "chat_customer_messages_select_api"
on public.chat_customer_messages
for select
to anon, authenticated
using (true);

-- สิทธิ์เพิ่มข้อความจากลูกค้า
create policy "chat_customer_messages_insert_api"
on public.chat_customer_messages
for insert
to anon, authenticated
with check (
  speaker_type = 'customer'
  and side = 'left'
);

-- สิทธิ์แก้ไขข้อมูลที่ sync แล้ว เช่น attachments/media status
create policy "chat_customer_messages_update_api"
on public.chat_customer_messages
for update
to anon, authenticated
using (true)
with check (
  speaker_type = 'customer'
  and side = 'left'
);

-- 5) สิทธิ์อ่านห้องแชทเพจ
create policy "chat_page_messages_select_api"
on public.chat_page_messages
for select
to anon, authenticated
using (true);

-- สิทธิ์เพิ่มข้อความตอบกลับจากเพจ
create policy "chat_page_messages_insert_api"
on public.chat_page_messages
for insert
to anon, authenticated
with check (
  speaker_type = 'page'
  and side = 'right'
);

-- สิทธิ์แก้ไขข้อมูลที่ sync แล้ว เช่น attachments/media status
create policy "chat_page_messages_update_api"
on public.chat_page_messages
for update
to anon, authenticated
using (true)
with check (
  speaker_type = 'page'
  and side = 'right'
);

commit;

-- ================================================================
-- ตรวจสอบผลหลังรัน
-- ================================================================
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('chat_customer_messages', 'chat_page_messages')
order by tablename, policyname;

-- ================================================================
-- ทางเลือกที่แนะนำสำหรับ production (ไม่เปิด anon)
-- ================================================================
-- ถ้า n8n ใช้ SUPABASE_SERVICE_ROLE_KEY จริง ให้ใช้ชุดนี้แทนด้านบน:
--
-- drop policy if exists "chat_customer_messages_select_api" on public.chat_customer_messages;
-- drop policy if exists "chat_customer_messages_insert_api" on public.chat_customer_messages;
-- drop policy if exists "chat_customer_messages_update_api" on public.chat_customer_messages;
-- drop policy if exists "chat_page_messages_select_api" on public.chat_page_messages;
-- drop policy if exists "chat_page_messages_insert_api" on public.chat_page_messages;
-- drop policy if exists "chat_page_messages_update_api" on public.chat_page_messages;
-- revoke all on table public.chat_customer_messages, public.chat_page_messages from anon, authenticated;
-- revoke all on sequence public.chat_customer_messages_id_seq, public.chat_page_messages_id_seq from anon, authenticated;
--
-- service_role จะ bypass RLS อัตโนมัติ ไม่ต้องสร้าง policy ให้ service_role
