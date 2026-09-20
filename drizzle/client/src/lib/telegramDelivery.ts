export type TelegramBody = {
  chat_id?: string | number;
  text?: string;
  parse_mode?: string;
  disable_web_page_preview?: boolean;
  reply_markup?: unknown;
};
export type TelegramDeliveryRow = Record<string, any>;
export type TelegramMessageSource = "N8N_PAYLOAD" | "CANONICAL_DYNAMIC" | "WEB_OVERRIDE" | "FALLBACK";
export type TelegramMessageSelection = { text: string; source: TelegramMessageSource; dirty: boolean; body: TelegramBody | null };
function asRecord(value: unknown): TelegramBody | null { return value && typeof value === "object" && !Array.isArray(value) ? value as TelegramBody : null; }
export function getTelegramBody(row: TelegramDeliveryRow): TelegramBody | null { return asRecord(row.telegram_body ?? row.telegramBody); }
export function getTelegramChatId(row: TelegramDeliveryRow): string { const body = getTelegramBody(row); return String(body?.chat_id ?? row.telegram_chat_id ?? row.chat_id ?? "").trim(); }
export function hasWebOverride(row: TelegramDeliveryRow): boolean { return row.telegram_message_source === "WEB_OVERRIDE" || row.telegram_message_dirty === true || Boolean(String(row.manual_telegram_text ?? "").trim()); }
export function selectTelegramMessage(row: TelegramDeliveryRow, rebuiltText?: string | null): TelegramMessageSelection {
  const body = getTelegramBody(row); const n8nText = String(body?.text ?? row.telegram_text ?? "").trim(); const overrideText = String(rebuiltText ?? row.manual_telegram_text ?? "").trim();
  if (hasWebOverride(row) && overrideText) return { text: overrideText, source: "WEB_OVERRIDE", dirty: true, body };
  if (n8nText) return { text: n8nText, source: "N8N_PAYLOAD", dirty: false, body };
  return { text: "ยังไม่มีข้อความ Telegram จาก n8n", source: "FALLBACK", dirty: false, body };
}
export function buildTelegramSendPayload(row: TelegramDeliveryRow, selection: TelegramMessageSelection) {
  const body = selection.body ?? {}; const chatId = getTelegramChatId(row);
  if (!chatId || /^REPLACE_WITH_/i.test(chatId)) throw new Error("ยังไม่มี Telegram chat_id จริง");
  if (!selection.text || selection.source === "FALLBACK") throw new Error("ยังไม่มีข้อความ Telegram ที่ส่งได้");
  return { chat_id: chatId, text: selection.text, parse_mode: body.parse_mode ?? "HTML", disable_web_page_preview: body.disable_web_page_preview ?? true, ...(body.reply_markup == null ? {} : { reply_markup: body.reply_markup }), order_key: row.upsert_key ?? row.order_number ?? row.id ?? null, message_source: selection.source };
}
export async function sendTelegramFromN8n(row: TelegramDeliveryRow, selection: TelegramMessageSelection) {
  const webhookUrl = String(import.meta.env.VITE_TELEGRAM_SEND_WEBHOOK_URL ?? "").trim();
  if (!webhookUrl) throw new Error("ยังไม่ได้ตั้งค่า VITE_TELEGRAM_SEND_WEBHOOK_URL");
  const response = await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildTelegramSendPayload(row, selection)) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(String(result?.message ?? result?.error ?? `ส่ง Telegram ไม่สำเร็จ (${response.status})`));
  return result;
}
