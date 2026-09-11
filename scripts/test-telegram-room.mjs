import fs from "node:fs";

const sample = `🚨 [สถานะ: ปิดยอดสำเร็จ!]🚨
เลขที่ออเดอร์: 20260910-01STA0002
เวลาสั่งซื้อ: 10/09/2026 15:05 น.
ยอดรวม COD: 240.-
ชื่อ-นามสกุล: นพเก้า (บังยอด)
เบอร์โทรศัพท์: 0945259369
ที่อยู่จัดส่ง: 460/101 ลานประมูลรถฉัตรแก้ว ม.8 ต.สมอแข อ.เมือง จ.พิษณุโลก
รหัสไปรษณีย์: 65000
รายการสินค้า:
<code>📦 CHECK_SKU 1 คอต
🟩 MOND_GREEN 1 คอต</code>`;

const runNode = (file, input) => {
  const source = fs.readFileSync(file, "utf8");
  const fn = new Function("$input", "$", source);
  return fn({ all: () => input.map(json => ({ json })) }, () => ({}));
};

const parsed = runNode("n8n/TELEGRAM_ORDER_TEXT_PARSER.js", [{ text: sample }]);
const row = parsed[0].json;
if (row.order_items.length !== 2) throw new Error(`Expected 2 order items, got ${row.order_items.length}`);
if (row.order_items[0].sku !== "CHECK_SKU") throw new Error("CHECK_SKU was not preserved");
if (row.order_items[1].sku !== "MOND_GREEN") throw new Error("MOND_GREEN was not mapped");
if (row.telegram_status !== "REVIEW") throw new Error(`Expected REVIEW, got ${row.telegram_status}`);

const built = runNode("n8n/TELEGRAM_BUILD_BILL_MESSAGE.js", [row]);
const bill = built[0].json;
if (!bill.telegram_text.includes("20260910-01STA0002")) throw new Error("Order number missing from Telegram message");
if (!bill.telegram_text.includes("MOND_GREEN")) throw new Error("Product missing from Telegram message");
if (bill.telegram_parse_mode !== "HTML") throw new Error("Parse mode is not HTML");
console.log(JSON.stringify({
  order_number: row.order_number,
  status: row.telegram_status,
  items: row.order_items.map(item => ({ sku: item.sku, quantity: item.quantity, mapping_status: item.mapping_status })),
  telegram_message_preview: bill.telegram_text.slice(0, 220),
}, null, 2));
