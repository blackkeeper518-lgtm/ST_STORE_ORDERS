import { listStoredChatMessages } from "./db";

export type LiveOrderItem = {
  id?: number;
  upsert_key?: string | null;
  order_number?: string | null;
  sku?: string | null;
  th_name?: string | null;
  emoji?: string | null;
  display_for_packer?: string | null;
  telegram_final_mapped?: string | null;
  label_display?: string | null;
  product_name?: string | null;
  quantity?: number | null;
  qty?: number | null;
  unit_price?: number | null;
  expected_cod?: number | null;
  cod_amount?: number | null;
};

export type LiveOrder = {
  id: number;
  upsert_key: string | null;
  order_number: string;
  order_date: string | null;
  order_time: string | null;
  created_at: string | null;
  updated_at: string | null;
  customer_name: string | null;
  facebook_name: string | null;
  phone: string | null;
  full_address: string | null;
  address_display_packer: string | null;
  page_name: string | null;
  page_id: string | null;
  thread_id: string | null;
  threadId: string | null;
  cod_amount: number | null;
  expected_cod: number | null;
  sku: string | null;
  th_name: string | null;
  emoji: string | null;
  display_for_packer: string | null;
  label_display: string | null;
  telegram_status: string | null;
  order_status: string | null;
  audit_status: string | null;
  audit_flags: string | null;
  cod_check_status: string | null;
  is_ready_to_pack: boolean;
  telegram_message: string | null;
  telegram_copy_text: string | null;
  telegram_chat_id: string | null;
  source_text: string | null;
  raw_text_with_phone: string | null;
  raw_text_with_phone_timed: string | null;
  full_chunk_text: string | null;
  chat_timeline: string[];
  items_json?: unknown;
  items_text?: string | null;
  items_count?: number | null;
  total_quantity?: number | null;
  items: LiveOrderItem[];
};


export type ParcelMatch = {
  id: string;
  trackingNumber: string | null;
  pickupDate: string | null;
  consignee: string | null;
  phone: string | null;
  address: string | null;
  codAmount: number | null;
  matchMethod: string;
  matchScore: number;
  matchStatus: "matched" | "review" | "not_found";
};

const parcelCache = new Map<string, { expiresAt: number; value: ParcelMatch | null }>();

function normalizePhone(value: unknown) { return String(value ?? "").replace(/\D/g, "").replace(/^66/, "0"); }
function normalizeAddress(value: unknown) { return String(value ?? "").toLowerCase().replace(/ตำบล|ต\.|อำเภอ|อ\.|จังหวัด|จ\.|แขวง|เขต/g, "").replace(/[^0-9ก-๙a-z]/gi, ""); }
function numericCod(value: unknown) { const n = Number(String(value ?? "").replace(/[^0-9.]/g, "")); return Number.isFinite(n) ? n : null; }

export async function fetchCustomerHistory(search?: string, limit = 200) {
  const rows = await getRows<Record<string, unknown>>("vw_customer_history", "*", limit);
  const q = search?.trim().toLowerCase();
  return rows.filter(row => !q || JSON.stringify(row).toLowerCase().includes(q));
}

export async function fetchParcelMatchReview(status: "all" | "matched" | "review" | "unmatched" = "all", limit = 300) {
  const { baseUrl, key } = config();
  const url = new URL(`${baseUrl}/rest/v1/parcel_order_matches`);
  url.searchParams.set("select", "*,parcels(tracking_number,phone_number,phone,address,cod_amount,cod,pickup_date)");
  if (status !== "all") url.searchParams.set("match_status", `eq.${status}`);
  url.searchParams.set("order", "created_at.desc");
  url.searchParams.set("limit", String(limit));
  const response = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!response.ok) throw new Error(`Supabase parcel_order_matches returned HTTP ${response.status}`);
  return response.json() as Promise<Array<Record<string, unknown>>>;
}

export async function fetchParcelForOrder(order: LiveOrder): Promise<ParcelMatch | null> {
  const cacheKey = order.order_number;
  const cached = parcelCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const { baseUrl, key } = config();
  const url = new URL(`${baseUrl}/rest/v1/parcels`);
  url.searchParams.set("select", "id,tracking_number,pickup_date,consignee,phone_number,phone,address,cod_amount,cod");
  url.searchParams.set("order", "pickup_date.desc");
  url.searchParams.set("limit", "5000");
  const response = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!response.ok) throw new Error(`Supabase parcels returned HTTP ${response.status}`);
  const rows = await response.json() as Array<Record<string, unknown>>;
  const orderPhone = normalizePhone(order.phone);
  const orderAddress = normalizeAddress(order.full_address);
  const orderCod = order.cod_amount ?? order.expected_cod;
  const candidates = rows.map(row => {
    const phone = normalizePhone(row.phone_number ?? row.phone);
    const address = normalizeAddress(row.address);
    const cod = numericCod(row.cod_amount ?? row.cod);
    let score = 0; const methods: string[] = [];
    if (orderPhone && phone && orderPhone === phone) { score += 55; methods.push("phone"); }
    if (orderCod !== null && cod !== null && Math.abs(orderCod - cod) < 0.01) { score += 20; methods.push("cod"); }
    if (orderAddress && address) {
      const tokens = orderAddress.match(/[0-9]+|[ก-๙a-z]{3,}/gi) ?? [];
      const hits = tokens.filter(token => address.includes(token)).length;
      if (tokens.length && hits / tokens.length >= 0.5) { score += 25; methods.push("address"); }
      else if (tokens.length && hits > 0) { score += 10; methods.push("address_partial"); }
    }
    return { row, score, methods };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);
  const best = candidates[0];
  const value = best ? {
    id: String(best.row.id), trackingNumber: text(best.row.tracking_number), pickupDate: text(best.row.pickup_date), consignee: text(best.row.consignee), phone: text(best.row.phone_number ?? best.row.phone), address: text(best.row.address), codAmount: numericCod(best.row.cod_amount ?? best.row.cod), matchMethod: best.methods.join(" + "), matchScore: best.score, matchStatus: best.score >= 75 ? "matched" as const : "review" as const,
  } : null;
  parcelCache.set(cacheKey, { expiresAt: Date.now() + 30_000, value });
  return value;
}

