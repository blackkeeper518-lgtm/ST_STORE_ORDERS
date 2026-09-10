// n8n Code node: FILTER_EMPTY_CANONICAL_ITEMS
// Place immediately before the canonical_order HTTP Request.
// Only rows explicitly marked COD with an amount >= 200 enter the master table.

const keep = [];
for (const item of $input.all()) {
  const row = item.json ?? {};
  const raw = JSON.stringify(row);
  const hasCodWord = /\bCOD\b/i.test(raw) || /ซีโอดี|เก็บปลายทาง/i.test(raw);
  const cod = Number(row.cod_amount ?? 0);
  const hasCodFlag = row.has_cod === true || row.has_cod === 1 || row.has_cod === 'true';
  if ((hasCodFlag || hasCodWord) && Number.isFinite(cod) && cod >= 200) keep.push(item);
}
return keep;
