-- ST Telegram Delivery status + evidence backups
-- Idempotent: safe to run more than once. Does not delete orders.

begin;

alter table public.st_orders
  add column if not exists telegram_status text,
  add column if not exists telegram_sent boolean not null default false,
  add column if not exists telegram_status_label text,
  add column if not exists telegram_status_slogan text,
  add column if not exists telegram_sent_at timestamptz,
  add column if not exists telegram_delivery_attempts integer not null default 0,
  add column if not exists product_backup_1 text,
  add column if not exists product_backup_2 text,
  add column if not exists full_address_backup_1 text,
  add column if not exists full_address_backup_2 text,
  add column if not exists address_candidates jsonb,
  add column if not exists address_source text,
  add column if not exists address_completeness jsonb,
  add column if not exists product_source text,
  add column if not exists product_evidence jsonb,
  add column if not exists raw_product_evidence jsonb,
  add column if not exists telegram_message text,
  add column if not exists telegram_copy_text text,
  add column if not exists telegram_body jsonb;

create or replace function public.trg_st_telegram_delivery_and_backups()
returns trigger
language plpgsql
as $$
declare
  payload jsonb := to_jsonb(new);
  sent boolean := false;
  product_primary text;
  chat_product_evidence text;
  address_primary text;
  address_parts text;
  status_text text;
begin
  sent := coalesce((payload->>'telegram_sent')::boolean, false)
       or upper(coalesce(payload->>'telegram_status', '')) in ('SENT', 'DELIVERED', 'ไปแล้วไปลับ')
       or upper(coalesce(payload->'telegram_body'->>'status', '')) in ('SENT', 'DELIVERED');

  product_primary := coalesce(nullif(btrim(payload->>'master_display_for_packer'), ''), nullif(btrim(payload->>'display_for_ku'), ''), nullif(btrim(payload->>'product_display_for_packer'), ''), nullif(btrim(payload->>'display_for_packer'), ''), nullif(btrim(payload->>'product_name'), ''), nullif(btrim(payload->>'th_name'), ''), nullif(btrim(payload->>'sku'), ''));
  chat_product_evidence := coalesce(nullif(btrim(payload->>'product_evidence'), ''), nullif(btrim(payload->>'raw_product_evidence'), ''), nullif(btrim(payload->>'normalized_chat_timeline'), ''), nullif(btrim(payload->>'chat_timeline'), ''));
  address_primary := coalesce(nullif(btrim(payload->>'full_address'), ''), nullif(btrim(payload->>'final_address_for_bill'), ''), nullif(btrim(payload->>'address_display_packer'), ''), nullif(btrim(payload->>'addressclean'), ''));
  address_parts := nullif(concat_ws(' ', nullif(payload->>'short_address', ''), nullif(payload->>'district', ''), nullif(payload->>'amphoe', ''), nullif(payload->>'province', ''), nullif(payload->>'zipcode', '')), '');

  -- Preserve original evidence; only fill empty backup slots.
  new.product_backup_1 := coalesce(nullif(btrim(new.product_backup_1), ''), nullif(btrim(chat_product_evidence), ''), nullif(btrim(new.product_display_for_packer), ''), nullif(btrim(new.display_for_packer), ''), nullif(btrim(new.product_name), ''), nullif(btrim(new.th_name), ''), nullif(btrim(new.sku), ''));
  new.product_backup_2 := coalesce(nullif(btrim(new.product_backup_2), ''), nullif(btrim(new.product_copy_text), ''), nullif(btrim(new.telegram_final_mapped), ''), nullif(btrim(new.raw_text), ''));
  new.full_address_backup_1 := coalesce(nullif(btrim(new.full_address_backup_1), ''), nullif(btrim(new.address_display_packer), ''), nullif(btrim(new.addressclean), ''), nullif(btrim(new.full_address), ''));
  new.full_address_backup_2 := coalesce(nullif(btrim(new.full_address_backup_2), ''), address_parts, nullif(btrim(new.raw_text_with_phone), ''));
  new.address_source := coalesce(nullif(btrim(new.address_source), ''), case when address_primary is not null then 'ORDER_PRIMARY' when address_parts is not null then 'ADDRESS_PARTS' else 'RAW_EVIDENCE' end);
  new.address_candidates := coalesce(new.address_candidates, jsonb_build_array(nullif(address_primary, ''), nullif(new.full_address_backup_1, ''), nullif(new.full_address_backup_2, ''), nullif(address_parts, '')));
  new.address_completeness := jsonb_build_object('has_product', product_primary is not null, 'has_address', address_primary is not null or address_parts is not null, 'has_phone', nullif(btrim(coalesce(new.phone, new.extracted_phone, '')), '') is not null, 'priority', 'PRODUCT_THEN_ADDRESS');
  new.product_source := coalesce(nullif(btrim(new.product_source), ''), case when nullif(btrim(chat_product_evidence), '') is not null then 'CHAT_TIMELINE_1PASS' when nullif(btrim(new.master_display_for_packer), '') is not null then 'PRODUCT_MASTER' when product_primary is not null then 'ORDER_FIELDS' else 'RAW_EVIDENCE' end);

  if sent then
    new.telegram_sent := true;
    new.telegram_status := 'SENT';
    new.telegram_status_label := 'ไปแล้วไปลับ';
    new.telegram_status_slogan := 'ไปแล้วไม่กลับ — ค่อยแวะมาใหม่';
    new.telegram_sent_at := coalesce(new.telegram_sent_at, now());
  else
    new.telegram_status := coalesce(nullif(btrim(new.telegram_status), ''), 'PENDING');
    new.telegram_status_label := coalesce(nullif(btrim(new.telegram_status_label), ''), 'รอส่ง');
    new.telegram_status_slogan := coalesce(nullif(btrim(new.telegram_status_slogan), ''), 'ยังอยู่ในห้องรอจัดส่ง');
  end if;

  return new;
end;
$$;

drop trigger if exists trg_st_telegram_delivery_and_backups on public.st_orders;
create trigger trg_st_telegram_delivery_and_backups
before insert or update on public.st_orders
for each row execute function public.trg_st_telegram_delivery_and_backups();

commit;