export type LiveOrderStats = {
  total: number;
  mapped: number;
  review: number;
  codCheck: number;
  sent: number;
  pages: number;
};

export type LiveThread = {
  key: string;
  pageName: string;
  pageId: string | null;
  threadId: string | null;
  customerId: string | null;
  latestAt: string | null;
  latestOrderNumber: string;
  customerName: string | null;
  preview: string;
  orderCount: number;
  unread: boolean;
  sentCount: number;
  messageCount: number;
  orders: LiveOrder[];
  chatTimeline: string[];
  searchText: string;
};

export type LiveProductMapping = {
  sku: string;
  label: string;
  price: number | null;
  emoji: string | null;
  aliases?: string | null;
};

export type StockProduct = LiveProductMapping & {
  id: number;
  thName: string | null;
  stockQty: number | null;
  stockStatus: string | null;
  status: string | null;
  updatedAt: string | null;
};

export type StockWarning = {
  kind: "duplicate_sku" | "missing_sku";
  sku: string | null;
  label: string | null;
  count?: number;
};

export type ExternalChatMessage = {
  id: number;
  providerMessageId: string | null;
  pageId: string;
  pageName: string | null;
  threadId: string;
  senderId: string;
  senderName: string | null;
  customerName: string | null;
  senderType: "customer" | "page";
  side: "left" | "right";
  direction: "inbound" | "outbound";
  text: string | null;
  attachmentsJson: string | null;
  adminUserId?: number | null;
  occurredAt: string | null;
  createdAt: string | null;
};

const CENTRAL_ORDER_TABLE = "central_order_master";
const CANONICAL_ORDER_VIEW = "vw_orders_web_all_fields";
const CANONICAL_ORDER_TABLE = "canonical_orders";
const orderSelect = "*";
const legacyOrderSelect = "*";
const itemSelect = "*";

const recentOrderCache = new Map<string, { expiresAt: number; value: LiveOrder[] }>();
const ORDER_CACHE_TTL_MS = 30_000;

function config() {
  const baseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !key) throw new Error("Supabase secrets are not configured");
  return { baseUrl, key };
}

async function getRows<T>(table: string, select: string, limit: number) {
  const { baseUrl, key } = config();
  const url = new URL(`${baseUrl}/rest/v1/${table}`);
  url.searchParams.set("select", select);
  url.searchParams.set("limit", String(limit));
  const response = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!response.ok) {
    const details = (await response.text()).slice(0, 300);
    throw new Error(`Supabase ${table} returned HTTP ${response.status}${details ? `: ${details}` : ""}`);
  }
  return response.json() as Promise<T[]>;
}

function text(value: unknown) {
  return value === null || value === undefined ? null : String(value);
}

function number(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function bool(value: unknown) {
  return value === true || value === "true" || value === 1;
}

function timeline(value: unknown) {
  if (Array.isArray(value)) return value.map(item => String(item)).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(/\n(?=\d{1,2}\/\d{1,2}\/\d{2,4})/).map(item => item.trim()).filter(Boolean);
  return [];
}

function bodyField(row: Record<string, unknown>, field: string) {
  const body = row.telegram_body;
  return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>)[field] : undefined;
}

function firstText(row: Record<string, unknown>, ...fields: string[]) {
  for (const field of fields) { const value = text(row[field]); if (value?.trim()) return value; }
  return null;
}

function customerNameFromRow(row: Record<string, unknown>) {
  const candidate = firstText(row, "customer_name", "facebook_name");
  const facebook = firstText(row, "facebook_name");
  if (facebook && candidate && (/^\d{1,2}$/.test(candidate.trim()) || /^\d{1,2}[/-]\d{1,2}/.test(candidate.trim()))) return facebook;
  return candidate;
}

function sortNewest(a: { created_at?: string | null; order_time?: string | null }, b: { created_at?: string | null; order_time?: string | null }) {
  const aTime = Date.parse(String(a.created_at ?? a.order_time ?? "")) || 0;
  const bTime = Date.parse(String(b.created_at ?? b.order_time ?? "")) || 0;
  return bTime - aTime;
}

function normalizeItem(row: Record<string, unknown>): LiveOrderItem {
  return {
    id: number(row.id) ?? undefined,
    upsert_key: text(row.upsert_key),
    order_number: text(row.order_number),
    sku: text(row.sku),
    th_name: text(row.th_name),
    emoji: text(row.emoji),
    display_for_packer: text(row.display_for_packer),
    telegram_final_mapped: text(row.telegram_final_mapped),
    label_display: text(row.label_display),
    product_name: text(row.product_name),
    quantity: number(row.quantity),
    qty: number(row.qty),
    unit_price: number(row.unit_price),
    expected_cod: number(row.expected_cod),
    cod_amount: number(row.cod_amount),
  };
}

function applyProductMaster(items: LiveOrderItem[], catalog: Map<string, Record<string, unknown>>) {
  return items.map(item => {
    const master = item.sku ? catalog.get(item.sku.trim().toLowerCase()) : undefined;
    if (!master) return item;
    const canonicalLabel = firstText(master, "display_for_packer", "label_display", "name_standard", "th_name");
    return {
      ...item,
      display_for_packer: canonicalLabel ?? item.display_for_packer,
      label_display: canonicalLabel ?? item.label_display,
      th_name: firstText(master, "th_name", "name_standard") ?? item.th_name,
      emoji: text(master.emoji) ?? item.emoji,
      unit_price: number(master.unit_price) ?? item.unit_price,
    };
  });
}

function mergeDuplicateItems(items: LiveOrderItem[]) {
  const merged = new Map<string, LiveOrderItem>();
  for (const item of items) {
    const key = String(item.sku ?? item.label_display ?? item.th_name ?? item.display_for_packer ?? "").trim().toLowerCase();
    if (!key) { merged.set(`row:${merged.size}`, item); continue; }
    const existing = merged.get(key);
    if (!existing) { merged.set(key, { ...item, quantity: item.quantity ?? item.qty ?? 1, qty: item.quantity ?? item.qty ?? 1 }); continue; }
    const quantity = Number(existing.quantity ?? existing.qty ?? 1) + Number(item.quantity ?? item.qty ?? 1);
    const expectedCod = (existing.expected_cod ?? 0) + (item.expected_cod ?? 0);
    merged.set(key, { ...existing, quantity, qty: quantity, expected_cod: expectedCod || existing.expected_cod || item.expected_cod });
  }
  return Array.from(merged.values());
}

