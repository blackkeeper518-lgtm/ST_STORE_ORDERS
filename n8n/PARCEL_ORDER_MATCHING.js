// n8n Code node: parcel-order-matching
// Mode: Run Once for All Items
// Input: parcel rows. Provide candidate orders/customers in each row when available.
// Output: one auditable parcel_order_matches payload per parcel.

const text = value => String(value ?? "").trim();
const digits = value => text(value).replace(/\D/g, "");
const phone = value => { const raw = digits(value); return raw.startsWith("66") ? `0${raw.slice(2)}` : raw; };
const address = value => text(value).toLowerCase().replace(/แขวง|ตำบล|ต\.|เขต|อำเภอ|อ\.|จังหวัด|จ\./g, "").replace(/[^0-9ก-๙a-z]/gi, "");
const amount = value => { const n = Number(String(value ?? "").replace(/[^0-9.-]/g, "")); return Number.isFinite(n) ? n : null; };
const list = value => Array.isArray(value) ? value : [];
const scoreCandidate = (parcel, order) => {
  let score = 0; const evidence = [];
  const pPhone = phone(parcel.phone_number ?? parcel.phone);
  const oPhone = phone(order.phone);
  if (pPhone && oPhone && pPhone === oPhone) { score += 55; evidence.push({ field: "phone", weight: 55, value: pPhone }); }
  const pPost = text(parcel.postcode ?? parcel.zipcode ?? parcel.postal_code);
  const oPost = text(order.zipcode ?? order.postcode);
  if (pPost && oPost && pPost === oPost) { score += 15; evidence.push({ field: "postcode", weight: 15, value: pPost }); }
  const pAddress = address(parcel.address);
  const oAddress = address(order.full_address ?? order.address);
  if (pAddress && oAddress) {
    const tokens = oAddress.match(/[0-9]+|[ก-๙a-z]{3,}/gi) ?? [];
    const hits = tokens.filter(token => pAddress.includes(token)).length;
    if (tokens.length && hits / tokens.length >= 0.5) { score += 20; evidence.push({ field: "address", weight: 20, hits, total: tokens.length }); }
    else if (hits > 0) { score += 10; evidence.push({ field: "address_partial", weight: 10, hits, total: tokens.length }); }
  }
  const pCod = amount(parcel.cod_amount ?? parcel.cod);
  const oCod = amount(order.cod_amount ?? order.expected_cod);
  if (pCod != null && oCod != null && Math.abs(pCod - oCod) < 0.01) { score += 10; evidence.push({ field: "cod", weight: 10, value: pCod }); }
  return { order, score, evidence };
};
const status = score => score >= 75 ? "matched" : score > 0 ? "review" : "unmatched";
const out = [];
for (const input of $input.all()) {
  const parcel = input.json ?? {};
  const candidates = list(parcel.candidate_orders ?? parcel.orders ?? parcel.order_candidates);
  const ranked = candidates.map(order => scoreCandidate(parcel, order)).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  const matchStatus = best ? status(best.score) : "unmatched";
  out.push({ json: {
    record_type: "parcel_order_match",
    parcel_id: parcel.id,
    tracking_number: firstNonEmpty(parcel.tracking_number, parcel.tracking_no),
    order_id: best?.order?.id ?? best?.order?.order_id ?? null,
    order_number: best?.order?.order_number ?? null,
    customer_id: best?.order?.customer_id ?? null,
    match_method: best?.evidence.map(item => item.field).join("+") || "no_candidate",
    match_score: best?.score ?? 0,
    match_status: matchStatus,
    match_evidence: best?.evidence ?? [],
    candidate_count: ranked.length,
    matched_at: new Date().toISOString(),
  }});
}
return out;
function firstNonEmpty(...values) { return values.find(value => text(value) !== "") ?? null; }

// Run daily at 19:00. Before this node, query candidate orders by date/postcode/COD
// and attach them to each parcel as candidate_orders[]. Never auto-promote REVIEW.
