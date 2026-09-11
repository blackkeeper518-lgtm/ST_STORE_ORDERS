// n8n Code node: 🌌 HERMES_CHAT_RAW_ALL - CHAT ONLY MODE
// ไม่ทำออเดอร์ ไม่ทำ 87 คอลัมน์ มีเฉพาะข้อมูลแชทที่จำเป็น
// Mode: Run Once for All Items

const output = [];
const seen = new Set();

const MASTERCONFIG = [
  { page_id: "103411062505149", page_name: "🎀BBεїзเบอร์หนึ่งสโตร์" },
  { page_id: "113923148350742", page_name: "🎶BB ↠ STORE" },
  { page_id: "111414924711459", page_name: "🍇BBสโตร์." },
  { page_id: "1047257891810878", page_name: "💗Bb store๐" },
  { page_id: "1064404466767377", page_name: "เจ๊บี 🅱🅱" },
  { page_id: "1235719106287717", page_name: "🛒ร้าน:เจ๊บี" },
  { page_id: "1032290633303246", page_name: "💬ร้าน:เจ๊ B" },
  { page_id: "148670205004124", page_name: "🔥สิงโตสโตร์" },
  { page_id: "1021039111094473", page_name: "🧸SINGTO STORE" },
  { page_id: "144448588753724", page_name: "🍊สิงโตสโตร์" },
  { page_id: "1123283834192813", page_name: "🏀สิงโต-สโตร์" },
  { page_id: "111653921912793", page_name: "🛕ST singto" },
  { page_id: "1188184524374748", page_name: "🤠ร้าน:ลุงสิงโต" },
];
const PAGE_MAP = new Map(MASTERCONFIG.map(page => [String(page.page_id), page.page_name]));

function getThreads(value) {
  if (Array.isArray(value?.data)) return value.data;
  if (value && typeof value === "object" && Object.keys(value).every(key => /^\d+$/.test(key))) return Object.values(value);
  if (Array.isArray(value)) return value;
  return [value];
}

for (const item of $input.all()) {
  const inputPageId = String(item.json?.page_id ?? item.json?.pageId ?? item.json?.Page_ID ?? item.json?.page?.id ?? "");
  const inputPageName = String(item.json?.page_name ?? item.json?.pageName ?? item.json?.Page_Name ?? item.json?.page?.name ?? "");
  if (inputPageId && !PAGE_MAP.has(inputPageId)) PAGE_MAP.set(inputPageId, inputPageName || inputPageId);
  const source = item.json?.facebook_response ?? item.json?.response ?? item.json;
  const threads = getThreads(source);

  for (const thread of threads) {
    if (!thread) continue;
    const participants = thread.participants?.data ?? [];
    const messages = thread.messages?.data ?? thread.data?.data ?? [];
    const conversationId = String(thread.id ?? "");

    for (const message of messages) {
      if (!message?.id || seen.has(message.id)) continue;
      seen.add(message.id);

      const text = String(message.message ?? "").trim();
      if (!text) continue;

      let pageId = inputPageId || String(thread.page_id ?? thread.pageId ?? thread.page?.id ?? "");
      let pageName = inputPageName || String(thread.page_name ?? thread.pageName ?? thread.page?.name ?? "");
      for (const participant of participants) {
        const participantId = String(participant?.id ?? "");
        if (PAGE_MAP.has(participantId)) {
          pageId = participantId;
          pageName = PAGE_MAP.get(participantId) ?? "";
          break;
        }
      }

      // Facebook payloads may carry the page on the thread/item but not in
      // the static BB map. Preserve that page instead of dropping the room.
      if (!pageId) {
        const pageParticipant = participants.find(participant =>
          participant?.type === "page" || participant?.is_page === true || participant?.role === "page"
        );
        if (pageParticipant) {
          pageId = String(pageParticipant.id ?? "");
          pageName = String(pageParticipant.name ?? pageId);
          PAGE_MAP.set(pageId, pageName);
        }
      }

      const fromId = String(message.from?.id ?? "");
      const isPage = fromId === pageId;
      const customer = participants.find(participant => String(participant?.id ?? "") !== pageId) ?? message.from;
      const createdAt = message.created_time ?? new Date().toISOString();

      output.push({
        json: {
          Page_ID: pageId,
          Page_Name: pageName,
          page_id: pageId,
          page_name: pageName,
          conversation_id: conversationId,
          customer_name: customer?.name ?? message.from?.name ?? "",
          customer_id: customer?.id ?? "",
          message_id: message.id,
          message_text: text,
          speaker: isPage ? "page" : "customer",
          message_from_name: message.from?.name ?? "",
          time: createdAt,
          time_th: new Date(createdAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }),
        },
      });
    }
  }
}

return output;

// Customer branch: filter speaker == "customer" → chat_customer_messages
// Page branch: filter speaker == "page" → chat_page_messages
// Dedupe source: message_id
