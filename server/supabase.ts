export type LiveOrderItem = { id?: number; order_id?: number | null; product_id?: number | null; sku?: string | null; th_name?: string | null; product_name?: string | null; label_display?: string | null; emoji?: string | null; extracted_emoji?: string | null; display_for_packer?: string | null; telegram_final_mapped?: string | null; quantity?: number | null; qty?: number | null; extracted_qty?: number | null; unit_price?: number | null; expected_cod?: number | null; stock_qty?: number | null; stock_status?: string | null; raw_product_text?: string | null; raw_product_text_norm?: string | null; mapping_status?: string | null; parser_confidence?: number | null; match_method?: string | null; candidate_skus?: unknown; evidence_sources?: unknown; reject_reason?: string | null };
export type LiveOrder = { id: number; upsert_key: string | null; order_number: string; order_date: string | null; order_time: string | null; order_time_display?: string | null; created_at: string | null; updated_at: string | null; customer_name: string | null; facebook_name: string | null; phone: string | null; full_address: string | null; address_line_1?: string | null; address_line_2?: string | null; district?: string | null; amphoe?: string | null; province?: string | null; zipcode?: string | null; address_display_packer: string | null; page_name: string | null; page_id: string | null; thread_id: string | null; threadId: string | null; recipient_id: string | null; cod_amount: number | null; expected_cod: number | null; sku: string | null; th_name: string | null; emoji: string | null; display_for_packer: string | null; label_display: string | null; telegram_status: string | null; order_status: string | null; audit_status: string | null; audit_flags: string | null; cod_check_status: string | null; is_ready_to_pack: boolean; telegram_message: string | null; telegram_copy_text: string | null; telegram_chat_id: string | null; source_text: string | null; raw_text_with_phone: string | null; raw_text_with_phone_timed: string | null; full_chunk_text: string | null; chat_timeline: string[]; items_json?: unknown; items_text?: string | null; items_count?: number | null; total_quantity?: number | null; items: LiveOrderItem[] };
export type LiveOrderStats = { total: number; mapped: number; review: number; codCheck: number; sent: number; pages: number };
export type LiveThread = { key: string; pageName: string; pageId: string | null; threadId: string | null; customerId: string | null; latestAt: string | null; latestOrderNumber: string; customerName: string | null; preview: string; orderCount: number; unread: boolean; sentCount: number; messageCount: number; customerMessages: number; pageMessages: number; orderSignals: number; snippets: string[]; orders: LiveOrder[]; chatTimeline: string[]; searchText: string };
export type ExternalChatMessage = { id: number; providerMessageId: string | null; source_message_id?: string | null; dedupe_key?: string | null; pageId: string; pageName: string | null; threadId: string; senderId: string; senderName: string | null; customerName: string | null; sender_name?: string | null; customer_name?: string | null; speaker_type?: string; senderType: "customer" | "page"; side: "left" | "right"; direction: "inbound" | "outbound"; text: string | null; message_text?: string | null; attachmentsJson: string | null; occurredAt: string | null; occurred_at?: string | null; source_created_at?: string | null; createdAt: string | null };
export type LiveProductMapping = { sku: string; label: string; price: number | null; emoji: string | null; aliases?: string | null };
export type StockProduct = LiveProductMapping & { id: number; thName: string | null; stockQty: number | null; stockStatus: string | null; status: string | null; updatedAt: string | null };
export type StockWarning = { kind: "duplicate_sku" | "missing_sku"; sku: string | null; label: string | null; count?: number };

