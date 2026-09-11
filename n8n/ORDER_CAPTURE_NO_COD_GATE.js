// n8n Code node: ORDER_CAPTURE_NO_COD_GATE
// Mode: Run Once for All Items
// Input: items already selected by the order-fetch/parser branch.
// Purpose: preserve every fetched order; COD is a field, never a gate.

const text = value => String(value ?? "").trim();
const bool = value => value === true || value === 1 || value === "1" || value === "true";
return $input.all().map((input, index) => {
  const row = input.json ?? {};
  const sourceText = text(row.source_text ?? row.clean_text ?? row.message_text ?? row.raw_text);
  const codRaw = row.cod_amount ?? row.raw_cod_amount ?? row.expected_cod ?? null;
  const codNumber = codRaw == null || codRaw === "" ? null : Number(String(codRaw).replace(/[^0-9.-]/g, ""));
  const items = Array.isArray(row.order_items) ? row.order_items : Array.isArray(row.items_json) ? row.items_json : [];
  return { json: {
    ...row,
    source_system: text(row.source_system) || "facebook_order_capture",
    source_order_index: index,
    source_text: sourceText || null,
    order_items: items,
    cod_amount: Number.isFinite(codNumber) ? codNumber : null,
    raw_cod_amount: Number.isFinite(codNumber) ? codNumber : null,
    has_cod: Number.isFinite(codNumber),
    // Explicitly do not reject missing COD or COD keywords.
    order_capture_policy: "NO_COD_GATE",
    capture_status: "CAPTURED",
    telegram_sent: bool(row.telegram_sent),
  } };
});

// Next: CENTRAL_ORDER_MASTER_BODY -> upsert central_order_master.
// Filtering should happen only in the upstream Facebook/order extraction branch;
// this node never discards an item.
