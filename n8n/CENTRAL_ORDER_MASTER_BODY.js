// n8n Code node: CENTRAL_ORDER_MASTER_BODY
// Place immediately before the HTTP Request that writes public.central_order_master.
// It prevents matcher/helper fields from becoming unknown Supabase columns.
// Keep the complete matcher result inside source_payload and order_items.

const input = $input.all();
const text = value => value == null ? null : String(value);
const num = value => value == null || value === '' || Number.isNaN(Number(value)) ? null : Number(value);
const bool = value => value === true || value === 1 || value === '1' || value === 'true';
const arr = value => Array.isArray(value) ? value : [];
const obj = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const first = (...values) => values.find(value => value !== undefined && value !== null && String(value).trim() !== '');
const normalizeDateTime = value => {
  if (value == null || value === '') return null;
  const raw = String(value).trim();
  // Preserve already-valid ISO timestamps exactly.
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw) || /^\d{4}-\d{2}-\d{2} /.test(raw)) return raw;
  // Convert Thai/Buddhist display time to PostgreSQL-compatible ISO,
  // while order_time_display keeps the original text unchanged.
  const m = raw.match(/^(\d{1,2})[\\/.-](\d{1,2})[\\/.-](\d{4})(?:\s+|T)(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (m) {
    const year = Number(m[3]) > 2400 ? Number(m[3]) - 543 : Number(m[3]);
    const day = String(Number(m[1])).padStart(2, '0');
    const month = String(Number(m[2])).padStart(2, '0');
    const hour = String(Number(m[4])).padStart(2, '0');
    const minute = String(Number(m[5])).padStart(2, '0');
    const second = String(Number(m[6] ?? 0)).padStart(2, '0');
    return `${year}-${month}-${day}T${hour}:${minute}:${second}+07:00`;
  }
  return raw;
};

for (const item of input) {
  const r = item.json ?? {};
  const payload = obj(r.source_payload);
  const rawItems = arr(r.order_items ?? r.items ?? payload.order_items ?? payload.items);
  const orderItems = rawItems.map((line, index) => ({
    line_no: num(line.line_no) ?? index + 1,
    raw_item_text: first(line.raw_item_text, line.raw_product_text, line.name, line.product_name),
    raw_product_text: first(line.raw_product_text, line.raw_item_text, line.name, line.product_name),
    sku: first(line.sku, line.source_sku_result, line.product_id),
    source_sku_result: line.source_sku_result ?? null,
    product_id: line.product_id ?? null,
    product_name: first(line.product_name, line.th_name, line.name),
    th_name: first(line.th_name, line.product_name, line.name),
    name_standard: first(line.name_standard, line.product_name, line.th_name, line.name),
    label_display: first(line.label_display, line.display_label, line.product_name, line.sku),
    display_for_packer: first(line.display_for_packer, line.display_for_packer_with_qty, line.packer_copy_text),
    quantity: num(first(line.quantity, line.extracted_qty, line.qty)) ?? 1,
    extracted_qty: num(line.extracted_qty),
    unit_price: num(line.unit_price),
    line_total: num(line.line_total),
    expected_cod: num(line.expected_cod),
    emoji: line.emoji ?? line.extracted_emoji ?? null,
    match_status: line.match_status ?? line.mapping_status ?? 'REVIEW',
    mapping_status: line.mapping_status ?? line.match_status ?? 'REVIEW',
    match_confidence: num(line.match_confidence),
    match_method: line.match_method ?? null,
    evidence_sources: arr(line.evidence_sources),
    candidate_skus: arr(line.candidate_skus),
    source_actor_type: line.source_actor_type ?? null,
    source_payload_item: line.source_payload_item ?? line,
    created_at: line.created_at ?? null,
    updated_at: line.updated_at ?? null,
    ingested_at: line.ingested_at ?? null,
    source_event_at: line.source_event_at ?? null
  }));

  const sourceChatId = first(r.source_chat_id, r.thread_id, r.threadId, r.conversation_key, r.conversation_id);
  const sourcePayload = {
    ...payload,
    _desk_key: 'suphabass',
    _normalizer: { order_items_preserved: orderItems },
    product_matcher: {
      matcher_status: r.matcher_status ?? null,
      matcher_version: r.matcher_version ?? null,
      catalog_status: r.catalog_status ?? null,
      catalog_count: num(r.catalog_count),
      matched_count: num(r.matched_count),
      review_count: num(r.review_count),
      unmatched_count: num(r.unmatched_count),
      matched_ratio: num(r.matched_ratio)
    },
    chat_timeline: r.chat_timeline ?? payload.chat_timeline ?? [],
    evidence_order_text: {
      sniper_x_text_clean: r.sniper_x_text_clean ?? null,
      clean_text: r.clean_text ?? null
    }
  };

  item.json = {
    upsert_key: text(r.upsert_key ?? first(r.order_number, r.source_message_id, `${r.page_id ?? ''}:${sourceChatId ?? ''}`)),
    source_message_id: text(r.source_message_id ?? r.message_id),
    source_chat_id: text(sourceChatId),
    thread_id: text(r.thread_id ?? r.threadId),
    source_chat_type: text(r.source_chat_type ?? 'PRIVATE'),
    source_system: text(r.source_system ?? 'SUPHABASS'),
    order_number: text(r.order_number),
    order_date: text(r.order_date),
    order_time: normalizeDateTime(r.order_time ?? r.orderTimeIso ?? r.order_time_display ?? r.orderTimeDisplay ?? r.time_th),
    order_time_display: text(r.order_time_display ?? r.orderTimeDisplay ?? r.time_th ?? r.order_time),
    time_th: text(r.time_th),
    day_of_week: text(r.day_of_week),
    page_id: text(r.page_id ?? r.pageId),
    page_name: text(r.page_name),
    recipient_id: text(r.recipient_id),
    assigned_hashtag: text(r.assigned_hashtag),
    facebook_name: text(r.facebook_name),
    customer_name: text(r.customer_name),
    phone: text(r.phone ?? r.extracted_phone),
    extracted_phone: text(r.extracted_phone ?? r.phone),
    phone_norm: text(r.phone_norm ?? r.phone ?? r.extracted_phone),
    full_address: text(r.full_address ?? r.address_display_packer ?? r.addressclean),
    address_line_1: text(r.address_line_1 ?? r.short_address),
    address_line_2: text(r.address_line_2),
    district: text(r.district),
    amphoe: text(r.amphoe),
    province: text(r.province),
    zipcode: text(r.zipcode),
    raw_cod_amount: num(r.raw_cod_amount ?? r.cod_amount),
    cod_amount: num(r.cod_amount),
    expected_cod: num(r.expected_cod),
    unit_price_total: num(r.unit_price_total ?? r.calculated_items_total),
    raw_order_status: text(r.raw_order_status ?? r.order_status),
    mapping_status: text(r.mapping_status ?? r.matcher_status ?? 'REVIEW'),
    order_status: text(r.order_status),
    route_stage: text(r.route_stage),
    view_status: text(r.view_status),
    history_status: text(r.history_status),
    research_status: text(r.research_status),
    duplicate_count: num(r.duplicate_count) ?? 0,
    last_duplicate_at: r.last_duplicate_at ?? null,
    source_text: text(r.source_text ?? r.sniper_x_text_clean ?? r.clean_text),
    thread_id: text(r.thread_id ?? r.threadId),
    threadid: text(r.threadId),
    conversation_key: text(r.conversation_key),
    alias: text(r.alias),
    alias_norm: text(r.alias_norm),
    alias_text: text(r.alias_text),
    aliases: arr(r.aliases),
    sku: text(r.sku),
    product_id: text(r.product_id),
    source_sku_result: text(r.source_sku_result),
    product_name: text(r.product_name),
    th_name: text(r.th_name),
    name_standard: text(r.name_standard),
    brand: text(r.brand),
    parsed_product_raw: text(r.parsed_product_raw),
    extracted_product_block: text(r.extracted_product_block),
    display_for_packer: text(r.display_for_packer),
    telegram_final_mapped: text(r.telegram_final_mapped),
    display_label: text(r.display_label),
    product_display_candidates: arr(r.product_display_candidates),
    raw_item_text: text(r.raw_item_text),
    raw_product_text: text(r.raw_product_text),
    quantity: num(r.quantity ?? r.qty),
    qty: num(r.qty ?? r.quantity),
    extracted_qty: num(r.extracted_qty),
    parsed_quantity: num(r.parsed_quantity),
    unit_price: num(r.unit_price),
    emoji: text(r.emoji),
    extracted_emoji: text(r.extracted_emoji),
    emoji_master: text(r.emoji_master),
    addressclean: text(r.addressclean),
    parsed_location_only: text(r.parsed_location_only ?? r.parsedLocationOnly),
    address_display_packer: text(r.address_display_packer),
    short_address: text(r.short_address),
    full_address_backup_1: text(r.full_address_backup_1),
    full_address_backup_2: text(r.full_address_backup_2),
    address_candidates: arr(r.address_candidates),
    final_address_for_bill: text(r.final_address_for_bill),
    cod_check_status: text(r.cod_check_status),
    sniper_x_text_clean: text(r.sniper_x_text_clean),
    clean_text: text(r.clean_text),
    single_cleaned_block: text(r.single_cleaned_block),
    lock_status: text(r.lock_status),
    warning_text: text(r.warning_text),
    is_duplicate: bool(r.is_duplicate),
    message_id: text(r.message_id),
    bubble_window: text(r.bubble_window),
    raw_text: text(r.raw_text ?? r.source_text),
    raw_text_with_phone: text(r.raw_text_with_phone),
    full_chunk_text: text(r.full_chunk_text),
    chat_timeline: arr(r.chat_timeline),
    final_display_for_packer: text(r.final_display_for_packer ?? r.display_for_packer),
    audit_status: text(r.audit_status),
    audit_flags: text(r.audit_flags),
    audit_badge: text(r.audit_badge),
    parser_mode: text(r.parser_mode),
    is_ready_to_pack: bool(r.is_ready_to_pack),
    sen_status: text(r.sen_status),
    telegram_status: text(r.telegram_status),
    line_status: text(r.line_status),
    messenger_status: text(r.messenger_status),
    stock_status: text(r.stock_status),
    is_out_of_stock: bool(r.is_out_of_stock),
    telegram_message: text(r.telegram_message),
    telegram_chat_id: text(r.telegram_chat_id),
    detected_products: arr(r.detected_products),
    debug_block: text(r.debug_block),
    debug_prod: text(r.debug_prod),
    warning_tag: text(r.warning_tag),
    repair_log: text(r.repair_log),
    items_json: r.items_json ?? null,
    items_text: text(r.items_text),
    items_count: num(r.items_count) ?? orderItems.length,
    telegram_final_payload: r.telegram_final_payload ?? null,
    line_total: num(r.line_total),
    match_status: text(r.match_status ?? r.mapping_status),
    match_confidence: num(r.match_confidence),
    match_method: text(r.match_method),
    evidence_sources: arr(r.evidence_sources),
    candidate_skus: arr(r.candidate_skus),
    source_actor_type: text(r.source_actor_type),
    raw_text_with_phone_timed: text(r.raw_text_with_phone_timed),
    has_phone: bool(r.has_phone ?? r.phone),
    has_cod: bool(r.has_cod ?? r.cod_amount),
    telegram_sent: bool(r.telegram_sent),
    order_number_display: text(r.order_number_display ?? r.order_number),
    status_color: text(r.status_color),
    day_emoji: text(r.day_emoji),
    telegram_body: obj(r.telegram_body),
    telegram_text: text(r.telegram_text ?? r.telegram_message),
    telegram_copy_text: text(r.telegram_copy_text),
    mapped_product_lines: text(r.mapped_product_lines),
    packer_pick_text: text(r.packer_pick_text),
    routing_tag: text(r.routing_tag),
    routing_group: text(r.routing_group),
    route_codes: arr(r.route_codes),
    alert_codes: arr(r.alert_codes),
    event_key: text(r.event_key),
    catalog_status: text(r.catalog_status),
    catalog_count: num(r.catalog_count) ?? 0,
    catalog_source: text(r.catalog_source),
    catalog_fallback_enabled: bool(r.catalog_fallback_enabled),
    item_count: num(r.item_count) ?? orderItems.length,
    total_quantity: num(r.total_quantity) ?? orderItems.reduce((sum, line) => sum + (line.quantity ?? 0), 0),
    matched_count: num(r.matched_count) ?? 0,
    review_count: num(r.review_count) ?? 0,
    unmatched_count: num(r.unmatched_count) ?? 0,
    matched_ratio: num(r.matched_ratio),
    calculated_items_total: num(r.calculated_items_total),
    matcher_status: text(r.matcher_status),
    matcher_version: text(r.matcher_version),
    source_payload: sourcePayload,
    payload_snapshot: { ...r, source_payload: undefined },
    order_items: orderItems,
    order_items_preserved: orderItems,
    normalizer: obj(r.normalizer ?? sourcePayload._normalizer),
    ingested_at: r.ingested_at ?? new Date().toISOString(),
    created_at: r.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

return input;