type SupabaseProject = "main" | "tracking" | "chat" | "parcel";
function config(project: SupabaseProject = "main") {
  const lane = project === "chat" ? "chat" : project === "parcel" ? "parcel" : project;
  const laneUrl = lane === "chat"
    ? process.env.CHAT_SUPABASE_URL
    : lane === "parcel"
      ? process.env.PARCEL_SUPABASE_URL
      : lane === "tracking"
        ? process.env.TRACKING_SUPABASE_URL
        : process.env.ORDER_SUPABASE_URL;
  const laneKey = lane === "chat"
    ? process.env.CHAT_SUPABASE_SERVICE_ROLE_KEY
    : lane === "parcel"
      ? process.env.PARCEL_SUPABASE_SERVICE_ROLE_KEY
      : lane === "tracking"
        ? process.env.TRACKING_SUPABASE_SERVICE_ROLE_KEY
        : process.env.ORDER_SUPABASE_SERVICE_ROLE_KEY;
  // New lanes are additive. Until their Render variables exist, keep the
  // existing Tracking connection working without a data or route migration.
  const rawUrl = laneUrl?.trim() || (lane === "chat" || lane === "parcel" ? process.env.TRACKING_SUPABASE_URL?.trim() : undefined) || (lane === "chat" ? process.env.MAIN_ORDER_SUPABASE_URL?.trim() || process.env.ORDER_SUPABASE_URL?.trim() : undefined) || process.env.SUPABASE_URL?.trim();
  const key = laneKey?.trim() || (lane === "chat" || lane === "parcel" ? process.env.TRACKING_SUPABASE_SERVICE_ROLE_KEY?.trim() : undefined) || (lane === "chat" ? process.env.MAIN_ORDER_SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.ORDER_SUPABASE_SERVICE_ROLE_KEY?.trim() : undefined) || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!rawUrl || !key) throw new Error(`Supabase ${project} secrets are not configured`);
  let parsed: URL;
  try { parsed = new URL(rawUrl); } catch { throw new Error("SUPABASE_URL is not a valid URL"); }
  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".supabase.co")) throw new Error(`Invalid Supabase hostname: ${parsed.hostname}`);
  return { baseUrl: parsed.toString().replace(/\/$/, ""), key };
}
export async function supabaseGet<T>(path: string, project: SupabaseProject = "main"): Promise<T> {
  const { baseUrl, key } = config(project);
  const target = `${baseUrl}/rest/v1/${path.replace(/^\/+/, "")}`;
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(target, { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json", "Cache-Control": "no-cache" } });
      const body = await response.text();
      if (!response.ok) throw new Error(`Supabase returned HTTP ${response.status} for ${path}: ${body.slice(0, 500)}`);
      try { return JSON.parse(body) as T; } catch { throw new Error(`Supabase returned non-JSON for ${path}: ${body.slice(0, 300)}`); }
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, attempt * 500));
    }
  }
  throw new Error(`Supabase connection failed after 3 attempts (${path}): ${lastError instanceof Error ? lastError.message : String(lastError)}. Target=${target}`);
}
export async function supabasePost<T>(path: string, body: unknown, project: SupabaseProject = "main", prefer?: string): Promise<T> { const { baseUrl, key } = config(project); const headers: Record<string, string> = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" }; if (prefer) headers.Prefer = prefer; const response = await fetch(`${baseUrl}/rest/v1/${path}`, { method: "POST", headers, body: JSON.stringify(body) }); if (!response.ok) throw new Error(`Supabase returned HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`); return response.json() as Promise<T>; }
export async function recordOutgoingChatMessage(input: { portalKey?: string; chatLinkKey?: string; pageId: string; pageName?: string; threadId: string; recipientId: string; messageId?: string; text?: string; occurredAt?: Date }) {
  const occurredAt = input.occurredAt ?? new Date();
  const iso = occurredAt.toISOString();
  const messageId = input.messageId?.trim() || null;
  const chatLinkKey = input.chatLinkKey?.trim() || `${input.pageId}_t_${input.threadId}`;
  const payload = { chat_link_key: chatLinkKey, page_id: input.pageId, page_name: input.pageName?.trim() || null, portal_key: input.portalKey?.trim() || null, thread_id: input.threadId, recipient_id: input.recipientId, message_id: messageId, speaker: "page", is_sent: true, time: iso, occurred_at: iso, message_time_display: iso, message_text: input.text?.trim() || null, page_latest_message: input.text?.trim() || null, page_message_time_th: iso, sync_status: "SENT", dedupe_key: messageId ? `${chatLinkKey}:${messageId}` : `${chatLinkKey}:${iso}` };
  const pageMessagePayload = { chat_link_key: chatLinkKey, page_id: input.pageId, page_name: input.pageName?.trim() || null, portal_key: input.portalKey?.trim() || null, thread_id: input.threadId, recipient_id: input.recipientId, sender_id: input.pageId, sender_name: input.pageName?.trim() || null, speaker_type: "page", speaker: "page", side: "right", is_sent: true, message_id: messageId, message_text: input.text?.trim() || null, time: iso, occurred_at: iso, dedupe_key: messageId ? `${chatLinkKey}:${messageId}` : `${chatLinkKey}:${iso}` };
  // Always append each outgoing reply; no upsert/unique-key requirement.
  try { await supabasePost<Record<string, unknown>[]>("chat_page_messages", pageMessagePayload, "chat", "return=representation"); }
  catch (error) { console.error("[chat] canonical page-message write failed", error); }
  const relation = encodeURIComponent("🧿BB_xXx_ORDERCONTROL");
  return supabasePost<Record<string, unknown>[]>(relation, payload, "chat", "return=representation");
}
export async function fetchParcelMappingQueue(input: { status: "all" | "sent"; limit: number }) {
  // These are quoted PostgreSQL relation names; keep the space after the emoji.
  // n8n owns the pipeline mutations. This room only reads the queue and history.
  const activeView = encodeURIComponent("🦅ROGUE_xXx_SHIPPINGz");
  const sentView = encodeURIComponent("📓DEAD_xXx_NOTE");
  const activeQuery = `select=*&limit=${input.limit}`;
  const sentQuery = `select=*&limit=${input.limit}`;
  const active = input.status === "sent" ? [] : await supabaseGet<Array<Record<string, unknown>>>(`${activeView}?${activeQuery}`, "parcel");
  const sent = input.status === "sent" ? await supabaseGet<Array<Record<string, unknown>>>(`${sentView}?${sentQuery}`, "parcel") : [];
  return [...active, ...sent].slice(0, input.limit);
}
export async function purgeOldParcels() {
  const deleted = await supabasePost<number>("rpc/bb_purge_old_parcels_3day", {}, "parcel");
  return { deleted: Number(deleted) || 0 };
}
function text(v: unknown) { return v == null ? null : String(v); }
function num(v: unknown) { const n = Number(v); return v == null || v === "" || !Number.isFinite(n) ? null : n; }
function bool(v: unknown) { return v === true || v === "true" || v === 1; }
function timeline(v: unknown) { if (Array.isArray(v)) return v.map(String).filter(Boolean); if (typeof v === "string" && v.trim()) { try { const parsed = JSON.parse(v); if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean); } catch {} return v.split("\n").map(s => s.trim()).filter(Boolean); } return []; }
function normalizeItem(r: Record<string, unknown>): LiveOrderItem { return { id: num(r.id) ?? undefined, order_id: num(r.order_id), product_id: num(r.product_id), sku: text(r.sku), th_name: text(r.th_name), product_name: text(r.product_name), label_display: text(r.label_display), emoji: text(r.emoji), extracted_emoji: text(r.extracted_emoji), display_for_packer: text(r.display_for_packer), telegram_final_mapped: text(r.display_for_packer), quantity: num(r.quantity), qty: num(r.quantity), extracted_qty: num(r.extracted_qty), unit_price: num(r.unit_price), expected_cod: num(r.expected_cod), mapping_status: text(r.mapping_status), stock_qty: num(r.stock_qty), stock_status: text(r.stock_status), raw_product_text: text(r.raw_product_text), raw_product_text_norm: text(r.raw_product_text_norm), parser_confidence: num(r.parser_confidence), match_method: text(r.match_method), candidate_skus: r.candidate_skus, evidence_sources: r.evidence_sources, reject_reason: text(r.reject_reason) }; }
function normalizeOrder(r: Record<string, unknown>, items: LiveOrderItem[]): LiveOrder { const sourcePayload = (() => { if (r.source_payload && typeof r.source_payload === "object") return r.source_payload as Record<string, unknown>; if (typeof r.source_payload === "string") { try { const parsed = JSON.parse(r.source_payload); return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {}; } catch { return {}; } } return {}; })(); const raw = text(r.source_text ?? r.clean_text ?? sourcePayload.raw_text); const chat = timeline(r.chat_timeline ?? sourcePayload.chat_timeline ?? raw); const thread = text(r.source_chat_id); const cod = num(r.cod_amount) ?? num(r.expected_cod); const orderTime = text(r.order_time); return { id: num(r.id) ?? 0, upsert_key: text(r.upsert_key), order_number: text(r.order_number) ?? `#${r.id ?? "unknown"}`, order_date: orderTime?.slice(0, 10) ?? text(r.created_at)?.slice(0, 10) ?? null, order_time: orderTime, order_time_display: text(r.order_time_display), created_at: text(r.created_at), updated_at: text(r.updated_at), customer_name: text(r.customer_name ?? r.facebook_name), facebook_name: text(r.facebook_name), phone: text(r.phone), full_address: text(r.full_address), address_line_1: text(r.address_line_1), address_line_2: text(r.address_line_2), district: text(r.district), amphoe: text(r.amphoe), province: text(r.province), zipcode: text(r.zipcode), address_display_packer: text(r.full_address), page_name: text(r.page_name), page_id: text(r.page_id), thread_id: thread, threadId: thread, recipient_id: text(r.recipient_id), cod_amount: cod, expected_cod: num(r.expected_cod) ?? cod, sku: items[0]?.sku ?? null, th_name: items[0]?.th_name ?? null, emoji: items[0]?.emoji ?? null, display_for_packer: items.map(i => i.display_for_packer ?? i.label_display ?? i.product_name ?? i.raw_product_text ?? i.sku ?? "").filter(Boolean).join("\n") || null, label_display: items[0]?.label_display ?? null, telegram_status: text(r.view_status), order_status: text(r.order_status), audit_status: text(r.mapping_status), audit_flags: text(r.warning_text), cod_check_status: text(r.cod_check_status) ?? (cod == null ? "CHECK" : "PASS"), is_ready_to_pack: text(r.mapping_status) === "MATCHED" && text(r.order_status) === "READY", telegram_message: text(r.telegram_body_view), telegram_copy_text: text(r.telegram_body_view), telegram_chat_id: text(r.telegram_view_chat_id), source_text: raw, raw_text_with_phone: raw, raw_text_with_phone_timed: raw, full_chunk_text: raw, chat_timeline: chat, items_json: items, items_text: items.map(i => i.display_for_packer ?? i.product_name ?? i.raw_product_text ?? i.sku ?? "").join("\n"), items_count: items.length, total_quantity: items.reduce((s, i) => s + Number(i.quantity ?? 0), 0), items }; }
function parseObjectArray(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item));
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item));
      if (parsed && typeof parsed === "object" && Array.isArray((parsed as any).items)) return (parsed as any).items.filter((item: unknown) => Boolean(item) && typeof item === "object" && !Array.isArray(item));
    } catch { /* plain text is handled by the HERMES row fallback below */ }
  }
  return [];
}
function hermesItems(row: Record<string, unknown>): LiveOrderItem[] {
  for (const value of [row.product_items_matched, row.product_items_v5, row.product_map_items, row.orderItems]) {
    const parsed = parseObjectArray(value);
    if (parsed.length) return parsed.map(normalizeItem);
  }
  const product = text(row.final_display_for_packer ?? row.order_fibo_product ?? row.for_packer_st_display ?? row.manus_for_packer ?? row.google_for_packer ?? row.telegram_product_display);
  if (!product && !row.sku) return [];
  return [normalizeItem({
    sku: row.master_sku ?? row.sku,
    th_name: row.trusted_product ?? row.final_product ?? row.sku,
    product_name: product,
    display_for_packer: product,
    quantity: row.final_order_qty ?? row.extracted_text_qty ?? row.qty_display_th,
    mapping_status: row.mapping_status ?? row.product_mapping_status,
    expected_cod: row.expected_cod,
  })];
}
function stableOrderId(key: unknown, index: number) {
  const source = String(key ?? "");
  if (!source) return index + 1;
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) hash = (hash * 31 + source.charCodeAt(i)) | 0;
  return Math.abs(hash) || index + 1;
}
async function orderRows(limit = 3000) {
  const relation = encodeURIComponent("🗝️HERMES_ARCHIVE");
  return supabaseGet<Array<Record<string, unknown>>>(`${relation}?select=*&order=order_time_display.desc.nullslast&limit=${limit}`);
}
export async function fetchLiveOrders(search?: string) {
  const response = await orderRows();
  const rows = Array.isArray(response)
    ? response.filter((row): row is Record<string, unknown> => row !== null && typeof row === "object" && !Array.isArray(row))
    : [];
  const q = search?.trim().toLowerCase();
  return rows.map((row, index) => {
    const items = hermesItems(row);
    const eligible = bool(row.send_eligible) || bool(row.telegram_bill_send_eligible) || bool(row.bill_data_complete);
    const viewRow = {
      ...row,
      id: num(row.id) ?? stableOrderId(row.upsert_key, index),
      source_chat_id: row.source_chat_id ?? row.threadId ?? row.thread_id,
      source_text: row.source_text ?? row.original ?? row.telegram_copy_text ?? row.telegram_message,
      full_address: row.final_address_for_bill ?? row.full_address ?? row.address_display_packer ?? row.addressclean,
      order_status: eligible ? "READY" : row.life_status ?? row.status_color ?? row.routing_tag,
      mapping_status: row.mapping_status ?? row.product_mapping_status ?? (eligible ? "MATCHED" : null),
      view_status: row.telegram_status ?? row.delivery_state ?? row.delivery_status,
      telegram_body_view: row.telegram_message_for_send_final ?? row.telegram_main_bill ?? row.telegram_body ?? row.telegram_copy_text ?? row.telegram_message,
    };
    return normalizeOrder(viewRow, items);
  }).filter(order => !q || JSON.stringify(order).toLowerCase().includes(q));
}
export function getLiveOrderStats(orders: LiveOrder[]): LiveOrderStats { const safeOrders = Array.isArray(orders) ? orders.filter((order): order is LiveOrder => order !== null && typeof order === "object") : []; return { total: safeOrders.length, mapped: safeOrders.filter(o => o.is_ready_to_pack).length, review: safeOrders.filter(o => !o.is_ready_to_pack).length, codCheck: safeOrders.filter(o => o.cod_check_status !== "PASS").length, sent: safeOrders.filter(o => String(o.telegram_status ?? "").toUpperCase() === "SENT").length, pages: new Set(safeOrders.map(o => o.page_id).filter(Boolean)).size }; }
export async function fetchLiveThreads(search?: string) { const orders = await fetchLiveOrders(search); const map = new Map<string, LiveThread>(); for (const order of orders) { const key = `${order.page_id ?? ""}:${order.thread_id ?? order.order_number}`; const current = map.get(key) ?? { key, pageName: order.page_name ?? "ไม่ระบุเพจ", pageId: order.page_id, threadId: order.thread_id, customerId: order.recipient_id ?? null, latestAt: order.created_at, latestOrderNumber: order.order_number, customerName: order.customer_name, preview: order.source_text ?? order.display_for_packer ?? "", orderCount: 0, unread: false, sentCount: 0, messageCount: 0, customerMessages: 0, pageMessages: 0, orderSignals: 0, snippets: [], orders: [], chatTimeline: [], searchText: "" }; current.orders.push(order); current.orderCount++; current.messageCount += order.chat_timeline.length; current.customerMessages = (current.customerMessages ?? 0) + order.chat_timeline.filter(x => !/เพจ|admin|แอดมิน/i.test(x)).length; current.pageMessages = (current.pageMessages ?? 0) + order.chat_timeline.filter(x => /เพจ|admin|แอดมิน/i.test(x)).length; current.orderSignals = current.orderCount; current.snippets = [...(current.snippets ?? []), ...order.chat_timeline.slice(0, 3)]; current.chatTimeline.push(...order.chat_timeline); current.searchText += ` ${order.customer_name ?? ""} ${order.source_text ?? ""} ${order.order_number}`; map.set(key, current); } return Array.from(map.values()).sort((a, b) => String(b.latestAt).localeCompare(String(a.latestAt))); }
export async function fetchExternalChatMessages(pageId: string, threadId: string): Promise<ExternalChatMessage[]> { const orders = (await fetchLiveOrders()).filter(o => o.page_id === pageId && o.thread_id === threadId); return orders.flatMap(o => o.chat_timeline.map((line, i) => { const outbound = /เพจ|admin|แอดมิน/i.test(line); return { id: o.id * 10000 + i, providerMessageId: null, pageId, pageName: o.page_name, threadId, senderId: o.recipient_id ?? "", senderName: o.customer_name, customerName: o.customer_name, sender_name: o.customer_name, customer_name: o.customer_name, speaker_type: outbound ? "page" : "customer", senderType: outbound ? "page" : "customer", side: outbound ? "right" : "left", direction: outbound ? "outbound" : "inbound", text: line, message_text: line, attachmentsJson: null, occurredAt: o.order_time, occurred_at: o.order_time, source_created_at: o.created_at, createdAt: o.created_at, source_message_id: null, dedupe_key: `:` }; })); }
export async function fetchConversationEvidence(pageId: string, threadId: string) { return fetchExternalChatMessages(pageId, threadId); }
export async function fetchDailyChatOrderSummary(date: string) { const orders = await fetchDailyOrderHistory(date); const threads = await fetchLiveThreads(); const dayThreads = threads.filter(t => t.orders.some(o => o.order_date === date)); return { date, total: orders.total, orders: orders.orders, threads: dayThreads, totalMessages: dayThreads.reduce((s, t) => s + t.messageCount, 0), customerMessages: dayThreads.reduce((s, t) => s + t.chatTimeline.filter(x => !/เพจ|admin|แอดมิน/i.test(x)).length, 0), pageMessages: dayThreads.reduce((s, t) => s + t.chatTimeline.filter(x => /เพจ|admin|แอดมิน/i.test(x)).length, 0), threadCount: dayThreads.length, orderSignalThreads: dayThreads.filter(t => t.orderCount > 0).length }; }
export async function fetchDailyOrderHistory(date: string, search?: string) { const orders = (await fetchLiveOrders(search)).filter(o => (o.order_date ?? o.created_at?.slice(0, 10)) === date); return { date, total: orders.length, orders }; }
export async function fetchStockProducts(): Promise<StockProduct[]> { const products = await supabaseGet<Array<Record<string, unknown>>>("product_master?select=*&order=sku.asc&limit=5000"); const [inventoryResult, aliasesResult] = await Promise.allSettled([supabaseGet<Array<Record<string, unknown>>>("inventory?select=*&limit=5000"), supabaseGet<Array<Record<string, unknown>>>("product_aliases?select=*&mapping_status=eq.APPROVED&limit=10000")]); const inventory = inventoryResult.status === "fulfilled" ? inventoryResult.value : []; const aliases = aliasesResult.status === "fulfilled" ? aliasesResult.value : []; const inv = new Map(inventory.map(r => [String(r.product_id), r])); const alias = new Map<string, string>(); for (const a of aliases) { const k = String(a.product_id); alias.set(k, [...(alias.get(k)?.split(", ") ?? []), String(a.alias_text ?? "")].filter(Boolean).join(", ")); } return products.map(r => { const i = inv.get(String(r.id)); return { id: Number(r.id), sku: String(r.sku ?? ""), label: String(r.label_display ?? r.display_for_packer ?? r.name_standard ?? r.sku ?? ""), price: num(r.unit_price), emoji: text(r.emoji), aliases: alias.get(String(r.id)) ?? null, thName: text(r.th_name), stockQty: num(i?.stock_qty), stockStatus: text(i?.stock_status), status: text(r.status), updatedAt: text(i?.updated_at ?? r.updated_at) }; }); }
export async function fetchStockWarnings(): Promise<StockWarning[]> { const p = await supabaseGet<Array<Record<string, unknown>>>("product_master?select=sku,th_name,label_display&limit=5000"); const seen = new Set<string>(); const warnings: StockWarning[] = []; for (const r of p) { const sku = text(r.sku); if (!sku) warnings.push({ kind: "missing_sku", sku: null, label: text(r.th_name ?? r.label_display) }); else if (seen.has(sku)) warnings.push({ kind: "duplicate_sku", sku, label: text(r.th_name ?? r.label_display) }); else seen.add(sku); } return warnings; }
export async function updateStockProduct(id: number, input: { stockQty?: number; stockStatus?: string; labelDisplay?: string; unitPrice?: number }) { const { baseUrl, key } = config(); if (input.labelDisplay !== undefined || input.unitPrice !== undefined) { const body: Record<string, unknown> = {}; if (input.labelDisplay !== undefined) body.label_display = input.labelDisplay; if (input.unitPrice !== undefined) body.unit_price = input.unitPrice; await fetch(`${baseUrl}/rest/v1/product_master?id=eq.${id}`, { method: "PATCH", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify(body) }); } if (input.stockQty !== undefined || input.stockStatus !== undefined) { const body: Record<string, unknown> = {}; if (input.stockQty !== undefined) body.stock_qty = input.stockQty; if (input.stockStatus !== undefined) body.stock_status = input.stockStatus; await fetch(`${baseUrl}/rest/v1/inventory?product_id=eq.${id}`, { method: "PATCH", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify(body) }); } return fetchStockProducts(); }
export async function updateProductMapAlias(sku: string, alias: string) { const products = await supabaseGet<Array<{ id: number }>>(`product_master?select=id&sku=eq.${encodeURIComponent(sku)}&limit=1`); const product = products[0]; if (!product) throw new Error(`SKU not found: ${sku}`); const { baseUrl, key } = config(); await fetch(`${baseUrl}/rest/v1/product_aliases`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ product_id: product.id, alias_text: alias.trim(), alias_norm: alias.trim().toLowerCase(), mapping_status: "APPROVED" }) }); return { ok: true, sku, alias: alias.trim() }; }
export async function fetchOrdersForThread(pageId: string, threadId: string) { return (await fetchLiveOrders()).filter(o => o.page_id === pageId && o.thread_id === threadId); }

