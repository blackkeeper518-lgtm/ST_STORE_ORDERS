// n8n Code node: SPLIT_CANONICAL_ORDER_ITEMS
// Mode: Run Once for All Items
// Place after the canonical_orders upsert response, with canonical header id available.
// Never infer a product from the complete chat blob when structured items exist.

const arrayFrom = value => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch {}
  }
  return [];
};
const text = (...values) => values.find(value => value !== undefined && value !== null && String(value).trim())?.toString().trim() ?? "";
const sourceItems = row => {
  const payload = row.source_payload && typeof row.source_payload === "object" ? row.source_payload : {};
  const normalizer = payload._normalizer && typeof payload._normalizer === "object" ? payload._normalizer : {};
  return [
    row.order_items,
    row.items,
    row.product_items,
    normalizer.order_items_preserved,
    payload.order_items,
    payload.product_items,
  ].map(arrayFrom).find(items => items.length) ?? [];
};

const output = [];
for (const input of $input.all()) {
  const row = input.json ?? {};
  if (row.id == null) throw new Error(`SPLIT_CANONICAL_ORDER_ITEMS requires canonical_orders.id for ${row.upsert_key ?? "unknown order"}`);
  const items = sourceItems(row);
  items.forEach((item, index) => {
    const raw = text(item?.raw_product_text, item?.raw_item_text, item?.product_name, item?.th_name);
    if (!raw) return;
    const lineNo = Number(item?.line_no ?? index + 1);
    output.push({ json: {
      order_id: row.id,
      line_no: Number.isFinite(lineNo) && lineNo > 0 ? lineNo : index + 1,
      desk_key: row.desk_key ?? "suphabass",
      sku: item.sku ?? item.product_id ?? null,
      product_id: item.product_id ?? null,
      product_name: item.product_name ?? item.th_name ?? null,
      th_name: item.th_name ?? item.product_name ?? null,
      label_display: item.label_display ?? null,
      display_for_packer: item.display_for_packer ?? null,
      raw_product_text: raw,
      raw_product_text_norm: raw.replace(/\s+/g, " ").trim().toLowerCase(),
      raw_item_text: item.raw_item_text ?? raw,
      quantity: Number(item.quantity ?? item.qty ?? 1) || 1,
      extracted_qty: item.extracted_qty == null ? null : Number(item.extracted_qty),
      unit_price: item.unit_price == null ? null : Number(item.unit_price),
      expected_cod: item.expected_cod == null ? null : Number(item.expected_cod),
      mapping_status: item.mapping_status ?? "REVIEW",
      match_confidence: item.match_confidence ?? null,
      match_method: item.match_method ?? null,
      candidate_skus: item.candidate_skus ?? [],
      source_payload_item: item,
    } });
  });
}
return output;

// Supabase REST: /rest/v1/canonical_order_items?on_conflict=order_id,line_no
// Prefer: resolution=merge-duplicates,return=minimal
