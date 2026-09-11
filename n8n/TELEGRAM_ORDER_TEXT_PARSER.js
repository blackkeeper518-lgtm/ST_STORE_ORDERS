// n8n Code node: TELEGRAM_ORDER_TEXT_PARSER
// Mode: Run Once for All Items
// Input: one raw Telegram/order text per item (field: text/message/raw_text)
// Output: one normalized order header with order_items[] and telegram_status="READY"
// Put this before the Supabase upsert into central_order_master.
// The parser is deterministic; keep the original message in source_text.

const clean = value => String(value ?? "")
  .replace(/\\r/g, "")
  .replace(/\\n/g, "\n")
  .replace(/<br\s*\/?\s*>/gi, "\n")
  .replace(/<\/?(?:b|strong)>/gi, "")
  .replace(/&nbsp;/gi, " ")
  .replace(/&amp;/gi, "&")
  .trim();
const first = (...values) => values.find(value => value != null && String(value).trim() !== "");
const numberFrom = value => {
  const match = String(value ?? "").replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
};
const normalizePhone = value => {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) return digits;
  if (digits.length === 11 && digits.startsWith("66")) return `0${digits.slice(2)}`;
  return digits || null;
};
const normalizeSpaces = value => String(value ?? "").replace(/\s+/g, " ").trim();
const stripDecorations = value => normalizeSpaces(String(value ?? "")
  .replace(/^[📦🟢🟩🟥🟨⬛🟣🌈🍉🍓🍇🥭🍏✅☑️🚨✦•→:]+\s*/u, "")
  .replace(/\([^)]*\)/g, "")
  .replace(/[`*]/g, "")
  .trim());

// Extend this map when a new alias is approved. Do not guess unknown products.
const PRODUCT_ALIASES = [
  { sku: "MOND_GREEN", th_name: "ม่อนเขียว", emoji: "🟩", aliases: ["MOND_GREEN", "MOND GREEN", "ม่อนเขียว", "ม่อนเขีย"] },
  { sku: "CAVALLO_TWIN_X_BALL", th_name: "คาวาโล่ม่วง", emoji: "🟣", aliases: ["CAVALLO_TWIN_X_BALL", "คาวาโร่ม่วง", "คาวาโล่ม่วง", "คาม่วง"] },
  { sku: "OS_WATERMELON", th_name: "OSแตงโม", emoji: "🍉", aliases: ["OS_WATERMELON", "OS WATERMELON", "OS แตงโม", "OSแตงโม", "แตงโม", "คาแตงโม"] },
  { sku: "OS_STRAWBERRY", th_name: "OSสตอเบอร์รี่", emoji: "🍓", aliases: ["OS_STRAWBERRY", "OS STRAWBERRY", "สตอเบอร์รี่"] },
  { sku: "OS_BLUEBERRY", th_name: "OSบลูเบอร์รี่", emoji: "🍇", aliases: ["OS_BLUEBERRY", "OS BLUEBERRY", "บลูเบอร์รี่", "บูลเบอร์รี่"] },
  { sku: "OS_MANGO", th_name: "OSมะม่วง", emoji: "🥭", aliases: ["OS_MANGO", "OS MANGO", "มะม่วง"] },
  { sku: "VESS_GREEN", th_name: "เวสเขียว", emoji: "🟩", aliases: ["VESS_GREEN", "VESS GREEN", "เวสเขียว"] },
  { sku: "CHECK_SKU", th_name: "CHECK_SKU", emoji: "📦", aliases: ["CHECK_SKU", "CHECK SKU"] },
];
const aliases = PRODUCT_ALIASES.flatMap(product => product.aliases.map(alias => ({ ...product, alias })))
  .sort((a, b) => b.alias.length - a.alias.length);
const resolveProduct = raw => {
  const value = stripDecorations(raw);
  const comparable = String(raw ?? "")
    .replace(/[`*_<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const upper = value.toUpperCase();
  const comparableUpper = comparable.toUpperCase();
  const found = aliases.find(entry =>
    upper.includes(entry.alias.toUpperCase()) ||
    value.includes(entry.alias) ||
    comparableUpper.includes(entry.alias.toUpperCase()) ||
    comparable.includes(entry.alias)
  );
  return found ?? null;
};

function extractSourceText(row) {
  return clean(first(row.text, row.message, row.raw_text, row.source_text, row.telegram_message, row.body, ""));
}
function extractCodeBlocks(text) {
  return [...text.matchAll(/<code>([\s\S]*?)<\/code>/gi)].map(match => clean(match[1]));
}
function extractFirst(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return normalizeSpaces(match[1]);
  }
  return null;
}
function parseHeader(text) {
  const cod = extractFirst(text, [
    /ยอด(?:รวม\s*)?COD\s*:\s*([\d,]+(?:\.\d+)?)/i,
    /COD\s*:\s*([\d,]+(?:\.\d+)?)/i,
    /ยอด\s*COD\s*[:：]?\s*([\d,]+(?:\.\d+)?)/i,
  ]);
  const phoneRaw = extractFirst(text, [
    /เบอร์(?:โทรศัพท์)?\s*[:：]?\s*([0-9][0-9\-\s]{8,})/i,
    /โทรศัพท์\s*[:：]?\s*([0-9][0-9\-\s]{8,})/i,
    /(?:^|\n)\s*(0\d[\d\-\s]{8,})\s*(?:\n|$)/i,
  ]);
  const orderNumber = extractFirst(text, [
    /เลขที่ออเดอร์\s*[:：]?\s*([^\n]+)/i,
    /เลขออเดอร์\s*[:：]?\s*([^\n]+)/i,
    /\b(20\d{6}-\d{2}[A-Z]{2,5}\d{4})\b/i,
    /\b(ORD-[A-Z0-9-]+)\b/i,
  ]);
  const orderTime = extractFirst(text, [
    /เวลาสั่งซื้อ\s*[:：]?\s*([^\n]+)/i,
    /(?:^|\n)\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\s+\d{1,2}:\d{2}(?::\d{2})?)/i,
  ]);
  const name = extractFirst(text, [
    /ชื่อ-นามสกุล\s*[:：]?\s*([^\n]+)/i,
    /ชื่อ\s*[:：]?\s*([^\n]+)/i,
    /(?:^|\n)\s*👤?\s*ชื่อ\s*[:：]?\s*([^\n]+)/i,
  ]);
  const zipcode = extractFirst(text, [
    /รหัสไปรษณีย์\s*[:：]?\s*(\d{5})/i,
    /ไปรษณีย์\s*[:：]?\s*(\d{5})/i,
    /(?:^|\s)(\d{5})(?:\s|$)/,
  ]);
  const address = extractFirst(text, [
    /ที่อยู่จัดส่ง\s*[:：]?\s*([^\n]+)/i,
    /ที่อยู่\s*[:：]?\s*([^\n]+)/i,
    /📍\s*([^\n]+)/u,
  ]);
  return {
    order_number: orderNumber,
    order_time_display: orderTime,
    customer_name: name ? stripDecorations(name) : null,
    phone: normalizePhone(phoneRaw),
    full_address: address ? normalizeSpaces(address) : null,
    zipcode,
    cod_amount: numberFrom(cod),
  };
}

