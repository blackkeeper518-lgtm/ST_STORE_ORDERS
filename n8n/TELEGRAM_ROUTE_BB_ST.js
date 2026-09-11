// n8n Code node: TELEGRAM_ROUTE_BB_ST
// Input: built bill rows from central_order_master.
// Output: route metadata for the Telegram node. This node does not send.

const text = value => String(value ?? "").trim();
const rows = $input.all();
return rows.map(input => {
  const row = input.json ?? {};
  const store = text(row.store_id ?? row.desk_key ?? row.brand ?? row.source_store).toLowerCase();
  const pageId = text(row.page_id);
  const isST = store === "st" || store.includes("singto") || [
    "148670205004124", "1021039111094473", "144448588753724",
    "1123283834192813", "111653921912793", "1188184524374748",
  ].includes(pageId);
  const target = isST ? "ST" : "BB";
  const chatId = isST
    ? text(row.telegram_chat_id ?? $env.TELEGRAM_ST_ORDER_CHAT_ID)
    : text(row.telegram_chat_id ?? $env.TELEGRAM_BB_ORDER_CHAT_ID);
  return { json: {
    ...row,
    store_id: isST ? "st" : "bb",
    telegram_target_group: target,
    telegram_chat_id: chatId || null,
    telegram_route_status: chatId ? "READY" : "MISSING_CHAT_ID",
    telegram_send_allowed: Boolean(chatId && row.telegram_text && row.telegram_status !== "REVIEW"),
  } };
});

// Telegram node: Chat ID {{$json.telegram_chat_id}}, Text {{$json.telegram_text}}, Parse Mode HTML.
// Configure TELEGRAM_BB_ORDER_CHAT_ID and TELEGRAM_ST_ORDER_CHAT_ID in n8n credentials/env.
