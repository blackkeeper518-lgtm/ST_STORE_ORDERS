// n8n Code node: shipment-status-sync
// Mode: Run Once for All Items
// Input: carrier status rows from parcels/tracking API.
// Output: shipment_events inserts plus customer statistic refresh hints.

const text = value => String(value ?? "").trim();
const iso = value => { const d = new Date(value ?? Date.now()); return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString(); };
const out = [];
for (const input of $input.all()) {
  const row = input.json ?? {};
  const tracking = text(row.tracking_number ?? row.tracking_no ?? row.tracking);
  const status = text(row.status ?? row.shipment_status ?? row.delivery_status).toUpperCase();
  if (!tracking || !status) continue;
  const eventAt = iso(row.event_at ?? row.status_time ?? row.updated_at ?? row.created_at);
  out.push({ json: {
    record_type: "shipment_event",
    idempotency_key: `shipment:${tracking}:${status}:${eventAt}`,
    parcel_id: row.parcel_id ?? row.id ?? null,
    tracking_number: tracking,
    status,
    status_label: text(row.status_label ?? row.status_name ?? status),
    event_at: eventAt,
    source: text(row.source ?? row.carrier ?? "carrier_api"),
    raw_payload: row,
    delivered: /DELIVER|SUCCESS|สำเร็จ|นำจ่ายแล้ว/i.test(status),
    returned: /RETURN|ตีกลับ|ส่งคืน|COD_FAIL/i.test(status),
    customer_id: row.customer_id ?? null,
  }});
}
return out;

// Supabase shipment_events upsert on (tracking_number,status,event_at).
// After insert, refresh customer totals using customer_id/order_customer_links.
