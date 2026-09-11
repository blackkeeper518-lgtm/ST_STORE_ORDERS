// n8n Code node: customer-segment-refresh
// Mode: Run Once for All Items
// Input: customer profile rows enriched with order/shipment statistics.
// Output: customer_profiles update payloads.

const num = value => { const n = Number(value ?? 0); return Number.isFinite(n) ? n : 0; };
const iso = () => new Date().toISOString();
return $input.all().map(input => {
  const row = input.json ?? {};
  const total = num(row.total_orders ?? row.order_count);
  const delivered = num(row.successful_deliveries ?? row.delivered_count);
  const returned = num(row.returned_orders ?? row.returned_count);
  const reviewMatches = num(row.review_matches ?? row.review_count);
  const segment = reviewMatches > 0 || returned > delivered ? "review" : delivered >= 2 || total >= 3 ? "regular" : "new";
  return { json: {
    record_type: "customer_segment",
    customer_id: row.customer_id ?? row.id ?? null,
    customer_key: row.customer_key,
    customer_segment: segment,
    total_orders: total,
    successful_deliveries: delivered,
    returned_orders: returned,
    last_order_at: row.last_order_at ?? null,
    last_shipment_at: row.last_shipment_at ?? null,
    updated_at: iso(),
  }};
});

// Update only customer_profiles. This node never edits orders or parcel matches.
