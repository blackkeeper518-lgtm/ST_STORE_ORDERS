-- ALIEN ROOM + PRODUCT MASTER BROWSER READ PERMISSIONS
-- รันใน Supabase SQL Editor ของ BB และ ST แยกกัน
-- ใช้ Anon/Publishable Key จาก browser ได้ แต่ไม่เปิด Service Role

begin;

-- ให้ PostgREST/anon มองเห็น schema public
grant usage on schema public to anon, authenticated;

-- ตารางที่ Alien Room ต้องอ่าน
grant select on table public.canonical_order_items to anon, authenticated;
grant select on table public.product_master to anon, authenticated;

-- เปิด RLS แล้วอนุญาตให้อ่านข้อมูลสำหรับ dashboard ภายใน
alter table public.canonical_order_items enable row level security;
alter table public.product_master enable row level security;

drop policy if exists alien_room_items_select on public.canonical_order_items;
create policy alien_room_items_select
  on public.canonical_order_items
  for select
  to anon, authenticated
  using (true);

drop policy if exists alien_room_product_master_select on public.product_master;
create policy alien_room_product_master_select
  on public.product_master
  for select
  to anon, authenticated
  using (coalesce(status, 'ACTIVE') = 'ACTIVE');

-- ถ้ามีตาราง product_aliases ให้เปิดอ่านแบบปลอดภัยด้วย
-- ใช้ DO เพื่อไม่ให้ SQL ล้มในฐานที่ยังไม่มีตารางนี้
do $$
begin
  if to_regclass('public.product_aliases') is not null then
    execute 'grant select on table public.product_aliases to anon, authenticated';
    execute 'alter table public.product_aliases enable row level security';
    execute 'drop policy if exists alien_room_aliases_select on public.product_aliases';
    execute 'create policy alien_room_aliases_select on public.product_aliases for select to anon, authenticated using (true)';
  end if;
end $$;

commit;

notify pgrst, 'reload schema';

-- ตรวจสิทธิ์และ policy
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and table_name in ('canonical_order_items', 'product_master', 'product_aliases')
  and privilege_type = 'SELECT'
order by table_name, grantee;

select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('canonical_order_items', 'product_master', 'product_aliases')
order by tablename, policyname;

select
  (select count(*) from public.canonical_order_items) as canonical_item_count,
  (select count(*) from public.product_master) as product_master_count;