function parseItemArray(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter(item => Boolean(item && typeof item === "object")) as Record<string, unknown>[];
  if (typeof value !== "string" || !value.trim()) return [];
  try { return parseItemArray(JSON.parse(value)); } catch { return []; }
}

function itemLinesFromOrder(row: Record<string, unknown>): LiveOrderItem[] {
  const payloads = [row.source_payload, row.raw_payload, row.payload].filter(value => value && typeof value === "object") as Record<string, unknown>[];
  const candidates = [row.order_items, row.items, row.product_items, row.items_json, ...payloads.flatMap(payload => [payload._normalizer && typeof payload._normalizer === "object" ? (payload._normalizer as Record<string, unknown>).order_items_preserved : undefined, payload.order_items, payload.items, payload.product_items, payload.items_json])];
  for (const candidate of candidates) {
    const parsed = parseItemArray(candidate);
    if (parsed.length) return parsed.map(normalizeItem);
  }
  if (row.sku || row.th_name || row.product_name || row.label_display || row.display_for_packer) return [normalizeItem(row)];
  return [];
}

function normalizeOrder(row: Record<string, unknown>, items: LiveOrderItem[]): LiveOrder {
  const orderNumber = text(row.order_number) ?? `#${text(row.id) ?? "unknown"}`;
  return {
    id: number(row.id) ?? 0,
    upsert_key: text(row.upsert_key),
    order_number: orderNumber,
    order_date: text(row.order_date),
    order_time: text(row.order_time),
    created_at: text(row.created_at),
    updated_at: text(row.updated_at),
    customer_name: customerNameFromRow(row),
    facebook_name: text(row.facebook_name),
    phone: firstText(row, "phone", "extracted_phone"),
    full_address: firstText(row, "address_for_bill", "final_address_for_bill", "address_display_packer", "addressclean", "web_address_for_bill", "web_address_primary", "address_display_primary", "full_address", "address_display_fallback", "web_address_fallback", "web_address_short", "address_line_1", "short_address", "parsedLocationOnly"),
    address_display_packer: firstText(row, "address_for_bill", "final_address_for_bill", "address_display_packer", "addressclean", "web_address_for_bill", "address_display_full", "address_display_primary", "web_address_primary", "full_address", "address_display_fallback", "web_address_fallback", "web_address_short", "address_line_1", "short_address"),
    page_name: text(row.page_name),
    page_id: text(row.page_id),
    thread_id: text(row.thread_id),
    threadId: text(row.threadId),
    cod_amount: number(row.cod_amount) ?? number(row.expected_cod) ?? number(bodyField(row, "cod_amount")) ?? number(bodyField(row, "total_cod")),
    expected_cod: number(row.expected_cod) ?? number(row.cod_amount),
    sku: text(row.sku),
    th_name: text(row.th_name),
    emoji: text(row.emoji),
    display_for_packer: firstText(row, "display_for_packer", "display_for_packer_with_qty", "display_for_packer_master", "display_for_packer_exact", "product_display_final", "product_display_primary", "product_display_fallback", "product_display_raw", "final_display_for_packer"),
    label_display: text(row.label_display) ?? text(row.display_label),
    telegram_status: text(row.telegram_status),
    order_status: text(row.order_status),
    audit_status: text(row.audit_status),
    audit_flags: text(row.audit_flags),
    cod_check_status: text(row.cod_check_status),
    is_ready_to_pack: bool(row.is_ready_to_pack),
    telegram_message: text(row.telegram_message),
    telegram_copy_text: text(row.telegram_copy_text),
    telegram_chat_id: text(row.telegram_chat_id),
    source_text: firstText(row, "sniper_x_text_clean", "clean_text", "source_text", "raw_text", "single_cleaned_block", "full_chunk_text"),
    raw_text_with_phone: text(row.raw_text_with_phone ?? bodyField(row, "raw_text_with_phone")),
    raw_text_with_phone_timed: text(row.raw_text_with_phone_timed ?? bodyField(row, "raw_text_with_phone_timed")),
    full_chunk_text: text(row.full_chunk_text ?? bodyField(row, "full_chunk_text")),
    chat_timeline: timeline(row.chat_timeline_web ?? row.web_chat_timeline ?? row.chat_timeline ?? bodyField(row, "chat_timeline_web") ?? bodyField(row, "chat_timeline") ?? (row.source_payload && typeof row.source_payload === "object" ? (row.source_payload as Record<string, unknown>).chat_timeline : undefined) ?? row.raw_text_with_phone_timed ?? row.full_chunk_text ?? row.clean_text ?? row.telegram_copy_text ?? row.telegram_message),
    items_json: row.items_json ?? row.order_items ?? row.items ?? row.product_items ?? null,
    items_text: text(row.web_items_all_fields ?? row.web_items_clean ?? row.items_text ?? row.packer_copy_text),
    items_count: number(row.items_count),
    total_quantity: number(row.total_quantity),
    items,
  };
}

async function getRowsWithFallback<T>(preferredTable: string, fallbackTable: string, select: string, limit: number) {
  try {
    return await getRows<T>(preferredTable, select, limit);
  } catch (error) {
    // During the migration canonical_orders may exist with an older column shape.
    // Retry the established canonical_orders table for both missing-table and HTTP 400 schema errors.
    if (!/400|404|42P01|relation|column|does not exist/i.test(String(error))) throw error;
    try {
      return await getRows<T>(fallbackTable, select, limit);
    } catch (fallbackError) {
      throw new Error(`${String(error)}; fallback ${String(fallbackError)}`);
    }
  }
}

