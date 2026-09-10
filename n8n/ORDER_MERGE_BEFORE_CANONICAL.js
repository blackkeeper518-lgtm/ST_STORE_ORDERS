// n8n Code node: ORDER_MERGE_BEFORE_CANONICAL
// Mode: Run Once for All Items
// Merge all fragments for the same SUPHABASS order before canonical payload/upsert.

const DESK_KEY = "suphabass";
const text = (...values) => values.find(value => value !== undefined && value !== null && String(value).trim())?.toString().trim() ?? "";
const keyOf = row => text(row.upsert_key, row.order_number ? `${DESK_KEY}:order:${row.order_number}` : "", row.message_id, row.source_message_id, `${DESK_KEY}:${row.page_id ?? ""}:${row.thread_id ?? row.conversation_key ?? ""}`);
const asArray = value => Array.isArray(value) ? value : [];
const betterAddress = (current, candidate) => {
  const a = text(current); const b = text(candidate);
  if (!b) return a; if (!a) return b;
  const invalid = ["DATA_MISSING", "[ไม่มีบ้านเลขที่]", "รับครับ", "สนใจครับ", "สนใจคับ"];
  const score = value => { let result = value.length; for (const word of invalid) if (value.includes(word)) result -= 100; if (/\d{5}/.test(value)) result += 80; if (/จ\./.test(value)) result += 30; if (/อ\./.test(value)) result += 20; if (/ต\./.test(value)) result += 20; if (/โทร|เบอร์|\d{10}/.test(value)) result -= 10; return result; };
  return score(b) > score(a) ? b : a;
};
const merge = (target, source) => {
  for (const [field, value] of Object.entries(source)) {
    if (["order_items", "items", "product_items", "items_json"].includes(field)) continue;
    if (value !== undefined && value !== null && String(value).trim() !== "") target[field] = target[field] == null || String(target[field]).trim() === "" ? value : target[field];
  }
  for (const field of ["address_display_packer", "addressclean", "short_address", "full_address"]) target[field] = betterAddress(target[field], source[field]);
  const items = [...asArray(target.order_items), ...asArray(source.order_items ?? source.items ?? source.product_items ?? source.items_json)];
  const seen = new Map();
  for (const item of items) {
    const raw = text(item?.raw_product_text, item?.raw_item_text, item?.product_name, item?.th_name);
    if (!raw) continue;
    const line = Number(item?.line_no ?? seen.size + 1);
    seen.set(`${line}:${raw}`, { ...item, line_no: line, raw_product_text: raw, raw_item_text: text(item?.raw_item_text, raw) });
  }
  target.order_items = [...seen.values()].sort((a, b) => a.line_no - b.line_no).map((item, index) => ({ ...item, line_no: index + 1 }));
  const evidenceAddress = text(target.web_address_primary, target.address_display_full, target.address_display_primary, target.full_address, target.address_display_fallback, target.web_address_fallback, target.web_address_short, target.address_line_1, target.addressclean, target.short_address, target.address_display_packer);
  if (evidenceAddress) { target.address_display_packer = evidenceAddress; target.full_address = evidenceAddress; target.addressclean = evidenceAddress; }
  return target;
};

const groups = new Map();
for (const input of $input.all()) {
  const row = input.json ?? {};
  const key = keyOf(row);
  const current = groups.get(key) ?? { desk_key: DESK_KEY, source_system: DESK_KEY, upsert_key: key, order_items: [] };
  groups.set(key, merge(current, row));
}
return [...groups.values()].map((row, index) => {
  row.order_number = text(row.order_number, `${DESK_KEY.toUpperCase()}-${index + 1}`);
  row.upsert_key = text(row.upsert_key, `${DESK_KEY}:order:${row.order_number}`);
  row.items_json = row.order_items;
  row.items_count = row.order_items.length;
  row.total_quantity = row.order_items.reduce((sum, item) => sum + Number(item.quantity ?? item.qty ?? 1), 0);
  return { json: row };
});
