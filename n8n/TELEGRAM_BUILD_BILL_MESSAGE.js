// n8n Code node: TELEGRAM_BUILD_BILL_MESSAGE
// Mode: Run Once for All Items
// Input: normalized order rows containing order_items[]
// Output: Telegram-ready HTML message in telegram_text plus a stable send key.

const text = value => String(value ?? "").trim();
const esc = value => text(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;");
const arr = value => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch {}
  }
  return [];
};
const amount = value => value == null || value === "" ? "-" : Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 });
const itemsFrom = row => arr(row.order_items ?? row.items_json ?? row.items ?? row.product_items);
const itemLabel = (item, index) => {
  const label = text(item.label_display ?? item.display_for_packer ?? item.product_name ?? item.th_name ?? item.sku ?? item.raw_product_text) || `ITEM_${index + 1}`;
  const quantity = Number(item.quantity ?? item.qty ?? item.extracted_qty ?? 1) || 1;
  return `${label} ${quantity} คอต`;
};

return $input.all().map(input => {
  const row = input.json ?? {};
  const items = itemsFrom(row);
  const orderNumber = text(row.order_number ?? row.order_number_display ?? row.upsert_key ?? `ORDER-${row.id ?? "UNKNOWN"}`);
  const customer = text(row.customer_name ?? row.facebook_name) || "ไม่ระบุชื่อ";
  const phone = text(row.phone ?? row.extracted_phone) || "ไม่ระบุเบอร์";
  const address = text(row.address_for_bill ?? row.full_address ?? row.address_display_packer ?? row.addressclean) || "ไม่ระบุที่อยู่";
  const zipcode = text(row.zipcode);
  const addressLine = zipcode && !address.endsWith(zipcode) ? `${address} ${zipcode}` : address;
  const cod = row.cod_amount ?? row.raw_cod_amount ?? row.expected_cod;
  const pageName = text(row.page_name ?? row.assigned_hashtag);
  const facebook = text(row.facebook_name);
  const time = text(row.order_time_display ?? row.order_time ?? row.time_th);
  const status = text(row.raw_order_status ?? row.order_status) || "ปิดยอดสำเร็จ";
  const itemLines = items.length ? items.map(itemLabel).join("\n") : "REVIEW: ไม่พบรายการสินค้า";
  const plainCopy = [
    `🚀 [บิลสมบูรณ์ - ${status}]`,
    "━━━━━━━━━━━━━━━━━━━━",
    time ? `⏰ เวลาสั่งซื้อ: ${time}` : "",
    `🆔 เลขออเดอร์: ${orderNumber}`,
    pageName ? `📢 ชื่อเพจ: ${pageName}` : "",
    facebook ? `👤 Facebook: ${facebook}` : "",
    `💰 ยอด COD: ${amount(cod)} บาท`,
    "━━━━━━━━━━━━━━━━━━━━",
    customer,
    phone,
    addressLine,
    `📦 รายการสินค้า:\n${itemLines}`,
    "━━━━━━━━━━━━━━━━━━━━",
  ].filter(Boolean).join("\n");
  const telegramText = [
    `🚀 <b>[บิลสมบูรณ์ - ${esc(status)}]</b>`,
    "━━━━━━━━━━━━━━━━━━━━",
    time ? `⏰ <b>เวลาสั่งซื้อ:</b> ${esc(time)}` : "",
    `🆔 <b>เลขออเดอร์:</b> <code>${esc(orderNumber)}</code>`,
    pageName ? `📢 <b>ชื่อเพจ:</b> ${esc(pageName)}` : "",
    facebook ? `👤 <b>Facebook:</b> ${esc(facebook)}` : "",
    `💰 <b>ยอด COD:</b> <code>${esc(amount(cod))}</code> บาท`,
    "━━━━━━━━━━━━━━━━━━━━",
    `<code>${esc(customer)}</code>`,
    `<code>${esc(phone)}</code>`,
    `<code>${esc(addressLine)}</code>`,
    "📦 <b>รายการสินค้า:</b>",
    `<code>${esc(itemLines)}</code>`,
    "━━━━━━━━━━━━━━━━━━━━",
  ].filter(Boolean).join("\n");
  return { json: {
    ...row,
    telegram_text: telegramText,
    telegram_copy_text: plainCopy,
    telegram_message: telegramText,
    telegram_parse_mode: "HTML",
    telegram_status: row.telegram_status === "REVIEW" ? "REVIEW" : "READY_TO_SEND",
    telegram_sent: false,
    telegram_send_key: `telegram:${row.id ?? row.upsert_key ?? orderNumber}`,
    telegram_body: {
      order_number: orderNumber,
      customer_name: customer,
      phone,
      address: addressLine,
      cod_amount: cod ?? null,
      items: items,
      item_count: items.length,
    },
    built_at: new Date().toISOString(),
  } };
});

// Telegram node settings:
// - Resource: Message
// - Operation: Send Message
// - Chat ID: {{$json.telegram_chat_id || $env.TELEGRAM_ORDER_CHAT_ID}}
// - Text: {{$json.telegram_text}}
// - Parse Mode: HTML
// Only continue to the send node when telegram_status is READY_TO_SEND.