export async function fetchLiveOrders(search?: string) {
  let rawOrders: Array<Record<string, unknown>>;
  try {
    rawOrders = await getRows<Record<string, unknown>>(CANONICAL_ORDER_VIEW, orderSelect, 3000);
  } catch (error) {
    if (!/400|404|42P01|relation|column|does not exist/i.test(String(error))) throw error;
    console.warn("[SUPHABASS] central_order_master unavailable; reading canonical view/table");
    try {
      rawOrders = await getRows<Record<string, unknown>>(CENTRAL_ORDER_TABLE, orderSelect, 3000);
    } catch { rawOrders = await getRows<Record<string, unknown>>(CANONICAL_ORDER_TABLE, orderSelect, 3000); }
  }
  let catalog = new Map<string, Record<string, unknown>>();
  try {
    const products = await getRows<Record<string, unknown>>("product_master", "sku,display_for_packer,label_display,name_standard,th_name,emoji,unit_price", 5000);
    catalog = new Map(products.filter(row => String(row.sku ?? "").trim()).map(row => [String(row.sku).trim().toLowerCase(), row]));
  } catch (error) {
    console.warn("[SUPHABASS] product_master lookup skipped:", error instanceof Error ? error.message : String(error));
  }
  const orders = rawOrders.map(row => normalizeOrder(row, mergeDuplicateItems(applyProductMaster(itemLinesFromOrder(row), catalog)))).sort(sortNewest);
  const query = search?.trim().toLowerCase();
  if (!query) return orders;
  if (/^(cod|เก็บเงินปลายทาง|ปลายทาง)$/i.test(query)) return orders.filter(order => order.cod_amount !== null || order.expected_cod !== null || /cod|เก็บเงินปลายทาง|ปลายทาง/i.test(`${order.source_text ?? ""} ${order.telegram_message ?? ""}`));
  return orders.filter(order => JSON.stringify(order).toLowerCase().includes(query));
}

export function getLiveOrderStats(orders: LiveOrder[]): LiveOrderStats {
  const pages = new Set(orders.map(order => order.page_name).filter(Boolean));
  const mapped = orders.filter(order => order.is_ready_to_pack || /ready|mapped|พร้อม|แมป|ผ่าน/i.test(`${order.audit_status ?? ""} ${order.order_status ?? ""}`)).length;
  const codCheck = orders.filter(order => {
    const status = String(order.cod_check_status ?? "").toUpperCase();
    return status !== "" && status !== "PASS";
  }).length;
  return {
    total: orders.length,
    mapped,
    review: Math.max(orders.length - mapped, 0),
    codCheck,
    sent: orders.filter(order => String(order.telegram_status ?? "").toUpperCase() === "SENT").length,
    pages: pages.size,
  };
}

export async function fetchLiveOrder(orderNumber: string) {
  const orders = await fetchLiveOrders(orderNumber);
  return orders.find(order => order.order_number === orderNumber) ?? null;
}

export async function fetchOrdersForThread(pageId: string, threadId: string): Promise<LiveOrder[]> {
  const cacheKey = `${pageId}::${threadId}`;
  const cached = recentOrderCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const { baseUrl, key } = config();
  const rpcResponse = await fetch(`${baseUrl}/rest/v1/rpc/get_latest_orders_for_thread`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_page_id: pageId, p_thread_id: threadId, p_limit: 20 }),
  });
  if (rpcResponse.ok) {
    const rows = await rpcResponse.json() as Array<Record<string, unknown>>;
    const result = rows.map(row => normalizeOrder(row, itemLinesFromOrder(row))).sort(sortNewest);
    recentOrderCache.set(cacheKey, { expiresAt: Date.now() + ORDER_CACHE_TTL_MS, value: result });
    return result;
  }
  const request = async (table: string, select = orderSelect, threadField = "thread_id") => {
    const url = new URL(`${baseUrl}/rest/v1/${table}`);
    url.searchParams.set("select", select);
    url.searchParams.set("page_id", `eq.${pageId}`);
    url.searchParams.set(threadField, `eq.${threadId}`);
    url.searchParams.set("order", "created_at.desc");
    url.searchParams.set("limit", "20");
    return fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  };
  let response = await request(CANONICAL_ORDER_VIEW);
  if (!response.ok) response = await request(CENTRAL_ORDER_TABLE);
  if (!response.ok) response = await request(CANONICAL_ORDER_TABLE);
  if (!response.ok) response = await request(CANONICAL_ORDER_TABLE, orderSelect, "conversation_key");
  if (!response.ok) throw new Error(`Supabase canonical order thread lookup returned HTTP ${response.status}`);
  const rows = await response.json() as Array<Record<string, unknown>>;
  const result = rows.map(row => normalizeOrder(row, itemLinesFromOrder(row))).sort(sortNewest);
  recentOrderCache.set(cacheKey, { expiresAt: Date.now() + ORDER_CACHE_TTL_MS, value: result });
  return result;
}

export function clearRecentOrderCache() {
  recentOrderCache.clear();
}

export async function fetchLiveProductMappings(): Promise<LiveProductMapping[]> {
  const [productResult, mapResult] = await Promise.allSettled([
    getRows<Record<string, unknown>>("product_master", "sku,label_display,display_for_packer,name_standard,unit_price,emoji,alias", 1000),
    getRows<Record<string, unknown>>("product_map_master", "sku,alias,alias_text", 5000),
  ]);
  if (productResult.status === "rejected") throw productResult.reason;
  const rows = productResult.value;
  const mappedAliases = new Map<string, string>();
  if (mapResult.status === "fulfilled") for (const row of mapResult.value) {
    const sku = String(row.sku ?? "").trim();
    const alias = text(row.alias ?? row.alias_text);
    if (sku && alias) mappedAliases.set(sku, alias);
  }
  return rows.map(row => ({
    sku: String(row.sku ?? ""),
    label: String(row.label_display ?? row.display_for_packer ?? row.name_standard ?? row.sku ?? ""),
    price: number(row.unit_price),
    emoji: text(row.emoji),
    aliases: mappedAliases.get(String(row.sku ?? "")) ?? text(row.alias),
  })).filter(item => item.sku && item.label).sort((a, b) => a.sku.localeCompare(b.sku));
}

