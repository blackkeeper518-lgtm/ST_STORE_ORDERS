-- BB STORE / ST STORE customer + tracking foundation
-- Run this SQL in each store's own Supabase project.

create or replace function public.normalize_phone(raw text)
returns text
language sql immutable
as $$
  select case
    when regexp_replace(coalesce(raw,''), '[^0-9]', '', 'g') like '66%'
      then '0' || substring(regexp_replace(coalesce(raw,''), '[^0-9]', '', 'g') from 3)
    else regexp_replace(coalesce(raw,''), '[^0-9]', '', 'g')
  end;
$$;

create table if not exists public.customer_profiles (
  id uuid primary key default gen_random_uuid(),
  customer_key text not null unique,
  phone_normalized text not null,
  customer_name text,
  facebook_name text,
  customer_segment text not null default 'new' check (customer_segment in ('new','regular','review')),
  total_orders integer not null default 0,
  successful_deliveries integer not null default 0,
  returned_orders integer not null default 0,
  last_order_at timestamptz,
  last_shipment_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists customer_profiles_phone_idx on public.customer_profiles(phone_normalized);

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customer_profiles(id) on delete cascade,
  address_raw text,
  address_normalized text not null,
  address_fingerprint text not null,
  postcode text,
  subdistrict_code text,
  district_code text,
  province_code text,
  subdistrict text,
  district text,
  province text,
  use_count integer not null default 1,
  is_primary boolean not null default false,
  last_used_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(customer_id, address_fingerprint)
);
create index if not exists customer_addresses_fingerprint_idx on public.customer_addresses(address_fingerprint);
create index if not exists customer_addresses_postcode_idx on public.customer_addresses(postcode);

create table if not exists public.order_customer_links (
  id uuid primary key default gen_random_uuid(),
  order_id bigint not null,
  order_number text,
  customer_id uuid not null references public.customer_profiles(id) on delete cascade,
  match_method text not null,
  match_score numeric(5,2) not null default 0,
  match_status text not null default 'matched' check (match_status in ('matched','review','unmatched')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(order_id)
);
create index if not exists order_customer_links_customer_idx on public.order_customer_links(customer_id);

create table if not exists public.parcel_order_matches (
  id uuid primary key default gen_random_uuid(),
  -- Keep this as text because legacy parcels tables may use bigint, uuid, or text ids.
  parcel_id text not null,
  tracking_number text,
  order_id bigint,
  order_number text,
  customer_id uuid references public.customer_profiles(id) on delete set null,
  match_method text,
  match_score numeric(5,2) not null default 0,
  match_status text not null default 'review' check (match_status in ('matched','review','unmatched')),
  match_evidence jsonb not null default '[]'::jsonb,
  candidate_count integer not null default 0,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(parcel_id)
);
create index if not exists parcel_order_matches_order_idx on public.parcel_order_matches(order_id);
create index if not exists parcel_order_matches_status_idx on public.parcel_order_matches(match_status);

create table if not exists public.shipment_events (
  id uuid primary key default gen_random_uuid(),
  parcel_id text,
  tracking_number text not null,
  status text not null,
  status_label text,
  event_at timestamptz not null default now(),
  source text not null default 'parcels',
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  unique(tracking_number, status, event_at)
);
create index if not exists shipment_events_tracking_idx on public.shipment_events(tracking_number, event_at desc);
create index if not exists shipment_events_status_idx on public.shipment_events(status, event_at desc);

comment on table public.customer_profiles is 'Normalized customer identity shared only inside this store database';
comment on table public.customer_addresses is 'Customer address fingerprints and Thai administrative codes';
comment on table public.parcel_order_matches is 'Safe, auditable parcel-to-order matching results';
comment on table public.shipment_events is 'Idempotent shipment status history';

-- Optional view for the web Customer History page.
create or replace view public.vw_customer_history as
select
  c.id as customer_id, c.customer_key, c.phone_normalized, c.customer_name,
  c.customer_segment, c.total_orders, c.successful_deliveries, c.returned_orders,
  c.last_order_at, c.last_shipment_at,
  count(distinct a.id) as address_count,
  count(distinct m.id) as parcel_match_count,
  count(distinct m.id) filter (where m.match_status = 'review') as parcel_review_count,
  max(m.updated_at) as last_match_at
from public.customer_profiles c
left join public.customer_addresses a on a.customer_id = c.id
left join public.parcel_order_matches m on m.customer_id = c.id
group by c.id;

-- Browser/dashboard read-only surface. Keep writes server-side/n8n only.
grant select on public.vw_customer_history to anon, authenticated;
notify pgrst, 'reload schema';
