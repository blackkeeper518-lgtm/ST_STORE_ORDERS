import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const CONFIG_KEY = "manus3-supabase-config";
export type SupabaseConfig = { url: string; anonKey: string; orderTable?: string };
let client: SupabaseClient | null = null;
let clientSignature = "";
export function getSupabaseConfig(): SupabaseConfig | null { try { const raw = localStorage.getItem(CONFIG_KEY); if (!raw) return null; const value = JSON.parse(raw) as Partial<SupabaseConfig>; if (!value.url || !value.anonKey) return null; return { url: value.url.replace(/\/$/, ""), anonKey: value.anonKey, orderTable: value.orderTable || "canonical_orders" }; } catch { return null; } }
export function saveSupabaseConfig(config: SupabaseConfig) { const clean = { url: config.url.trim().replace(/\/$/, ""), anonKey: config.anonKey.trim(), orderTable: config.orderTable?.trim() || "canonical_orders" }; localStorage.setItem(CONFIG_KEY, JSON.stringify(clean)); client = null; clientSignature = ""; }
export function clearSupabaseConfig() { localStorage.removeItem(CONFIG_KEY); client = null; clientSignature = ""; }
export function getSupabase() { const config = getSupabaseConfig(); if (!config) return null; const signature = `${config.url}|${config.anonKey}`; if (!client || signature !== clientSignature) { client = createClient(config.url, config.anonKey); clientSignature = signature; } return client; }
export const supabase = { from: (table: string) => { const api = getSupabase(); if (!api) throw new Error("ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key"); return api.from(table); } } as any;
function fail(error: any): never { throw new Error(error?.message || "Supabase connection failed"); }
function num(v: any) { const n = Number(v); return v == null || v === "" || !Number.isFinite(n) ? null : n; }
function asText(v: any) { return typeof v === "string" ? v : v == null ? "" : JSON.stringify(v); }
function parseCod(text: string) { const matches = text.match(/(?:ยอดรวม\s*)?cod\s*[:=]?\s*\[?\s*([\d,]+(?:\.\d+)?)\s*\]?|เก็บปลายทาง[^\d]{0,20}([\d,]+(?:\.\d+)?)/gi) || []; const last = matches[matches.length - 1] || ""; const numberMatch = last.match(/[\d,]+(?:\.\d+)?/); return numberMatch ? Number(numberMatch[0].replace(/,/g, "")) : null; }
const CORE_SIGNATURE = ["🚨 [สถานะ: ปิดยอดสำเร็จ!]", "[สรุปรายการสั่งซื้อ]", "⚡FLASH EXPRESS", "COD", "📍ที่อยู่จัดส่ง:", "✅:", "🟡MOND GOLD:", "🆔เลขที่ออเดอร์: ORD-2606:", "📱 เบอร์:", "📮 รหัสไปรษณีย์:", "👤 ชื่อ:", "💰 COD:", "เขียว:", "สรุปรายการสั่งซื้อ", "เลขที่ออเดอร์", "ที่อยู่จัดส่ง", "ORD-", "📦 รายการสินค้า:", "คอต.", "ยอดรวม"];
const FLOW_SIGNATURES = [
  "🚨[สถานะ:ปิดยอดสำเร็จ]",
  "🦁[สรุปรายการสั่งซื้อ]สิงโตสโตร์ ↠",
  "🆔 เลขที่ออเดอร์: ORD-2606",
  "⏰ เวลาสั่งซื้อ:",
  "💰 ยอดรวมCOD:",
  "━━━━━━━━━━━━━━━━",
  "👤ชื่อ:",
  "📱เบอร์โทรศัพท์:",
  "📍ที่อยู่จัดส่ง:",
  "📮รหัสไปรษณีย์:",
  "📦 รายการสินค้า:",
  "🚚 ขนส่ง: ⚡FLASH EXPRESS💨",
  "#BellaAgent",
  "#SINGTO_ORDER"
];
const FLOW_SIGNALS = ["เบลล่า", "Bella", "#MilaAgent", "#BellaAgent", "Agent", "#Agent", "BellaAgent", "MilaAgent", "Mila", "#GinaAgent", "Gina", "#LemonAgent", "Lemon", "จีน่า", "เลม่อน", "มิล่า", "สรุปโดย:🤖"];
const PRODUCT_LINE_SIGNAL = /(?:📦\s*)?รายการสินค้า|(?:🟢|🟡|🔴|🟠|🟣|🔵|🟩|🟨|🟥|🟧|🟪|🟦|🍉|🥭)\s*[A-Z_ก-๙]+.*?คอต\.?/i;
function normalizeFlowText(value: string) { return String(value || "").toLowerCase().replace(/[\s:：|]/g, ""); }
function scoreDailyOrderSignal(text: string, latestCod: number | null) {
  const value = String(text || ""); const reasons: string[] = [];
  const lower = value.toLowerCase(); const flowText = normalizeFlowText(value); const core = CORE_SIGNATURE.filter(k => lower.includes(k.toLowerCase())); const flow = FLOW_SIGNALS.filter(k => lower.includes(k.toLowerCase())); const flowSignature = FLOW_SIGNATURES.filter(k => flowText.includes(normalizeFlowText(k))); const productLine = PRODUCT_LINE_SIGNAL.test(value);
  const phone = /(?:เบอร์โทรศัพท์|เบอร์|โทร|tel)\s*[:：.]?\s*\d{9,10}|\b0\d{9}\b/i.test(value); const postal = /\b\d{5}\b/.test(value);
  const address = /(?:ที่อยู่|จัดส่ง|ตำบล|ต\.|อำเภอ|อ\.|จังหวัด|จ\.)/i.test(value); const orderDate = /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b/.test(value) || /order_date|เวลาสั่งซื้อ|วันที่สั่งซื้อ/i.test(value);
  const cod = latestCod ?? parseCod(value); let score = 0;
  if (cod != null) { score += 10; reasons.push("COD " + cod); } if (phone) { score += 3; reasons.push("เบอร์โทร"); } if (postal) { score += 4; reasons.push("รหัสไปรษณีย์"); }
  if (address) { score += 4; reasons.push("ที่อยู่"); } if (orderDate) { score += 5; reasons.push("วันที่/เวลาสั่งซื้อ"); }
  if (core.length) { score += Math.min(core.length * 3, 12); reasons.push("Core " + core.slice(0, 3).join(" | ")); } if (flow.length) { score += Math.min(flow.length * 3, 9); reasons.push("Flow " + flow.slice(0, 3).join(" | ")); } if (flowSignature.length) { score += Math.min(flowSignature.length * 4, 20); reasons.push("Singto " + flowSignature.slice(0, 3).join(" | ")); } if (productLine) { score += 3; reasons.push("บรรทัดสินค้า"); }
  const qualifiedCod = cod != null && cod >= 200; const qualified = score >= 30 || qualifiedCod || core.length > 0 || flow.length > 0 || flowSignature.length > 0;
  return { score, qualified, qualifiedCod, reasons: Array.from(new Set(reasons)), coreCount: core.length, flowCount: flow.length };
}export type CanonicalItem = Record<string, any>;
export type CanonicalOrder = Record<string, any> & { items: CanonicalItem[]; items_text: string; display_for_packer: string | null; is_ready_to_pack: boolean; cod_check_status: string | null; audit_status: string | null; order_status: string | null; telegram_status: string | null };
function currentOrderWindowStart() { const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()); const values = Object.fromEntries(parts.filter(part => part.type !== "literal").map(part => [part.type, Number(part.value)])); return new Date(Date.UTC(values.year, values.month - 1, values.day - 1, 7, 0, 0)).toISOString(); }
function normalizeItem(item: CanonicalItem): CanonicalItem { const master = item.product_master && typeof item.product_master === "object" ? item.product_master : {}; const display = item.display_for_packer_with_qty || item.display_for_packer_master || item.display_for_packer_exact || master.display_for_packer || item.display_for_packer || item.label || item.label_display || master.label_display || item.product_name || item.th_name || master.th_name || item.sku || null; const mapping = item.mapping_status || (item.sku_match_status === "MATCHED_PRODUCT_MASTER" ? "MATCHED" : null); return { ...item, ...master, quantity: num(item.quantity), unit_price: num(item.unit_price_order ?? item.unit_price), expected_cod: num(item.expected_cod), stock_qty: num(item.stock_qty ?? item.inventory?.stock_qty), mapping_status: mapping, display_for_packer: display, label: item.label || item.label_display || master.label_display || display, label_display: item.label_display || item.label || master.label_display || display }; }
function parseJsonArray(value: unknown): CanonicalItem[] { if (Array.isArray(value)) return value as CanonicalItem[]; if (typeof value !== "string") return []; try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
function normalizeOrder(row: any, items: CanonicalItem[]): CanonicalOrder { const normalized = items.map(normalizeItem); const cod = num(row.web_cod_amount) ?? num(row.cod_amount) ?? num(row.raw_cod_amount) ?? num(row.expected_cod); const mapping = row.web_mapping_status || row.mapping_status || (normalized.length > 0 && normalized.every(item => item.mapping_status === "MATCHED") ? "MATCHED" : "CHECK_DATA"); const address = row.web_address_primary || row.address_display_primary || row.full_address || row.address_display_fallback || row.web_address_fallback || row.web_address_short || row.address_line_1 || ""; const productDisplay = normalized.map(i => i.display_for_packer || i.sku || "").filter(Boolean).join("\n") || row.web_product_display || row.product_display_final || row.product_display_primary || row.product_display_fallback || row.product_display_raw || row.display_for_packer || null; return { ...row, full_address: address, address_display_primary: row.web_address_primary || row.address_display_primary || address, address_display_fallback: row.web_address_fallback || row.address_display_fallback || address, items: normalized, mapping_status: mapping, order_number: row.order_number || `#${row.id}`, order_time: row.order_time || row.created_at || null, cod_amount: cod, is_ready_to_pack: row.is_ready_to_pack ?? (mapping === "MATCHED"), cod_check_status: row.cod_check_status ?? (cod == null ? "CHECK" : "PASS"), audit_status: row.audit_status ?? mapping, telegram_status: row.telegram_status ?? null, items_text: productDisplay || "", display_for_packer: productDisplay }; }
export async function readCanonicalOrders(search = "", since = currentOrderWindowStart()) { const api = getSupabase(); if (!api) fail({ message: "ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key" }); const { data: rows, error } = await api.from("vw_orders_web_all_fields").select("*").gte("order_time", since).lte("order_time", new Date().toISOString()).order("order_time", { ascending: false }).limit(3000); if (error) fail(error); const query = search.trim().toLowerCase(); const orders = (rows ?? []).map((row: any) => { const items = parseJsonArray(row.product_items).length ? parseJsonArray(row.product_items) : parseJsonArray(row.web_items_clean).length ? parseJsonArray(row.web_items_clean) : parseJsonArray(row.web_items_all_fields); return normalizeOrder(row, items); }).filter((row: any) => !query || JSON.stringify(row).toLowerCase().includes(query)); return { orders, itemError: null, fetchedAt: new Date().toISOString(), since }; }
export type StockProduct = { id: number; sku: string; label: string; thName: string; emoji: string; price: number | null; stockQty: number; stockStatus: string | null; aliases: string; inventoryId: number | string | null };
export type ProductMapAlias = { id: string; alias: string; canonicalSku: string; canonicalLabel: string; isActive: boolean };

export async function readProductMapAliases(): Promise<ProductMapAlias[]> {
  const api = getSupabase();
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key" });
  const [{ data: rows, error }, { data: products, error: productError }] = await Promise.all([
    api.from("product_map_master").select("*").order("sku"),
    api.from("product_master").select("sku,label_display,display_for_packer,name_standard,th_name,product_name,emoji,unit_price").order("sku")
  ]);
  if (error) fail(error);
  if (productError) fail(productError);
  const masters = new Map((products ?? []).map((p: any) => [String(p.sku ?? '').trim().toLowerCase(), p]));
  const output: ProductMapAlias[] = [];
  for (const row of rows ?? []) {
    const sku = String(row.sku ?? '').trim();
    const master = masters.get(sku.toLowerCase()) ?? {};
    const aliases = [row.alias, row.alias_text].flatMap((v: any) => String(v ?? '').split(/[,\n|]+/)).map((v: string) => v.trim()).filter(Boolean);
    for (const alias of Array.from(new Set(aliases))) output.push({ id: String(row.id ?? sku + ':' + alias), alias, canonicalSku: sku, canonicalLabel: master.label_display ?? master.display_for_packer ?? master.name_standard ?? master.th_name ?? master.product_name ?? sku, isActive: row.is_active !== false });
  }
  return output;
}

export async function readProductMapCatalog() {
  const api = getSupabase();
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key" });
  const { data, error } = await api.from("product_master").select("sku,label_display,display_for_packer,name_standard,th_name,product_name,emoji,unit_price").order("sku");
  if (error) fail(error);
  return (data ?? []).map((p: any) => ({ sku: String(p.sku ?? ''), label: p.label_display ?? p.display_for_packer ?? p.name_standard ?? p.th_name ?? p.product_name ?? p.sku ?? '', emoji: p.emoji ?? '📦', price: num(p.unit_price) }));
}

export async function saveProductMapAlias(input: { alias: string; canonicalSku: string }) {
  const api = getSupabase();
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key" });
  const alias = input.alias.trim(); const sku = input.canonicalSku.trim();
  if (!alias || !sku) throw new Error('ต้องมี Alias และ SKU');
  const { data: existing, error: readError } = await api.from('product_map_master').select('*').eq('sku', sku).maybeSingle();
  if (readError) fail(readError);
  const old = [existing?.alias, existing?.alias_text].flatMap((v: any) => String(v ?? '').split(/[,\n|]+/)).map((v: string) => v.trim()).filter(Boolean);
  const aliases = Array.from(new Set([...old, alias]));
  const payload: any = { sku, alias: aliases.join(', '), alias_text: aliases.join(', '), alias_norm: aliases.map(v => v.toLowerCase().replace(/\s+/g, '')).join(', ') };
  const result = existing?.id != null ? await api.from('product_map_master').update(payload).eq('id', existing.id) : await api.from('product_map_master').insert(payload);
  if (result.error) fail(result.error);
  return { sku, alias, aliases };
}

export async function readStockProducts(): Promise<StockProduct[]> {
  const api = getSupabase();
  if (!api) fail({ message: "ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key" });
  const [{ data: products, error }, { data: inventory, error: inventoryError }, { data: mapRows, error: mapError }] = await Promise.all([
    api.from("product_master").select("*").order("sku"),
    api.from("inventory").select("*"),
    api.from("product_map_master").select("sku,alias,alias_text,alias_norm")
  ]);
  if (error) fail(error);
  if (inventoryError) fail(inventoryError);
  const aliasBySku = new Map<string, string[]>();
  if (!mapError) for (const row of mapRows ?? []) { const sku = String(row.sku ?? "").trim().toLowerCase(); const values = [row.alias, row.alias_text, row.alias_norm].flatMap(value => String(value ?? "").split(/[,\n|]+/)).map(value => value.trim()).filter(Boolean); if (sku && values.length) aliasBySku.set(sku, Array.from(new Set([...(aliasBySku.get(sku) ?? []), ...values]))); }
  const entries: Array<[string, any]> = [];
  for (const row of inventory ?? []) { if (row.product_id != null) entries.push([String(row.product_id), row]); if (row.sku) entries.push([String(row.sku).trim().toLowerCase(), row]); }
  const inv = new Map<string, any>(entries);
  return (products ?? []).map((p: any) => { const sku = String(p.sku ?? "").trim(); const i = inv.get(String(p.id)) ?? inv.get(sku.toLowerCase()); const aliases = aliasBySku.get(sku.toLowerCase()) ?? String(p.aliases ?? p.alias ?? "").split(/[,\n|]+/).map(value => value.trim()).filter(Boolean); return { id: Number(p.id), sku, label: p.label_display ?? p.display_for_packer ?? p.name_standard ?? sku ?? "", thName: p.th_name ?? p.product_name ?? p.name_standard ?? "", emoji: p.emoji ?? "📦", price: num(p.unit_price ?? p.price ?? p.cod_default), stockQty: num(i?.stock_qty ?? i?.quantity ?? p.stock_qty) ?? 0, stockStatus: i?.stock_status ?? p.stock_status ?? null, aliases: Array.from(new Set(aliases)).join(", "), inventoryId: i?.id ?? null }; });
}
export async function updateInventoryStock(input: { productId: number; sku: string; stockQty: number; stockStatus?: "IN_STOCK" | "OUT_OF_STOCK" }) { const api = getSupabase(); if (!api) fail({ message: "ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key" }); const stockQty = Math.max(0, Math.trunc(Number(input.stockQty) || 0)); const stockStatus = input.stockStatus ?? (stockQty > 0 ? "IN_STOCK" : "OUT_OF_STOCK"); const payload = { product_id: input.productId, sku: input.sku, stock_qty: stockQty, stock_status: stockStatus, updated_at: new Date().toISOString() }; const { data: existing, error: findError } = await api.from("inventory").select("id").eq("product_id", input.productId).maybeSingle(); if (findError) fail(findError); if (existing?.id != null) { const { error } = await api.from("inventory").update(payload).eq("id", existing.id); if (error) fail(error); } else { const { error } = await api.from("inventory").insert(payload); if (error) fail(error); } return { ...input, stockQty, stockStatus }; }
export async function setInventoryAvailability(input: { productId: number; sku: string; available: boolean; currentQty: number }) { return updateInventoryStock({ ...input, stockQty: input.available ? Math.max(1, input.currentQty || 1) : 0, stockStatus: input.available ? "IN_STOCK" : "OUT_OF_STOCK" }); }
export async function readDailyOrders(date: string, search = "") { const start = new Date(`${date}T00:00:00+07:00`).toISOString(); const result = await readCanonicalOrders(search, start); const orders = result.orders.filter((o: any) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date(o.order_time ?? o.created_at ?? "")) === date); return { date, orders, total: orders.length }; }
async function readChatRows() { const api = getSupabase(); if (!api) fail({ message: "ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key" }); const [{ data: customers, error: customerError }, { data: pages, error: pageError }] = await Promise.all([api.from("chat_customer_messages").select("*").order("occurred_at", { ascending: true }).limit(10000), api.from("chat_page_messages").select("*").order("occurred_at", { ascending: true }).limit(10000)]); if (customerError) fail(customerError); if (pageError) fail(pageError); const rows = [...(customers ?? []).map((r: any) => ({ ...r, _speaker: "customer", _side: "left", _name: r.customer_name, _text: asText(r.message_text), _thread: r.conversation_key })), ...(pages ?? []).map((r: any) => ({ ...r, _speaker: "page", _side: "right", _name: r.page_sender_name, _text: asText(r.message_text), _thread: r.conversation_key }))]; return rows.sort((a, b) => new Date(a.occurred_at || a.synced_at || 0).getTime() - new Date(b.occurred_at || b.synced_at || 0).getTime()); }
export async function readChatThreads() { const rows = await readChatRows(); const map = new Map<string, any>(); for (const row of rows) { const key = `${row.page_id ?? ""}:${row._thread ?? ""}`; const current = map.get(key) ?? { key, pageId: row.page_id, threadId: row._thread, customerId: row.customer_id, pageName: row.page_name || "ไม่ระบุเพจ", customerName: row.customer_name || row._name || "ลูกค้า", latestAt: row.occurred_at || row.synced_at, latestOrderNumber: null, preview: row._text || (row.has_image ? "[ไฟล์แนบ]" : ""), orderCount: 0, unread: false, messageCount: 0, orders: [], chatTimeline: [] as string[] }; current.latestAt = row.occurred_at || row.synced_at || current.latestAt; current.preview = row._text || (row.has_image ? "[ไฟล์แนบ]" : current.preview); current.customerId ||= row.customer_id; current.customerName = current.customerName === "ลูกค้า" ? row.customer_name || row._name || current.customerName : current.customerName; current.messageCount += 1; current.chatTimeline.push(`${row._speaker === "page" ? "[เพจ]" : "[ลูกค้า]"} ${row._text || (row.has_image ? "[ไฟล์แนบ]" : "")}`); map.set(key, current); } try { const orders = await readCanonicalOrders(); for (const order of orders.orders) { const key = `${order.page_id ?? ""}:${order.thread_id ?? ""}`; const current = map.get(key); if (current) { current.orders.push(order); current.orderCount += 1; current.latestOrderNumber = order.order_number; } } } catch { /* ห้องแชทต้องไม่หายเพราะ View ออเดอร์อ่านไม่ได้ */ } return Array.from(map.values()).sort((a, b) => new Date(b.latestAt || 0).getTime() - new Date(a.latestAt || 0).getTime()); }
export async function readChatMessages(pageId: string, threadId: string) { const rows = await readChatRows(); return rows.filter(row => String(row.page_id) === String(pageId) && String(row._thread) === String(threadId)).map((row: any) => ({ id: row.id, text: row._text || (row.has_image ? "ส่งรูปภาพ" : ""), message_text: row._text, direction: row._speaker === "page" ? "outbound" : "inbound", senderType: row._speaker, senderName: row._name, side: row._side, occurredAt: row.occurred_at || row.synced_at, attachmentsJson: JSON.stringify(row.attachments_json || []), imageUrls: row.image_urls || [] })); }
export async function readDailyChatSummary(date: string) {
  const rows = await readChatRows(); let orders: any[] = [];
  try { const orderResult = await readCanonicalOrders("", new Date(date + "T00:00:00+07:00").toISOString()); orders = orderResult.orders; } catch { /* keep chat summary usable when canonical view is unavailable */ }
  const ordersByRoom = new Map(orders.map((order: any) => [String(order.page_id ?? "") + ":" + String(order.thread_id ?? ""), order]));
  const dayRows = rows.filter(row => { const value = row.occurred_at || row.synced_at; return value && new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date(value)) === date; });
  const map = new Map<string, any>();
  for (const row of dayRows) {
    const key = String(row.page_id ?? "") + ":" + String(row._thread ?? ""); const current = map.get(key) ?? { customerName: row.customer_name || row._name || "ไม่ระบุชื่อ", customerId: row.customer_id || "", pageName: row.page_name || "ไม่ระบุเพจ", pageId: row.page_id, threadId: row._thread, customerMessages: 0, pageMessages: 0, orderSignals: 0, signalScore: 0, signalReasons: [], coreSignalCount: 0, flowSignalCount: 0, qualifiedSignal: false, snippets: [], latestAt: row.occurred_at || row.synced_at, customerText: [], pageText: [], latestCod: null };
    const text = row._text || (row.has_image ? "[ไฟล์แนบ]" : ""); if (row._speaker === "customer") { current.customerMessages += 1; current.customerText.push(text); } else { current.pageMessages += 1; current.pageText.push(text); }
    current.latestAt = row.occurred_at || row.synced_at || current.latestAt; const cod = parseCod(text); if (cod != null) current.latestCod = cod;
    const signal = scoreDailyOrderSignal(text, cod); if (signal.qualified) current.orderSignals += 1; current.signalScore += signal.score; current.coreSignalCount += signal.coreCount; current.flowSignalCount += signal.flowCount; current.qualifiedSignal ||= signal.qualified; current.signalReasons.push(...signal.reasons);
    if (text.trim()) current.snippets.push(text.slice(0, 300)); map.set(key, current);
  }
  const threads = Array.from(map.values()).map(row => { const order = ordersByRoom.get(String(row.pageId ?? "") + ":" + String(row.threadId ?? "")) as any; return { ...row, sourceText: order?.source_text || order?.source_payload?.source_text || "", productDisplay: order?.display_for_packer || order?.items_text || "", snippets: row.snippets.slice(-8), signalReasons: Array.from(new Set(row.signalReasons)).slice(-12), orderSignalsText: row.latestCod != null ? "COD ล่าสุด " + row.latestCod.toLocaleString("th-TH") + " บาท" : "ไม่พบ COD" }; });
  return { date, threads, totalMessages: dayRows.length, customerMessages: dayRows.filter(r => r._speaker === "customer").length, pageMessages: dayRows.filter(r => r._speaker === "page").length, threadCount: threads.length, orderSignalThreads: threads.filter(r => r.orderSignals > 0).length };
}
export type AlienReviewItem = Record<string, any> & { audit_status: string; raw_display: string; mapped_display: string; };
export async function readAlienReview(search = ''): Promise<AlienReviewItem[]> {
  const api = getSupabase();
  if (!api) fail({ message: 'ยังไม่ได้เชื่อม Supabase: ไปที่ /connect แล้วกรอก URL และ Anon Key' });
  const [itemsResult, masterResult, aliasResult] = await Promise.all([
    api.from('canonical_order_items').select('*').order('created_at', { ascending: false }).limit(3000),
    api.from('product_master').select('*').limit(5000),
    api.from('product_map_master').select('*').limit(10000),
  ]);
  if (itemsResult.error) fail(itemsResult.error);
  if (masterResult.error) fail(masterResult.error);
  if (aliasResult.error) fail(aliasResult.error);
  const masters = masterResult.data ?? [];
  const byId = new Map(masters.map((master: any) => [String(master.id), master]));
  const bySku = new Map(masters.map((master: any) => [String(master.sku ?? '').trim().toLowerCase(), master]));
  const normalizeAlias = (value: any) => String(value ?? '').toLowerCase().normalize('NFKC').replace(/[\s_\-.,:;|()[\]{}]+/g, '').trim();
  const aliasToSku = new Map<string, string>();
  for (const row of aliasResult.data ?? []) {
    const sku = String(row.sku ?? '').trim();
    if (!sku) continue;
    for (const value of [row.alias, row.alias_text, row.alias_norm].flatMap((v: any) => String(v ?? '').split(/[,\n|]+/)).map((v: string) => v.trim()).filter(Boolean)) aliasToSku.set(normalizeAlias(value), sku);
  }
  const query = search.trim().toLowerCase();
  return (itemsResult.data ?? []).map((item: any) => {
    const raw = String(item.raw_item_text ?? item.raw_product_text ?? item.raw_text ?? '').trim();
    const aliasSku = aliasToSku.get(normalizeAlias(raw)) ?? Array.from(aliasToSku.entries()).find(([alias]) => alias.length >= 3 && normalizeAlias(raw).includes(alias))?.[1];
    const resolvedSku = String(item.sku ?? '').trim() || aliasSku || '';
    const master = (item.product_id != null ? byId.get(String(item.product_id)) : undefined) ?? bySku.get(resolvedSku.toLowerCase());
    const mapped = String(item.display_for_packer ?? item.label_display ?? master?.display_for_packer ?? master?.label_display ?? master?.name_standard ?? master?.th_name ?? master?.product_name ?? item.product_name ?? item.sku ?? '').trim();
    const sku = String(item.sku ?? master?.sku ?? aliasSku ?? '').trim();
    const rawIsSku = Boolean(raw && sku && raw.toLowerCase() === sku.toLowerCase());
    const aliasMatched = Boolean(aliasSku && master);
    const audit_status = !raw ? 'RAW_MISSING' : rawIsSku ? 'RAW_EQUALS_SKU' : aliasMatched ? 'MATCHED' : (item.mapping_status ?? item.match_status ?? 'REVIEW');
    return { ...item, sku: sku || item.sku, product_master: master ?? null, alias_match: aliasMatched, alias_match_sku: aliasSku || null, alias_match_method: aliasMatched ? 'product_map_master' : null, audit_status, raw_display: raw || 'ไม่มีคำดิบ', mapped_display: mapped || 'ยังไม่มีชื่อมาตรฐาน' };
  }).filter((item: AlienReviewItem) => !query || JSON.stringify(item).toLowerCase().includes(query));
}