export type ProductAlienTerm = Record<string, unknown>;
export async function listProductAlienTerms(search = "") {
  const filter = search.trim() ? `&or=(raw_text.ilike.*${encodeURIComponent(search.trim())}*,alias_text.ilike.*${encodeURIComponent(search.trim())}*,order_number.ilike.*${encodeURIComponent(search.trim())}*)` : "";
  return supabaseGet<ProductAlienTerm[]>(`product_alien_terms?select=*&order=created_at.desc&limit=500${filter}`);
}
export async function createProductAlienTerm(input: ProductAlienTerm) {
  return supabasePost<ProductAlienTerm>("product_alien_terms", { ...input, raw_text: String(input.raw_text ?? ""), mapping_status: input.mapping_status ?? "REVIEW" });
}
export async function listProductAlienMapReviews() {
  return supabaseGet<ProductAlienTerm[]>("product_alien_map_reviews?select=*&order=created_at.desc&limit=500");
}
export async function createProductAlienMapReview(input: ProductAlienTerm) {
  return supabasePost<ProductAlienTerm>("product_alien_map_reviews", { ...input, raw_text: String(input.raw_text ?? ""), mapping_status: input.mapping_status ?? "REVIEW" });
}
export async function listCanonicalAliases() { return supabaseGet<Array<Record<string, unknown>>>("product_aliases?select=*&order=updated_at.desc&limit=10000"); }
export async function createCanonicalAlias(input: { alias: string; canonicalSku: string; canonicalLabel: string }) { const products = await supabaseGet<Array<{ id: number }>>(`product_master?select=id&sku=eq.${encodeURIComponent(input.canonicalSku)}&limit=1`); const product = products[0]; if (!product) throw new Error(`SKU not found: ${input.canonicalSku}`); await supabasePost("product_aliases", { product_id: product.id, alias_text: input.alias.trim(), alias_norm: input.alias.trim().toLowerCase(), mapping_status: "APPROVED", note: input.canonicalLabel }); return listCanonicalAliases(); }
export async function updateCanonicalAlias(input: { id: number; alias: string; canonicalSku: string; canonicalLabel: string; isActive?: boolean }) { const products = await supabaseGet<Array<{ id: number }>>(`product_master?select=id&sku=eq.${encodeURIComponent(input.canonicalSku)}&limit=1`); const { baseUrl, key } = config(); const body = { product_id: products[0]?.id ?? null, alias_text: input.alias.trim(), alias_norm: input.alias.trim().toLowerCase(), mapping_status: input.isActive === false ? "REJECTED" : "APPROVED", note: input.canonicalLabel }; await fetch(`${baseUrl}/rest/v1/product_aliases?id=eq.${input.id}`, { method: "PATCH", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify(body) }); return listCanonicalAliases(); }