export async function fetchStockProducts(): Promise<StockProduct[]> {
  const [productResult, mapResult] = await Promise.allSettled([
    getRows<Record<string, unknown>>("product_master", "id,sku,label_display,display_for_packer,name_standard,unit_price,emoji,alias,th_name,stock_qty,stock_status,status,updated_at", 2000),
    getRows<Record<string, unknown>>("product_map_master", "sku,alias,alias_text,alias_norm", 5000),
  ]);
  if (productResult.status === "rejected") throw productResult.reason;
  const rows = productResult.value;
  const mappedAliases = new Map<string, string>();
  if (mapResult.status === "fulfilled") for (const row of mapResult.value) {
    const sku = String(row.sku ?? "").trim();
    const alias = text(row.alias ?? row.alias_text);
    if (sku && alias) mappedAliases.set(sku, alias);
  }
  return rows.map(row => ({
    id: number(row.id) ?? 0,
    sku: String(row.sku ?? ""),
    label: String(row.label_display ?? row.display_for_packer ?? row.name_standard ?? row.sku ?? ""),
    price: number(row.unit_price),
    emoji: text(row.emoji),
    aliases: mappedAliases.get(String(row.sku ?? "")) ?? text(row.alias),
    thName: text(row.th_name),
    stockQty: number(row.stock_qty),
    stockStatus: text(row.stock_status),
    status: text(row.status),
    updatedAt: text(row.updated_at),
  })).filter(item => item.sku && item.label).sort((a, b) => a.label.localeCompare(b.label, "th"));
}

