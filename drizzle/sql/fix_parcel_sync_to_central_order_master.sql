-- FIX: นำเลขพัสดุจากไฟล์ Flash ไปเติม central_order_master
-- ปัญหาเดิม: trigger อ้าง NEW.tracking_number แต่ปลายทางไม่มีคอลัมน์ tracking_number
-- รันใน Supabase SQL Editor ของฐานค่ายนั้น ๆ เท่านั้น

begin;

-- 1) เพิ่มคอลัมน์ที่ปลายทางแบบปลอดภัย ถ้ามีอยู่แล้วจะไม่พัง
alter table public.central_order_master
  add column if not exists tracking_number text;

alter table public.central_order_master
  add column if not exists pickup_date timestamptz;

alter table public.central_order_master
  add column if not exists tracking_carrier text;

alter table public.central_order_master
  add column if not exists parcel_status text;

-- 2) Trigger function: ทำความสะอาดเบอร์ก่อนจับคู่
-- รองรับไฟล์ที่มี newline ท้าย phone_number และข้อมูลเบอร์แบบ 66xxxxxxxxx
create or replace function public.fn_sync_parcels_to_central_order_master_phone()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_phone text;
  clean_cod numeric;
  clean_pickup timestamptz;
begin
  clean_phone := regexp_replace(coalesce(new.phone_number, ''), '\\D', '', 'g');

  if clean_phone like '66%' and length(clean_phone) = 11 then
    clean_phone := '0' || substring(clean_phone from 3);
  end if;

  clean_cod := case
    when nullif(trim(coalesce(new.cod_amount::text, '')), '') is null then null
    when trim(new.cod_amount::text) ~ '^[0-9]+(\\.[0-9]+)?$' then trim(new.cod_amount::text)::numeric
    else null
  end;

  clean_pickup := case
    when nullif(trim(coalesce(new.pickup_date::text, '')), '') is null then null
    else trim(new.pickup_date::text)::timestamptz
  end;

  update public.central_order_master
  set tracking_number = coalesce(nullif(trim(new.tracking_number), ''), tracking_number),
      pickup_date = coalesce(clean_pickup, pickup_date),
      cod_amount = coalesce(clean_cod, cod_amount),
      updated_at = now()
  where regexp_replace(coalesce(phone, ''), '\\D', '', 'g') = clean_phone
     or regexp_replace(coalesce(extracted_phone, ''), '\\D', '', 'g') = clean_phone;

  return new;
end;
$$;

commit;

-- 3) ตรวจผลหลังรัน
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'central_order_master'
  and column_name in ('tracking_number', 'pickup_date', 'tracking_carrier', 'parcel_status')
order by column_name;

-- 4) ตรวจบิลที่มีเลขพัสดุแล้ว
select id, order_number, phone, extracted_phone, tracking_number, cod_amount, pickup_date, tracking_carrier, parcel_status
from public.central_order_master
where tracking_number is not null
order by updated_at desc nulls last
limit 20;
