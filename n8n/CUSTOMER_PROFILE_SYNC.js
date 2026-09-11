// n8n Code node: customer-profile-sync
// Mode: Run Once for All Items
// Input: canonical order rows. Output: profile, address and order-link upsert payloads.

const text = value => String(value ?? "").trim();
const first = (...values) => values.find(value => text(value) !== "") ?? null;
const digits = value => text(value).replace(/\D/g, "");
const phone = value => {
  const raw = digits(value);
  if (raw.startsWith("66") && raw.length >= 11) return `0${raw.slice(2)}`;
  return raw;
};
const normalizeAddress = value => text(value)
  .toLowerCase()
  .replace(/แขวง|ตำบล|ต\.|เขต|อำเภอ|อ\.|จังหวัด|จ\./g, " ")
  .replace(/กรุงเทพมหานคร/g, "กรุงเทพ")
  .replace(/[^0-9ก-๙a-z]/gi, "")
  .trim();
const hash = value => {
  let h = 2166136261;
  for (const char of String(value)) { h ^= char.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).padStart(8, "0");
};
const iso = value => {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};
const items = value => Array.isArray(value) ? value : (() => { try { const parsed = JSON.parse(String(value ?? "[]")); return Array.isArray(parsed) ? parsed : []; } catch { return []; } })();

const out = [];
for (const input of $input.all()) {
  const row = input.json ?? {};
  const normalizedPhone = phone(first(row.phone, row.phone_number, row.telephone));
  const addressRaw = first(row.full_address, row.address_display_packer, row.address, row.address_for_bill);
  const addressNormalized = normalizeAddress(addressRaw);
  if (!normalizedPhone && !addressNormalized) continue;
  const customerKey = normalizedPhone ? `phone:${normalizedPhone}` : `address:${hash(addressNormalized)}`;
  const customerId = first(row.customer_id, row.profile_id, null);
  const orderId = first(row.order_id, row.id, null);
  const orderNumber = first(row.order_number, row.upsert_key, null);
  const occurredAt = iso(first(row.order_time, row.order_date, row.created_at, null));
  const addressFingerprint = addressNormalized ? `addr:${hash(`${normalizedPhone}|${addressNormalized}|${text(row.zipcode)}`)}` : null;
  const profile = {
    record_type: "customer_profile",
    customer_key: customerKey,
    phone_normalized: normalizedPhone || `unknown:${hash(addressNormalized)}`,
    customer_name: first(row.customer_name, row.facebook_name, "ไม่ระบุชื่อ"),
    facebook_name: first(row.facebook_name, null),
    updated_at: occurredAt,
    source_order_id: orderId,
  };
  out.push({ json: profile });
  if (addressFingerprint) out.push({ json: {
    record_type: "customer_address",
    customer_key: customerKey,
    address_raw: addressRaw,
    address_normalized: addressNormalized,
    address_fingerprint: addressFingerprint,
    postcode: first(row.zipcode, row.postcode, null),
    subdistrict: first(row.subdistrict, row.tambon, null),
    district: first(row.district, row.amphoe, null),
    province: first(row.province, null),
    last_used_at: occurredAt,
  }});
  if (orderId != null) out.push({ json: {
    record_type: "order_customer_link",
    order_id: Number(orderId),
    order_number: orderNumber,
    customer_key: customerKey,
    customer_id: customerId,
    match_method: normalizedPhone ? "phone_exact" : "address_fingerprint",
    match_score: normalizedPhone ? 100 : 70,
    match_status: customerId ? "matched" : "review",
    linked_at: occurredAt,
    order_items_count: items(row.order_items ?? row.items_json ?? row.items).length,
  }});
}
return out;

// Supabase routing:
// customer_profile -> customer_profiles upsert on customer_key
// customer_address -> lookup profile id, then upsert on (customer_id,address_fingerprint)
// order_customer_link -> lookup profile id, then upsert on order_id
