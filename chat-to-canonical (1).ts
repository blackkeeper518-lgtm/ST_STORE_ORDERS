import { getSupabase } from "./canonical";

type AnyRow = Record<string, any>;
export type ChatCanonicalResult = { orderId: string | number; upsertKey: string; orderNumber: string; itemCount: number; matchedCount: number; reviewCount: number; items: AnyRow[] };

const norm = (v: unknown) => String(v ?? "").toLowerCase().normalize("NFKC").replace(/[\s_\-.,:;|()[\]{}]+/g, "").trim();
const text = (v: unknown) => String(v ?? "").trim();
const number = (v: unknown) => { const n = Number(String(v ?? "").replace(/,/g, "")); return Number.isFinite(n) ? n : null; };
const splitValues = (v: unknown) => text(v).split(/[,\n|]+/).map(x => x.trim()).filter(Boolean);
const thaiDate = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(d).replace(/-/g, "");
const safeKey = (v: string) => v.replace(/[^a-zA-Z0-9ก-๙_-]+/g, "").slice(0, 90) || "unknown";

function parseCod(s: string) { const hits = s.match(/(?:ยอดรวม\s*)?cod\s*[:=]?\s*\[?\s*([\d,]+(?:\.\d+)?)|เก็บเงินปลายทาง[^\d]{0,20}([\d,]+(?:\.\d+)?)/gi) ?? []; const last = hits.at(-1) ?? ""; const m = last.match(/[\d,]+(?:\.\d+)?/); return m ? number(m[0]) : null; }
function parsePhone(s: string) { const m = s.match(/(?:0\d{9,9})\b/g); return m?.at(-1) ?? ""; }
function parseZip(s: string) { const m = s.match(/\b\d{5}\b/g); return m?.at(-1) ?? ""; }
function parseAddress(s: string, zip: string) { const lines = s.split(/\r?\n/).map(x => x.trim()).filter(Boolean); const picked = lines.filter(x => /(?:ที่อยู่|จัดส่ง|ต\.|อ\.|จ\.|หมู่|ม\.|ถนน|ซอย|แขวง|ตำบล|อำเภอ|จังหวัด)/i.test(x)); const value = picked.join(" ") || lines.filter(x => !/cod|เบอร์|โทร|รายการสินค้า|ขนส่ง/i.test(x)).slice(-3).join(" "); return `${value}${zip && !value.includes(zip) ? ` ${zip}` : ""}`.trim(); }
function parseName(s: string) { const labeled = s.match(/(?:ชื่อ(?:-นามสกุล)?|ผู้รับ)\s*[:：]?\s*([^\n📱📍📮]+)/i)?.[1]; return text(labeled).replace(/เบอร์.*$/i, "").trim(); }

function makeAliasMap(rows: AnyRow[]) { const map = new Map<string, AnyRow>(); for (const row of rows) { const sku = text(row.sku); if (!sku) continue; for (const alias of [...splitValues(row.alias), ...splitValues(row.alias_text), ...splitValues(row.alias_norm), sku, text(row.product_name), text(row.th_name), text(row.label_display)].filter(Boolean)) map.set(norm(alias), row); } return map; }
function extractSegments(s: string) { const re = /(?:^|\s)([🟢🟡🔴🟠🟣🔵🟩🟨🟥🟧🟪🟦🍉🥭🍎🍓🎯])\s*([^\n]*?)(?=\s+[🟢🟡🔴🟠🟣🔵🟩🟨🟥🟧🟪🟦🍉🥭🍎🍓🎯]|$)/g; const values: string[] = []; let match: RegExpExecArray | null; while ((match = re.exec(s))) values.push(text(match[2])); return values.filter(Boolean); }
function quantityOf(raw: string) { const m = raw.match(/(?:x|×|จำนวน|qty)?\s*(\d+(?:\.\d+)?)\s*(?:คอต\.?|กล่อง|ซอง|ชิ้น|ชิ้นงาน)?\s*$/i) ?? raw.match(/(?:x|×|จำนวน|qty)\s*(\d+(?:\.\d+)?)/i); return number(m?.[1]) ?? 1; }
function cleanProduct(raw: string) { return raw.replace(/(?:\d+(?:\.\d+)?\s*(?:คอต\.?|กล่อง|ซอง|ชิ้น)?\s*)$/i, "").trim(); }
function matchItem(raw: string, aliases: Map<string, AnyRow>, masters: AnyRow[]) { const candidate = cleanProduct(raw); const direct = aliases.get(norm(candidate)) ?? Array.from(aliases.entries()).find(([key]) => key && (norm(candidate).includes(key) || key.includes(norm(candidate))))?.[1]; if (direct) return { master: direct, method: "ALIAS_OR_MASTER_EXACT", confidence: 0.99 }; const fuzzy = masters.find(p => [p.sku, p.product_name, p.th_name, p.label_display, p.name_standard].some(v => norm(candidate).includes(norm(v)) && norm(v).length >= 3)); return fuzzy ? { master: fuzzy, method: "PRODUCT_MASTER_TEXT", confidence: 0.86 } : { master: null, method: "REVIEW", confidence: 0 };
}

export async function createCanonicalFromChat(input: { pageId: string; threadId: string; pageName?: string; customerName?: string }): Promise<ChatCanonicalResult> {
  const api = getSupabase(); if (!api) throw new Error("ยังไม่ได้เชื่อม Supabase");
  const [{ data: customers, error: ce }, { data: pages, error: pe }, { data: aliasRows, error: ae }, { data: masters, error: me }] = await Promise.all([
    api.from("chat_customer_messages").select("*").eq("page_id", input.pageId).eq("conversation_key", input.threadId).order("occurred_at", { ascending: true }),
    api.from("chat_page_messages").select("*").eq("page_id", input.pageId).eq("conversation_key", input.threadId).order("occurred_at", { ascending: true }),
    api.from("product_map_master").select("*"),
    api.from("product_master").select("*")
  ]);
  if (ce) throw ce; if (pe) throw pe; if (ae) throw ae; if (me) throw me;
  const rows: AnyRow[] = ([...(customers ?? []).map((r: AnyRow) => ({ ...r, actor: "customer" })), ...(pages ?? []).map((r: AnyRow) => ({ ...r, actor: "page" }))] as AnyRow[]).sort((a, b) => new Date(a.occurred_at ?? a.created_at ?? 0).getTime() - new Date(b.occurred_at ?? b.created_at ?? 0).getTime());
  const fullText = rows.map(r => text(r.message_text ?? r.text)).filter(Boolean).join("\n");
  const latest = rows.at(-1); const cod = parseCod(fullText); const phone = parsePhone(fullText); const zip = parseZip(fullText); const name = input.customerName || rows.find(r => r.customer_name)?.customer_name || parseName(fullText) || "ไม่ระบุชื่อ"; const address = parseAddress(fullText, zip); const aliases = makeAliasMap(aliasRows ?? []); const masterList = masters ?? [];
  const rawSegments = extractSegments(fullText); const fallback = rawSegments.length ? rawSegments : (fullText.match(/(?:รายการสินค้า|สินค้า)\s*[:：]?\s*([^\n]+)/i)?.[1] ? [RegExp.$1] : []); const segments = fallback.length ? fallback : [];
  const items = segments.map((raw, index) => { const qty = quantityOf(raw); const found = matchItem(raw, aliases, masterList); const p = found.master; return { line_no: index + 1, raw_product_text: raw, raw_item_text: raw, raw_product_text_norm: norm(cleanProduct(raw)), sku: text(p?.sku), product_id: p?.id ?? null, product_name: text(p?.product_name ?? p?.th_name ?? p?.label_display), th_name: text(p?.th_name ?? p?.product_name), label_display: text(p?.label_display ?? p?.display_for_packer ?? p?.name_standard), display_for_packer: text(p?.display_for_packer ?? p?.label_display ?? p?.product_name ?? raw), quantity: qty, extracted_qty: qty, unit_price: number(p?.unit_price ?? p?.price), expected_cod: p && number(p.unit_price ?? p.price) != null ? qty * Number(p.unit_price ?? p.price) : null, mapping_status: p ? "MATCHED" : "REVIEW", match_status: p ? "MATCHED" : "REVIEW", match_confidence: found.confidence, match_method: found.method, candidate_skus: p?.sku ? [{ sku: p.sku, confidence: found.confidence, method: found.method }] : [], source_payload_item: { raw_text: raw, alias_source: p?.sku ? "product_map_master/product_master" : "UNMATCHED" } }; });
  const sourceText = fullText; const upsertKey = `chat_${safeKey(input.pageId)}_${safeKey(input.threadId)}`; const orderNumber = `CHAT-${thaiDate()}-${safeKey(input.threadId).slice(-10)}`; const now = new Date().toISOString();
  const header: AnyRow = { upsert_key: upsertKey, order_number: orderNumber, order_time: latest?.occurred_at ?? now, page_id: input.pageId, page_name: input.pageName ?? latest?.page_name ?? "", thread_id: input.threadId, conversation_key: input.threadId, customer_name: name, phone, phone_norm: phone, full_address: address, address_display_primary: address, address_display_fallback: address, zipcode: zip, cod_amount: cod, expected_cod: cod, source_text: sourceText, raw_text_with_phone_timed: rows.map(r => `${r.occurred_at ?? now} [${r.actor === "page" ? "เพจ" : "ลูกค้า"}: ${text(r.message_text ?? r.text)}]`).join("\n"), source_payload: { source: "daily_chat_summary", page_id: input.pageId, thread_id: input.threadId, messages: rows }, order_status: "CHAT_EXTRACTED", view_status: "PENDING", history_status: "PENDING", created_at: now, updated_at: now };
  const { data: saved, error: saveError } = await api.from("canonical_orders").upsert(header, { onConflict: "upsert_key" }).select("id").single(); if (saveError) throw saveError; const orderId = saved.id;
  if (items.length) { const payload = items.map(item => ({ ...item, order_id: orderId, created_at: now, updated_at: now, ingested_at: now })); const { error: itemError } = await api.from("canonical_order_items").upsert(payload, { onConflict: "order_id,line_no" }); if (itemError) throw itemError; }
  return { orderId, upsertKey, orderNumber, itemCount: items.length, matchedCount: items.filter(i => i.mapping_status === "MATCHED").length, reviewCount: items.filter(i => i.mapping_status !== "MATCHED").length, items };
}