function parseItems(text) {
  // Prefer the compact structured block when present. It avoids parsing the
  // long evidence copy twice when the message contains both old and new bills.
  const blocks = extractCodeBlocks(text);
  const candidates = blocks.filter(block => /(?:รายการสินค้า|CHECK[_ ]SKU|คอต|ชิ้น)/i.test(block));
  const source = candidates.length ? candidates[candidates.length - 1] : text;
  const lines = source.split("\n").map(line => line.trim()).filter(Boolean);
  const output = [];
  const seen = new Set();
  for (const line of lines) {
    const product = resolveProduct(line);
    if (!product) continue;
    const qtyMatch = line.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*(?:คอต|ชิ้น|ชุด|กล่อง|ลัง)?\s*$/i)
      ?? line.match(/(?:คอต|ชิ้น|ชุด|กล่อง|ลัง)\s*(\d+(?:\.\d+)?)/i);
    const quantity = qtyMatch ? Number(qtyMatch[1]) : 1;
    const key = `${product.sku}:${quantity}:${line}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push({
      line_no: output.length + 1,
      raw_item_text: line,
      raw_product_text: stripDecorations(line),
      sku: product.sku,
      product_id: product.sku,
      product_name: product.th_name,
      th_name: product.th_name,
      label_display: `${product.emoji} ${product.sku}`,
      display_for_packer: `${product.emoji} ${product.sku} ${quantity} คอต`,
      quantity,
      extracted_qty: quantity,
      mapping_status: product.sku === "CHECK_SKU" ? "REVIEW" : "MATCHED",
      match_confidence: product.sku === "CHECK_SKU" ? 0.2 : 0.95,
      match_method: "telegram_alias",
      source_payload_item: { source_line: line },
    });
  }
  return output;
}

const output = [];
for (const input of $input.all()) {
  const row = input.json ?? {};
  const sourceText = extractSourceText(row);
  if (!sourceText) continue;
  const header = parseHeader(sourceText);
  const orderItems = parseItems(sourceText);
  const unresolved = orderItems.filter(item => item.mapping_status !== "MATCHED");
  const totalQuantity = orderItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const upsertKey = first(row.upsert_key, header.order_number, row.source_message_id, row.message_id, `telegram:${header.phone ?? "unknown"}:${header.order_time_display ?? Date.now()}`);
  const displayLines = orderItems.map(item => item.display_for_packer).join("\n");
  output.push({ json: {
    ...row,
    upsert_key: upsertKey,
    source_system: "telegram",
    source_message_id: first(row.source_message_id, row.message_id, null),
    source_text: sourceText,
    ...header,
    order_items: orderItems,
    order_items_preserved: orderItems,
    items_json: orderItems,
    items_text: displayLines || null,
    items_count: orderItems.length,
    item_count: orderItems.length,
    total_quantity: totalQuantity,
    telegram_status: unresolved.length ? "REVIEW" : "READY",
    telegram_sent: false,
    telegram_message: null,
    telegram_chat_id: first(row.telegram_chat_id, row.chat_id, null),
    parser_mode: "TELEGRAM_ORDER_TEXT_V1",
    is_ready_to_pack: Boolean(header.customer_name && header.phone && header.full_address && header.cod_amount != null && orderItems.length && !unresolved.length),
    parse_warnings: [
      ...(header.phone ? [] : ["missing_phone"]),
      ...(header.full_address ? [] : ["missing_address"]),
      ...(header.cod_amount != null ? [] : ["missing_cod"]),
      ...(orderItems.length ? [] : ["missing_order_items"]),
      ...(unresolved.length ? ["unresolved_product_alias"] : []),
    ],
    parsed_at: new Date().toISOString(),
  } });
}
return output;

// Next nodes:
// 1) CENTRAL_ORDER_MASTER_BODY (or an equivalent sanitizer)
// 2) Supabase upsert central_order_master on upsert_key
// 3) TELEGRAM_BUILD_BILL_MESSAGE
// 4) Telegram Send Message
// 5) archive send result, then update telegram_status="SENT", telegram_sent=true