export async function updateStockProduct(id: number, input: { stockQty?: number; stockStatus?: string; labelDisplay?: string; unitPrice?: number }) {
  const { baseUrl, key } = config();
  const patch: Record<string, unknown> = {};
  if (input.stockQty !== undefined) patch.stock_qty = input.stockQty;
  if (input.stockStatus !== undefined) patch.stock_status = input.stockStatus;
  if (input.labelDisplay !== undefined) patch.label_display = input.labelDisplay;
  if (input.unitPrice !== undefined) patch.unit_price = input.unitPrice;
  const response = await fetch(`${baseUrl}/rest/v1/product_master?id=eq.${encodeURIComponent(String(id))}`, { method: "PATCH", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify(patch) });
  if (!response.ok) throw new Error(`Supabase product_master update returned HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
  return fetchStockProducts();
}

export async function updateLiveOrderCustomer(id: number, input: { customerName?: string; phone?: string; fullAddress?: string; codAmount?: number }) {
  const { baseUrl, key } = config();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.customerName !== undefined) patch.customer_name = input.customerName.trim() || null;
  if (input.phone !== undefined) patch.phone = input.phone.trim() || null;
  if (input.fullAddress !== undefined) patch.full_address = input.fullAddress.trim() || null;
  if (input.codAmount !== undefined) patch.cod_amount = input.codAmount;
  const response = await fetch(`${baseUrl}/rest/v1/${CENTRAL_ORDER_TABLE}?id=eq.${encodeURIComponent(String(id))}`, { method: "PATCH", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify(patch) });
  if (!response.ok) throw new Error(`central_order_master update returned HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
  clearRecentOrderCache();
  return { ok: true, id, ...patch };
}

export async function fetchStockWarnings(): Promise<StockWarning[]> {
  const result = await getRows<Record<string, unknown>>("product_master", "id,sku,label_display,th_name", 5000);
  const warnings: StockWarning[] = [];
  const bySku = new Map<string, Array<Record<string, unknown>>>();
  for (const row of result) {
    const sku = String(row.sku ?? "").trim();
    if (!sku) warnings.push({ kind: "missing_sku", sku: null, label: text(row.th_name ?? row.label_display) });
    else bySku.set(sku, [...(bySku.get(sku) ?? []), row]);
  }
  bySku.forEach((rows, sku) => { if (rows.length > 1) warnings.push({ kind: "duplicate_sku", sku, label: text(rows[0]?.th_name ?? rows[0]?.label_display), count: rows.length }); });
  return warnings;
}

export async function updateProductMapAlias(sku: string, alias: string) {
  const { baseUrl, key } = config();
  const cleanAlias = alias.trim();
  const mappedBody = { alias: cleanAlias || null, alias_text: cleanAlias || null, alias_norm: cleanAlias ? cleanAlias.toLowerCase() : null, updated_at: new Date().toISOString() };
  const response = await fetch(`${baseUrl}/rest/v1/product_map_master?sku=eq.${encodeURIComponent(sku)}`, { method: "PATCH", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(mappedBody) });
  if (!response.ok) throw new Error(`Supabase product_map_master alias update returned HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
  const master = await fetch(`${baseUrl}/rest/v1/product_master?select=id,alias&sku=eq.${encodeURIComponent(sku)}&limit=1`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (master.ok) {
    const rows = await master.json() as Array<{ id: number; alias?: string | null }>;
    const row = rows[0];
    if (row) {
      const aliases = String(row.alias ?? "").split(/[,\n|]+/).map(value => value.trim()).filter(Boolean).filter(value => value.toLowerCase() !== cleanAlias.toLowerCase());
      if (cleanAlias) aliases.push(cleanAlias);
      const sync = await fetch(`${baseUrl}/rest/v1/product_master?id=eq.${encodeURIComponent(String(row.id))}`, { method: "PATCH", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ alias: aliases.join(", ") || null }) });
      if (!sync.ok) throw new Error(`Supabase product_master alias sync returned HTTP ${sync.status}`);
    }
  }
  return { ok: true, sku, alias: cleanAlias };
}

export async function listProductAliasesFromSupabase() {
  const rows = await getRows<Record<string, unknown>>("product_map_master", "*", 5000);
  return rows.map((row, index) => ({
    id: Number(row.map_id ?? row.id ?? index + 1),
    ownerId: 0,
    alias: text(row.alias ?? row.alias_text ?? row.product_name) ?? "",
    canonicalSku: text(row.sku ?? row.canonical_sku) ?? "",
    canonicalLabel: text(row.display_for_packer ?? row.final_display_for_packer ?? row.label_display ?? row.canonical_label ?? row.th_name ?? row.sku) ?? "",
    isActive: row.is_active !== false,
    createdAt: text(row.created_at) ?? new Date().toISOString(),
    updatedAt: text(row.updated_at) ?? new Date().toISOString(),
  })).filter(row => row.alias && row.canonicalSku);
}

export async function createProductAliasInSupabase(input: { alias: string; canonicalSku: string; canonicalLabel: string }) {
  const { baseUrl, key } = config();
  const cleanAlias = input.alias.trim();
  const masterRows = await getRows<Record<string, unknown>>("product_master", "id,sku,display_for_packer,label_display,th_name", 5000);
  const master = masterRows.find(row => String(row.sku ?? "").trim() === input.canonicalSku.trim());
  if (!master) throw new Error(`ไม่พบ SKU ${input.canonicalSku} ใน product_master`);
  const body = { sku: input.canonicalSku.trim(), alias: cleanAlias, alias_text: cleanAlias, alias_norm: cleanAlias.toLowerCase(), source: "front_house", source_room: "front_house", active: true, updated_at: new Date().toISOString() };
  const response = await fetch(`${baseUrl}/rest/v1/product_map_master`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation,resolution=merge-duplicates" }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`product_map_master insert returned HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
  await updateProductMapAlias(input.canonicalSku, cleanAlias);
  return listProductAliasesFromSupabase();
}

export async function updateProductAliasInSupabase(id: number, input: { alias: string; canonicalSku: string; canonicalLabel: string; isActive?: boolean }) {
  const { baseUrl, key } = config();
  const cleanAlias = input.alias.trim();
  const masterRows = await getRows<Record<string, unknown>>("product_master", "id,sku,display_for_packer,label_display,th_name", 5000);
  const master = masterRows.find(row => String(row.sku ?? "").trim() === input.canonicalSku.trim());
  if (!master) throw new Error(`ไม่พบ SKU ${input.canonicalSku} ใน product_master`);
  const body = { sku: input.canonicalSku.trim(), alias: cleanAlias, alias_text: cleanAlias, alias_norm: cleanAlias.toLowerCase(), source: "front_house", source_room: "front_house", active: input.isActive ?? true, updated_at: new Date().toISOString() };
  const response = await fetch(`${baseUrl}/rest/v1/product_map_master?id=eq.${encodeURIComponent(String(id))}`, { method: "PATCH", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`product_map_master update returned HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
  await updateProductMapAlias(input.canonicalSku, cleanAlias);
  return listProductAliasesFromSupabase();
}

function jsonText(value: unknown) {
  if (value === null || value === undefined) return null;
  return typeof value === "string" ? value : JSON.stringify(value);
}

export async function fetchExternalChatMessages(pageId?: string, threadId?: string, limit = 2000): Promise<ExternalChatMessage[]> {
  const { baseUrl, key } = config();
  async function readTable(table: string) {
    // These projections have changed over time. Read the row as-is and normalize
    // conversation_id/thread_id, speaker/speaker_type, time, and attachment fields below.
    const params = new URLSearchParams({ select: "*", order: "created_at.desc", limit: String(limit) });
    if (pageId) params.set("page_id", `eq.${pageId}`);
    let response = await fetch(`${baseUrl}/rest/v1/${table}?${params}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    if (!response.ok) {
      // Keep the Chat Hub usable if a deployment has an older table shape.
      const fallback = new URL(`${baseUrl}/rest/v1/${table}`);
      fallback.searchParams.set("select", "*");
      fallback.searchParams.set("order", "time.desc");
      fallback.searchParams.set("limit", String(limit));
      if (pageId) fallback.searchParams.set("page_id", `eq.${pageId}`);
      response = await fetch(fallback, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    }
    if (!response.ok) throw new Error(`Supabase ${table} returned HTTP ${response.status}`);
    return response.json() as Promise<Array<Record<string, unknown>>>;
  }
  try {
    const [customersResult, pagesResult] = await Promise.allSettled([readTable("chat_customer_messages"), readTable("chat_page_messages")]);
    const customers = customersResult.status === "fulfilled" ? customersResult.value : [];
    const pages = pagesResult.status === "fulfilled" ? pagesResult.value : [];
    if (customersResult.status === "rejected" && pagesResult.status === "rejected") throw customersResult.reason;
    const pageNames = new Map([...customers, ...pages].map(row => [String(row.page_id ?? ""), text(row.page_name)]));
    const normalizeSenderType = (row: Record<string, unknown>, fallback: "customer" | "page") => {
      const value = String(row.speaker_type ?? row.speaker ?? row.sender_type ?? "").toLowerCase();
      return value === "page" || value === "admin" ? "page" as const : value === "customer" ? "customer" as const : fallback;
    };
    const normalizeChatRow = (row: Record<string, unknown>, fallback: "customer" | "page") => {
      const senderType = normalizeSenderType(row, fallback);
      const threadId = row.conversation_key ?? row.conversation_id ?? row.thread_id;
      const providerMessageId = row.source_message_id ?? row.message_id ?? row.provider_message_id;
      const textValue = row.message_text ?? row.message_raw ?? row.sniper_x_text_clean;
      const attachments = row.attachments_json ?? row.attachments_raw ?? row.attachment_urls ?? (row.attachment_url ? [{ type: row.attachment_type ?? "file", url: row.attachment_url }] : undefined);
      return { ...row, senderId: senderType === "customer" ? row.customer_id ?? row.sender_id : row.page_sender_id ?? row.sender_id ?? row.page_id, senderName: senderType === "customer" ? row.customer_name ?? row.sender_name : row.page_sender_name ?? row.sender_name ?? row.page_name, customerName: row.customer_name, senderType, side: senderType === "customer" ? "left" as const : "right" as const, direction: senderType === "customer" ? "inbound" as const : "outbound" as const, normalizedThreadId: threadId, normalizedProviderMessageId: providerMessageId, normalizedText: textValue, normalizedAttachments: attachments, normalizedOccurredAt: row.occurred_at ?? row.time ?? row.created_at ?? row.fetched_at };
    };
    const rows: Array<Record<string, unknown> & { senderId: unknown; senderName: unknown; senderType: "customer" | "page"; side: "left" | "right"; direction: "inbound" | "outbound" }> = [
      ...customers.map(row => ({ ...normalizeChatRow(row, "customer"), page_name: pageNames.get(String(row.page_id ?? "")) ?? row.page_name })),
      ...pages.map(row => normalizeChatRow(row, "page")),
    ];
    const deduped = new Map<string, (typeof rows)[number]>();
    rows.forEach(row => { const key = String(row.normalizedProviderMessageId ?? row.dedupe_key ?? `${row.page_id}:${row.normalizedThreadId}:${row.normalizedOccurredAt}:${row.normalizedText}`); if (!deduped.has(key)) deduped.set(key, row); });
    return Array.from(deduped.values()).map((row, index) => ({
      id: Number(row.id ?? index + 1), providerMessageId: text(row.normalizedProviderMessageId), pageId: String(row.page_id ?? ""), pageName: text(row.page_name),
      threadId: String(row.normalizedThreadId ?? ""), senderId: String(row.senderId ?? ""), senderName: text(row.senderName), customerName: text(row.customerName), senderType: row.senderType, side: row.side, direction: row.direction,
      text: text(row.normalizedText), attachmentsJson: jsonText(row.normalizedAttachments), occurredAt: text(row.normalizedOccurredAt), createdAt: text(row.created_at ?? row.synced_at ?? row.fetched_at),
    })).filter(row => row.pageId && row.threadId && (!threadId || row.threadId === threadId)).sort((a, b) => (Date.parse(String(b.occurredAt ?? "")) || 0) - (Date.parse(String(a.occurredAt ?? "")) || 0));
  } catch (error) {
    if (/404|42P01|relation|does not exist/i.test(String(error))) return [];
    throw error;
  }
}

export async function fetchDailyChatOrderSummary(date: string) {
  const messages = await fetchExternalChatMessages(undefined, undefined, 10000);
  const thaiDate = (value: string | null) => value ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value)) : "";
  const selected = messages.filter(message => thaiDate(message.occurredAt) === date);
  const groups = new Map<string, { pageId: string; pageName: string; threadId: string; customerName: string; customerId: string; customerMessages: number; pageMessages: number; orderSignals: number; latestAt: string | null; snippets: string[] }>();
  const codSignal = /(\bcod\b|ซีโอดี|เก็บเงินปลายทาง|ปลายทาง|ยอด\s*[0-9,]+\s*(บาท|฿)?|[0-9,]+\s*บาท)/i;
  const intentSignal = /(สั่ง|เอาเลย|เอา\s*ค่ะ?|รับ\s*ค่ะ?|ขอ\s*รับ|จอง|สนใจ|ตกลง|ยืนยัน|คอนเฟิร์ม|โอน|เก็บปลายทาง)/i;
  const productOrQuantitySignal = /(คอต|ชิ้น|กระปุก|ขวด|กล่อง|แพ็ค|แพค|สินค้า|รุ่น|สี|ตัว|\d+\s*(คอต|ชิ้น|ขวด|กล่อง|แพ็ค|แพค)?)/i;
  const deliverySignal = /(0\d{8,9}|เบอร์|โทร|ที่อยู่|บ้านเลขที่|หมู่|ต\.|อ\.|จ\.|รหัสไปรษณีย์|ปลายทาง|จัดส่ง)/i;
  const isOrderSignal = (value: string) => {
    const normalized = value.replace(/[\u200b\s]+/g, " ").trim();
    if (codSignal.test(normalized)) return true;
    return (intentSignal.test(normalized) && (productOrQuantitySignal.test(normalized) || deliverySignal.test(normalized))) || (productOrQuantitySignal.test(normalized) && deliverySignal.test(normalized));
  };
  for (const message of selected) {
    const key = `${message.pageId}::${message.threadId}`;
    const group = groups.get(key) ?? { pageId: message.pageId, pageName: message.pageName ?? message.pageId, threadId: message.threadId, customerName: message.customerName ?? message.senderName ?? "ไม่ระบุลูกค้า", customerId: message.senderType === "customer" ? message.senderId : "", customerMessages: 0, pageMessages: 0, orderSignals: 0, latestAt: message.occurredAt, snippets: [] };
    if (message.senderType === "customer") { group.customerMessages += 1; if (message.text && isOrderSignal(message.text)) { group.orderSignals += 1; if (group.snippets.length < 3) group.snippets.push(message.text.slice(0, 180)); } }
    else group.pageMessages += 1;
    if ((Date.parse(message.occurredAt ?? "") || 0) > (Date.parse(group.latestAt ?? "") || 0)) group.latestAt = message.occurredAt;
    if (!group.customerName || group.customerName === "ไม่ระบุลูกค้า") group.customerName = message.customerName ?? message.senderName ?? group.customerName;
    groups.set(key, group);
  }
  const threads = Array.from(groups.values()).sort((a, b) => (b.orderSignals - a.orderSignals) || ((Date.parse(b.latestAt ?? "") || 0) - (Date.parse(a.latestAt ?? "") || 0)));
  return { date, totalMessages: selected.length, customerMessages: selected.filter(message => message.senderType === "customer").length, pageMessages: selected.filter(message => message.senderType === "page").length, threadCount: threads.length, orderSignalThreads: threads.filter(thread => thread.orderSignals > 0).length, threads, generatedAt: new Date().toISOString() };
}

function bangkokDateKey(value: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(parsed);
  const match = value.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (!match) return "";
  let year = Number(match[3]);
  if (year < 100) year += 2000;
  if (year > 2400) year -= 543;
  return `${year.toString().padStart(4, "0")}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

export async function fetchDailyOrderHistory(date: string, search?: string) {
  const orders = await fetchLiveOrders(search);
  const filtered = orders.filter(order => [order.order_date, order.order_time, order.created_at].some(value => bangkokDateKey(value) === date));
  return { date, total: filtered.length, orders: filtered, source: "canonical_orders" as const, generatedAt: new Date().toISOString() };
}

export async function fetchCustomerChatEvidence(pageId: string, threadId: string, limit = 500) {
  const { baseUrl, key } = config();
  const params = new URLSearchParams({
    select: "id,source_message_id,dedupe_key,page_id,page_name,conversation_key,customer_id,customer_name,sender_id,sender_name,message_text,message_type,attachments_json,image_urls,has_image,attachment_count,occurred_at,source_created_at,first_seen_at,last_seen_at,raw_payload",
    page_id: `eq.${pageId}`,
    conversation_key: `eq.${threadId}`,
    order: "occurred_at.asc",
    limit: String(limit),
  });
  const response = await fetch(`${baseUrl}/rest/v1/chat_customer_evidence?${params}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!response.ok) {
    if (response.status === 404 || response.status === 42) return [];
    throw new Error(`Supabase chat_customer_evidence returned HTTP ${response.status}`);
  }
  return response.json() as Promise<Array<Record<string, unknown>>>;
}

/**
 * Conversation evidence for the order dialog. This intentionally reads both
 * chat projections so the page's final order-summary message is not lost.
 * The immutable customer-only ledger remains separate for audit purposes.
 */
export async function fetchConversationEvidence(pageId: string, threadId: string, limit = 500) {
  const messages = await fetchExternalChatMessages(pageId, threadId, limit);
  return messages
    .sort((a, b) => (Date.parse(String(a.occurredAt ?? "")) || 0) - (Date.parse(String(b.occurredAt ?? "")) || 0))
    .map((message, index) => ({
      id: `${message.senderType}-${message.providerMessageId || index}`,
      source_message_id: message.providerMessageId,
      dedupe_key: message.providerMessageId ? `meta:${message.providerMessageId}` : null,
      page_id: message.pageId,
      page_name: message.pageName,
      conversation_key: message.threadId,
      customer_name: message.customerName,
      sender_name: message.senderName,
      speaker_type: message.senderType,
      side: message.side,
      message_text: message.text,
      attachments_json: message.attachmentsJson,
      occurred_at: message.occurredAt,
      source_created_at: message.occurredAt,
    }));
}

export async function syncProductAliasToMaster(input: { alias: string; canonicalSku: string }) {
  const { baseUrl, key } = config();
  const filter = encodeURIComponent(input.canonicalSku);
  const response = await fetch(`${baseUrl}/rest/v1/product_master?select=id,sku,alias&sku=eq.${filter}&limit=1`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!response.ok) throw new Error(`Supabase product_master lookup returned HTTP ${response.status}`);
  const rows = await response.json() as Array<{ id: number; sku: string; alias: string | null }>;
  const row = rows[0];
  if (!row) throw new Error(`ไม่พบ SKU ${input.canonicalSku} ใน product_master`);
  const aliases = String(row.alias ?? "").split(/[,\n|]+/).map(value => value.trim()).filter(Boolean);
  if (!aliases.some(value => value.toLowerCase() === input.alias.trim().toLowerCase())) aliases.push(input.alias.trim());
  const update = await fetch(`${baseUrl}/rest/v1/product_master?id=eq.${row.id}`, { method: "PATCH", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ alias: aliases.join(", ") }) });
  if (!update.ok) throw new Error(`Supabase product_master update returned HTTP ${update.status}`);
  return { synced: true, sku: row.sku, aliasCount: aliases.length };
}

