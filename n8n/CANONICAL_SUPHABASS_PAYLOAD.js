// n8n Code node: CANONICAL_SUPHABASS_PAYLOAD
// Mode: Run Once for All Items
// Place after ORDER_MERGE_BEFORE_CANONICAL and then run CENTRAL_ORDER_MASTER_BODY.js before HTTP upsert.
// Desk identity is explicit so this workflow cannot silently write to another desk.

const DESK_KEY = "suphabass";
const out = [];
const asNumber = (value, fallback = 1) => { const n = Number(value); return Number.isFinite(n) ? n : fallback; };
const first = (...values) => values.find(value => value !== undefined && value !== null && String(value).trim() !== "");
const stableHash = value => { let hash = 2166136261; for (const char of String(value)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); } return (hash >>> 0).toString(16).padStart(8, "0"); };
const arrayFrom = value => { if (Array.isArray(value)) return value; if (typeof value === "string" && value.trim()) { try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch {} } return []; };

for (const item of $input.all()) {
  const r = item.json ?? {};
  const payload = r.source_payload && typeof r.source_payload === "object" ? r.source_payload : {};
  const items = arrayFrom(r.order_items ?? r.items ?? r.product_items ?? payload.order_items ?? payload.items ?? payload.product_items);
  const normalizedItems = items.map((line, index) => ({
    line_no: Number(line.line_no ?? index + 1),
    sku: first(line.sku, line.product_id, line.canonical_sku) ?? null,
    product_id: line.product_id ?? null,
    source_sku_result: line.source_sku_result ?? null,
    product_name: first(line.product_name, line.th_name, line.name) ?? null,
    th_name: first(line.th_name, line.product_name, line.name) ?? null,
    name_standard: first(line.name_standard, line.product_name, line.th_name, line.name) ?? null,
    label_display: first(line.label_display, line.display_label, line.product_name, line.sku) ?? null,
    display_for_packer: first(line.display_for_packer, line.display_for_packer_with_qty, line.packer_copy_text) ?? null,
    raw_product_text: first(line.raw_product_text, line.raw_item_text, line.product_name, line.name) ?? null,
    raw_item_text: first(line.raw_item_text, line.raw_product_text, line.product_name, line.name) ?? null,
    quantity: asNumber(first(line.quantity, line.extracted_qty, line.qty), 1),
    extracted_qty: line.extracted_qty == null ? null : asNumber(line.extracted_qty, 1),
    unit_price: line.unit_price == null ? null : asNumber(line.unit_price, 0),
    line_total: line.line_total == null ? null : asNumber(line.line_total, 0),
    expected_cod: line.expected_cod == null ? null : asNumber(line.expected_cod, 0),
    match_status: line.match_status ?? line.mapping_status ?? (line.sku || line.product_id ? "MATCHED" : "REVIEW"),
    mapping_status: line.mapping_status ?? line.match_status ?? (line.sku || line.product_id ? "MATCHED" : "REVIEW"),
    match_confidence: line.match_confidence ?? null,
    match_method: line.match_method ?? null,
    evidence_sources: line.evidence_sources ?? [],
    source_actor_type: line.source_actor_type ?? null,
    created_at: line.created_at ?? null,
    ingested_at: line.ingested_at ?? null,
    source_event_at: line.source_event_at ?? null,
    candidate_skus: line.candidate_skus ?? [],
    source_payload_item: line,
  })).filter(line => String(line.raw_product_text ?? "").trim());
  const pageId = first(r.page_id, r.pageId) ?? null;
  const threadId = first(r.thread_id, r.threadId, r.threadid, r.conversation_key, r.conversation_id) ?? null;
  // central_order_master uses order_number as the business identifier.
  // Legacy order_id must not be promoted into order_number.
  const orderNumber = first(r.order_number) ?? null;
  const sourceMessageId = first(r.source_message_id, r.message_id, r.page_summary_message_id) ?? null;
  const fingerprint = [DESK_KEY, pageId ?? "", threadId ?? "", orderNumber ?? "", sourceMessageId ?? "", first(r.order_time, r.order_date, r.created_at) ?? "", first(r.phone, r.extracted_phone) ?? ""].join("|");
  const upsertKey = first(r.upsert_key, orderNumber ? `${DESK_KEY}:order:${orderNumber}` : null, sourceMessageId ? `${DESK_KEY}:meta:${pageId ?? ""}:${threadId ?? ""}:${sourceMessageId}` : null, `${DESK_KEY}:fp:${stableHash(fingerprint)}`);
  const evidenceText = first(r.raw_text_with_phone_timed, r.sniper_x_text_clean, r.clean_text, r.single_cleaned_block, r.full_chunk_text, r.source_text) ?? null;
  const address = first(r.web_address_primary, r.address_display_full, r.address_display_primary, r.full_address, r.address_display_fallback, r.web_address_fallback, r.web_address_short, r.address_line_1, r.addressclean, r.short_address, r.address_display_packer) ?? null;
  out.push({ json: {
    ...r,
    desk_key: DESK_KEY,
    source_system: DESK_KEY,
    source_room: `${DESK_KEY}:${pageId ?? "unassigned"}:${threadId ?? "unassigned"}`,
    upsert_key: upsertKey,
    page_id: pageId,
    thread_id: threadId,
    conversation_key: threadId,
    order_number: orderNumber,
    address_display_packer: address,
    full_address: address,
    raw_text_with_phone_timed: r.raw_text_with_phone_timed ?? evidenceText,
    source_text: r.source_text ?? evidenceText,
    source_payload: { ...payload, _desk_key: DESK_KEY, _normalizer: { order_items_preserved: normalizedItems }, product_matcher: { matcher_status: r.matcher_status ?? null, matcher_version: r.matcher_version ?? null, catalog_status: r.catalog_status ?? null, catalog_count: r.catalog_count ?? null, matched_count: r.matched_count ?? null, review_count: r.review_count ?? null, unmatched_count: r.unmatched_count ?? null, matched_ratio: r.matched_ratio ?? null }, chat_timeline: r.chat_timeline ?? payload.chat_timeline ?? [], evidence_order_text: { sniper_x_text_clean: r.sniper_x_text_clean ?? null, clean_text: r.clean_text ?? null } },
    order_items: normalizedItems,
    items_json: normalizedItems,
    items_count: normalizedItems.length,
    total_quantity: normalizedItems.reduce((sum, line) => sum + line.quantity, 0),
    items_text: normalizedItems.map(line => `${line.display_for_packer ?? line.label_display ?? line.raw_product_text} ${line.quantity} ชิ้น`).join("\n"),
  } });
}
return out;

// Supabase REST: /rest/v1/canonical_orders?on_conflict=upsert_key
// Prefer: resolution=merge-duplicates,return=minimal
