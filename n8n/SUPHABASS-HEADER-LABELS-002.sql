-- =====================================================================
-- SUPHABASS HEADER LABELS 002
-- Friendly female-admin tone. Randomized per generated bill.
-- No source evidence is changed by these functions.
-- =====================================================================

begin;

create or replace function public.fn_suphabass_ready_header()
returns text
language plpgsql
volatile
as $$
declare
  labels text[] := array[
    '💎 [ครบแล้วค่า แพ็กได้เลยนะคะ]',
    '✨ [เช็กให้แล้วค่า เรียบร้อยมาก]',
    '🎀 [บิลนี้ผ่านแล้วนะคะ จัดต่อได้เลย]',
    '🌸 [โอเคแล้วค่า พร้อมแพ็กนะคะ]',
    '💖 [เช็กครบแล้วค่า ไม่มีอะไรต้องห่วง]',
    '🫶 [ออเดอร์นี้เรียบร้อยแล้วนะคะ]',
    '👑 [ผ่านแล้วค่า บิลนี้สวยมาก]',
    '🌷 [พร้อมส่งต่อแล้วนะคะ]'
  ];
begin
  return labels[1 + floor(random() * array_length(labels, 1))::int];
end;
$$;

create or replace function public.fn_suphabass_review_header()
returns text
language plpgsql
volatile
as $$
declare
  labels text[] := array[
    '🌸 [ขอเช็กเพิ่มนิดนึงนะคะ]',
    '🛠️ [บิลนี้ขอจูนอีกนิดค่า]',
    '🎀 [เดี๋ยวแอดมินดูให้ต่อเลยนะคะ]',
    '💖 [ขอพักบิลไว้เช็กแป๊บนึงนะคะ]',
    '✨ [มีจุดเล็ก ๆ ให้แอดมินเก็บงานค่ะ]',
    '🫶 [เดี๋ยวจัดการรายละเอียดให้เรียบร้อยนะคะ]'
  ];
begin
  return labels[1 + floor(random() * array_length(labels, 1))::int];
end;
$$;

create or replace function public.fn_suphabass_out_of_stock_header()
returns text
language plpgsql
volatile
as $$
declare
  labels text[] := array[
    '🌙 [น้องขอพักจากตู้แป๊บนึงนะคะ]',
    '👑 [ตัวนี้ขอลาพักรอบนี้ก่อนค่ะ]',
    '✨ [ราชินีประจำตู้หายตัวชั่วคราวนะคะ]',
    '🌸 [ตัวนี้หมดชั่วคราวค่ะ เดี๋ยวแอดมินดูตัวเลือกให้นะคะ]',
    '💔 [น้องตัวนี้หมดแล้วค่ะ เดี๋ยวช่วยดูให้ต่อนะคะ]'
  ];
begin
  return labels[1 + floor(random() * array_length(labels, 1))::int];
end;
$$;

comment on function public.fn_suphabass_ready_header() is
  'Random friendly female-admin header for clean ready bills.';
comment on function public.fn_suphabass_review_header() is
  'Random friendly female-admin header for review bills.';
comment on function public.fn_suphabass_out_of_stock_header() is
  'Random friendly female-admin header for out-of-stock bills.';

notify pgrst, 'reload schema';
commit;

-- Usage inside the safe v16 pipeline:
-- v_header_status := public.fn_suphabass_ready_header();
-- v_header_status := public.fn_suphabass_review_header();
-- v_header_status := public.fn_suphabass_out_of_stock_header();