export async function fetchLiveThreads(search?: string) {
  const externalMessages = await fetchExternalChatMessages();
  const allMessages = externalMessages;
  const groups = new Map<string, LiveThread>();
  const latestDirections = new Map<string, { inbound: number; outbound: number }>();
  for (const message of allMessages) {
    const key = `${message.pageId}::${message.threadId}`;
    const messageAt = String(message.occurredAt ?? "");
    const existing = groups.get(key);
    const thread: LiveThread = existing ?? {
      key,
      pageName: message.pageName ?? message.pageId,
      pageId: message.pageId,
      threadId: message.threadId,
      customerId: message.senderType === "customer" ? message.senderId : null,
      latestAt: messageAt,
      latestOrderNumber: "",
      customerName: message.customerName ?? (message.senderType === "customer" ? message.senderName : null),
      chatTimeline: [],
      preview: message.text ?? "มีรูปภาพแนบ",
      orderCount: 0,
      unread: false,
      sentCount: 0,
      messageCount: 0,
      orders: [],
      searchText: "",
    };
    if (!thread.customerName && message.customerName) thread.customerName = message.customerName;
    if (!thread.customerId && message.senderType === "customer" && message.senderId) thread.customerId = message.senderId;
    if ((Date.parse(messageAt) || 0) > (Date.parse(String(thread.latestAt ?? "")) || 0)) {
      thread.latestAt = messageAt;
      thread.preview = message.text ?? "มีรูปภาพแนบ";
    }
    if (message.direction === "outbound") thread.sentCount += 1;
    thread.messageCount += 1;
    thread.searchText = `${thread.searchText} ${message.text ?? ""}`.trim();
    const directionState = latestDirections.get(key) ?? { inbound: 0, outbound: 0 };
    const timestamp = Date.parse(messageAt) || 0;
    if (message.senderType === "customer") directionState.inbound = Math.max(directionState.inbound, timestamp);
    if (message.senderType === "page") directionState.outbound = Math.max(directionState.outbound, timestamp);
    latestDirections.set(key, directionState);
    groups.set(key, thread);
  }
  groups.forEach((thread, key) => {
    const directionState = latestDirections.get(key);
    thread.unread = Boolean(directionState && directionState.inbound > directionState.outbound);
  });
  let orders: LiveOrder[] = [];
  try {
    orders = await fetchLiveOrders(search);
  } catch (error) {
    console.warn("[NIGHTOPS] Chat Hub loaded without order enrichment:", error instanceof Error ? error.message : String(error));
  }
  for (const order of orders) {
    const key = `${order.page_id ?? ""}::${order.thread_id ?? order.threadId ?? ""}`;
    const thread = groups.get(key);
    if (!thread) continue;
    thread.orders.push(order);
    thread.orderCount += 1;
    if (!thread.latestOrderNumber) thread.latestOrderNumber = order.order_number;
  }
  return Array.from(groups.values()).sort((a, b) => (Date.parse(String(b.latestAt ?? "")) || 0) - (Date.parse(String(a.latestAt ?? "")) || 0));
}
