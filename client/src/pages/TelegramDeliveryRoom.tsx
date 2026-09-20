import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getActiveCamp, readTelegramDeliveryOrders } from "@/lib/canonical";
import { AlertTriangle, CheckCircle2, Clipboard, Clock3, Eye, FileWarning, MessageSquareText, RefreshCw, Send, ShieldAlert, Sparkles, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTelegramBody, sendTelegramFromN8n } from "@/lib/telegramDelivery";

const DEFAULT_HEADER = "🚀 [บิลสมบูรณ์ - READY]";

type OrderRow = Record<string, any>;

function isSent(row: OrderRow) {
  const status = String(row.telegram_status ?? "").trim().toLowerCase();
  const sent = String(row.telegram_sent ?? "").trim().toLowerCase();
  return ["1", "true", "t", "sent", "delivered", "ไปแล้วไปลับ"].includes(status) || ["1", "true", "t", "sent"].includes(sent);
}

function deliveryStatus(row: OrderRow) {
  return isSent(row)
    ? { label: "ไปแล้วไปลับ", slogan: "ไปแล้วไม่กลับ — ค่อยแวะมาใหม่", tone: "border-orange-300/60 bg-orange-500/15 text-orange-200" }
    : { label: "รอส่ง", slogan: "ยังอยู่ในห้องรอจัดส่ง", tone: "border-amber-300/40 bg-amber-500/10 text-amber-200" };
}

function realTime(row: OrderRow) {
  return row.order_time || row.order_message_created_at || row.facebook_message_created_at || row.facebook_created_at || row.fb_created_at || row.order_close_time_from_chat || null;
}

function displayTime(row: OrderRow) {
  return row.order_time_display || (realTime(row) ? new Date(realTime(row)).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", hour12: false }) : "ไม่พบเวลาจริง");
}

function productOf(row: OrderRow) {
  const canonicalItems = Array.isArray(row.items) ? row.items : [];
  const canonicalDisplay = canonicalItems.map((item: OrderRow) => item.master_display_for_packer || item.display_for_packer || item.label_display || item.master_sku || item.sku).filter(Boolean).join("\n");
  return evidenceText(canonicalDisplay) || evidenceText(row.master_display_for_packer) || evidenceText(row.n8n_product_display) || evidenceText(row.single_cleaned_products) || evidenceText(row.items_text) || evidenceText(row.display_for_packer) || evidenceText(row.product_name) || evidenceText(row.sku) || "ยังไม่มีข้อมูลสินค้า";
}

function evidenceText(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(evidenceText).filter(Boolean).join("\n");
  if (typeof value === "object") return Object.entries(value as Record<string, unknown>).map(([key, item]) => `${key}: ${evidenceText(item)}`).join("\n");
  return String(value);
}

function cleanEvidence(row: OrderRow) {
  return evidenceText(row.normalized_chat_timeline) || evidenceText(row.product_evidence) || evidenceText(row.raw_product_evidence) || evidenceText(row.raw_text_with_phone_timed) || evidenceText(row.raw_text_with_phone) || evidenceText(row.raw_text) || evidenceText(row.source_text) || evidenceText(row.single_cleaned_block) || "ไม่พบแชทต้นทางในแถวนี้";
}

function laneOf(row: OrderRow) {
  const text = `${row.sku || ""} ${row.product_name || ""} ${row.th_name || ""} ${productOf(row)}`.toLowerCase();
  if (/green|เขียว|cool|เย็น|mond_green/.test(text)) return { label: "โซนเย็น", mark: "ICE", tone: "border-cyan-300/70 bg-cyan-400/15 text-cyan-100 shadow-[0_0_24px_rgba(40,220,255,.28)]" };
  if (/red|ร้อน|hot|เผ็ด|mond_red/.test(text)) return { label: "โซนร้อน", mark: "HEAT", tone: "border-amber-300/70 bg-amber-400/15 text-amber-100 shadow-[0_0_24px_rgba(255,170,40,.3)]" };
  return { label: "โซนผลไม้", mark: "FRESH", tone: "border-fuchsia-300/70 bg-fuchsia-500/15 text-fuchsia-100 shadow-[0_0_24px_rgba(255,70,180,.28)]" };
}

function addressOf(row: OrderRow) {
  return String(row.master_delivery_address || row.address_display_packer || row.addressclean || row.full_address || row.address_display_primary || "ยังไม่มีที่อยู่").trim();
}

function provinceOf(row: OrderRow) {
  return String(row.province || row.master_province || "ไม่ระบุจังหวัด").trim();
}

function telegramText(row: OrderRow, header: string) {
  // Use the SQL-built canonical message when available; do not rebuild over it.
  const dynamic = evidenceText(row.telegram_message_dynamic);
  if (dynamic) return dynamic;
  const customer = row.master_customer_name || row.customer_name || row.facebook_name || "";
  const phone = row.master_customer_phone || row.phone || row.extracted_phone || "";
  const cod = row.cod_amount ?? row.expected_cod ?? row.total_cod;
  const orderNumber = row.order_number_display || row.order_number || "";
  const time = row.order_time_display || "";
  return [row.telegram_header || row.product_header || row.bill_header || header, "━━━━━━━━━━━━━━━━━━━━", time && `⏰ วันที่สั่งซื้อ : ${time}`, orderNumber && `🆔 เลขออเดอร์ : ${orderNumber}`, row.page_name && `📢 PAGE : ${row.page_name}`, customer && `👤 FB : ${customer}`, cod !== null && cod !== undefined && cod !== "" && `💰 ยอด COD : ${cod} บาท`, "━━━━━━━━━━━━━━━━━━━━", customer, phone, addressOf(row), "━━━━━━━━━━━━━━━━━━━━", "📦 รายการสินค้าสำหรับจัดของ", productOf(row)].filter(Boolean).join("\n");
}

function mappingLabel(row: OrderRow) {
  if (row.master_matched === true || String(row.mapping_status_fast ?? "").toUpperCase() === "MAPPED_FROM_PRODUCT_MASTER" || String(row.master_display_for_packer ?? "").trim()) return "MAPPED_FROM_PRODUCT_MASTER";
  return String(row.mapping_status || row.web_mapping_status || "REVIEW_PRODUCT");
}

function issueOf(row: OrderRow) {
  const issues: string[] = [];
  if (!row.upsert_key) issues.push("ไม่มี upsert_key");
  if (!productOf(row) || productOf(row).includes("ยังไม่มี")) issues.push("ไม่พบสินค้า");
  if (!addressOf(row) || addressOf(row).includes("ยังไม่มี")) issues.push("ไม่พบที่อยู่");
  if (!row.mapping_status && !row.web_mapping_status) issues.push("ยังไม่ระบุผลแมป");
  return issues;
}

function warningOf(row: OrderRow) {
  const warnings: string[] = [];
  const stock = String(row.stock_status || row.stock_state || row.inventory_status || "").toLowerCase();
  const cod = Number(row.cod_amount);
  const qty = Number(row.total_quantity ?? row.quantity ?? row.extracted_qty ?? row.qty);
  const address = addressOf(row);
  const phone = String(row.master_customer_phone || row.phone || row.extracted_phone || "").replace(/\D/g, "");
  const raw = String(row.raw_text_with_phone_timed || row.raw_text || row.source_text || "");
  const outOfStock = stock.includes("out") || stock.includes("หมด") || row.is_out_of_stock === true || Number(row.stock_qty) === 0;
  if (outOfStock) warnings.push(String(row.master_stock_notice || "❌สินค้าหมดแล้วแม่❌ ตรวจคำเตือนจาก Product Master"));
  if (row.change_order_24h === true || row.order_change_detected === true || /CHANGE ORDER|แก้ไขออเดอร์/i.test(String(row.warning_tag || row.audit_flags || ""))) warnings.push("🔄 [CHANGE ORDER] ตรวจพบการแก้ไขออเดอร์ใน 24 ชม.");
  if (row.duplicate_order_15m === true || row.duplicate_detected === true || /DUPLICATE|ยิงออเดอร์ซ้ำ/i.test(String(row.warning_tag || row.audit_flags || ""))) warnings.push("🔁 [DUPLICATE] ตรวจพบการยิงออเดอร์ซ้ำภายใน 15 นาที");
  if (row.blacklist === true || row.blacklisted === true || /BLACKLIST|แบล็กลิสต์/i.test(String(row.warning_tag || row.audit_flags || ""))) warnings.push("⛔ [BLACKLIST] ลูกค้ามีประวัติแบล็กลิสต์ไม่รับของ");
  if (!String(row.master_customer_name || row.customer_name || row.facebook_name || "").trim()) warnings.push("👥 ชื่อผู้รับไม่มี");
  if (!Number.isFinite(cod) || row.cod_amount == null || String(row.cod_amount).trim() === "") warnings.push("💰 ยอด COD ไม่ครบ");
  else { if (cod < 200 && cod > 0) warnings.push("⚠️ ยอด COD ต่ำกว่าเกณฑ์ (< 200 บาท)"); if (qty === 1 && cod > 500) warnings.push("🧂 ยอด COD สูงเกินราคา 1 คอต"); if (cod < 0 || cod > 10000) warnings.push("🚨 [ANOMALY COD] ยอด COD ผิดปกติ"); }
  if (!address || address.includes("ยังไม่มี") || !String(row.zipcode || "").match(/^[0-9]{5}$/)) warnings.push("📍 ข้อมูลที่อยู่ไม่สมบูรณ์ (รหัสไปรษณีย์ไม่ถูกต้อง)");
  if (address.length < 15 || !/[0-9]/.test(address)) warnings.push("📝 ที่อยู่สั้นผิดปกติ/ขาดบ้านเลขที่");
  if (phone.length !== 10) warnings.push("📱 เบอร์โทรศัพท์ไม่ถูกต้อง/ไม่ครบ 10 หลัก");
  if (row.high_risk_area === true || /พื้นที่เสี่ยงสูง|RISK AREA/i.test(String(row.warning_tag || row.audit_flags || raw))) warnings.push("พื้นที่เสี่ยงสูงสินค้าโดนขโมย");
  if (row.order_summary_status === "ERROR" || row.summary_status === "ERROR" || row.bot_summary_status === "ERROR") warnings.push("🤖 บอทสรุปออเดอร์มีปัญหา");
  return warnings;
}

export default function TelegramDeliveryRoom() {
  const [header, setHeader] = useState(DEFAULT_HEADER);
  const [selected, setSelected] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showEvidence, setShowEvidence] = useState(true);
  const [search, setSearch] = useState("");
  const [sendMessage, setSendMessage] = useState("");
  const query = useQuery({
    queryKey: ["telegram-delivery-room", getActiveCamp()],
    queryFn: () => readTelegramDeliveryOrders(search, "queue"),
    refetchInterval: 180_000,
  });

  const allOrders = (query.data?.orders ?? []) as OrderRow[];
  const waiting = useMemo(() => allOrders.filter((row) => !isSent(row)).sort((a, b) => new Date(realTime(b) || 0).getTime() - new Date(realTime(a) || 0).getTime()), [allOrders]);
  const order = waiting[selected];
  const message = useMemo(() => order ? telegramText(order, header || DEFAULT_HEADER) : "คิวว่าง — ไม่มีออเดอร์รอส่ง", [order, header]);
  const telegramSelection = useMemo(() => order ? ({ text: message, source: "CANONICAL_DYNAMIC" as const, dirty: false, body: getTelegramBody(order) }) : null, [order, message]);
  const selectedIssues = order ? issueOf(order) : [];
  const selectedWarnings = order ? warningOf(order) : [];
  const warningCount = waiting.reduce((sum, row) => sum + warningOf(row).length, 0);
  const lane = order ? laneOf(order) : { label: "ยังไม่เลือกโซน", mark: "WAIT", tone: "border-cyan-300/50 bg-cyan-400/10 text-cyan-200" };

  const provinceSummary = useMemo(() => {
    const map = new Map<string, number>();
    waiting.forEach((row) => map.set(provinceOf(row), (map.get(provinceOf(row)) ?? 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [waiting]);

  useEffect(() => {
    if (selected >= waiting.length) setSelected(Math.max(0, waiting.length - 1));
  }, [selected, waiting.length]);

  async function copyMessage() {
    if (!order) return;
    await navigator.clipboard?.writeText(message);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function sendCurrentOrder() {
    if (!order || !telegramSelection || selectedWarnings.length > 0 || selectedIssues.length > 0) { setSendMessage("ยังส่งไม่ได้: กรุณาแก้คำเตือน/จุดต้องตรวจก่อน"); return; }
    setSendMessage("กำลังส่ง Telegram...");
    try {
      await sendTelegramFromN8n(order, telegramSelection);
      setSendMessage("ส่ง Telegram สำเร็จ — รอระบบบันทึกสถานะ SENT");
      void query.refetch();
    } catch (error) {
      setSendMessage(`ส่งไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return (
    <div className="min-h-full space-y-5 text-white">
      <header className="relative overflow-hidden rounded-3xl border border-orange-400/25 bg-[#100b08] p-6 shadow-2xl shadow-orange-950/30">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-300"><Send className="mr-2 inline h-4 w-4" />TELEGRAM DELIVERY · {getActiveCamp()}</p>
            <h1 className="cyber-title mt-3 text-3xl font-semibold">ห้องตรวจและส่ง Telegram</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-orange-100/60">ป้ายหัวบิลชัดเจน · สถานะส่งเด่น · เตือนสินค้าหมด ยอดไม่ครบ และที่อยู่ไม่ครบก่อนส่ง</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />ระบบทำงานปกติ · Live</div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-orange-400/15 bg-black/25 p-3"><p className="text-[10px] uppercase tracking-[0.18em] text-orange-200/50">รอส่ง</p><p className="mt-1 text-2xl font-semibold text-orange-200">{waiting.length}</p></div>
          <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-3"><p className="text-[10px] uppercase tracking-[0.18em] text-cyan-200/50">ส่งแล้วในข้อมูลที่อ่าน</p><p className="mt-1 text-2xl font-semibold text-cyan-200">{allOrders.filter(isSent).length}</p></div>
          <div className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-400/5 p-3"><p className="text-[10px] uppercase tracking-[0.18em] text-fuchsia-200/50">อัปเดตล่าสุด</p><p className="mt-1 text-sm font-medium text-fuchsia-100">{query.data?.fetchedAt ? new Date(query.data.fetchedAt).toLocaleTimeString("th-TH") : "ยังไม่อ่าน"}</p></div>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-orange-300/25 bg-orange-400/10 p-4 text-xs leading-6 text-orange-50/80"><p className="mb-1 flex items-center gap-2 font-semibold text-orange-200"><Zap className="h-4 w-4" />ลำดับสำคัญของห้องนี้</p><b className="text-white">ป้ายหัวบิล → สถานะส่ง → คำเตือน → ข้อมูลสินค้า/ที่อยู่</b><p className="mt-1 text-orange-100/55">พบคำเตือนในคิว {warningCount} จุด · ปุ่มคัดลอกไม่เปลี่ยนสถานะ</p></div>
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-xs leading-6 text-cyan-50/75"><p className="mb-1 flex items-center gap-2 font-semibold text-cyan-200"><AlertTriangle className="h-4 w-4" />กติกาความปลอดภัย</p>ส่งสำเร็จต้องมาจากตัวส่งภายนอกเท่านั้น · ข้อมูลดิบจากแชทไม่ถูกเขียนทับ</div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className={`rounded-2xl border-2 px-4 py-3 text-center ${lane.tone}`}><p className="text-[10px] uppercase tracking-[0.22em] opacity-70">PACKING ZONE</p><p className="mt-1 text-xl font-black">▣ {lane.label}</p><p className="mt-1 text-[10px] font-bold tracking-[0.28em] opacity-70">{lane.mark}</p></div>
        <div className={`rounded-2xl border-2 px-4 py-3 text-center ${order ? deliveryStatus(order).tone : "border-amber-300/40 bg-amber-400/10 text-amber-200"}`}><p className="text-[10px] uppercase tracking-[0.22em] opacity-70">DELIVERY STATUS</p><p className="mt-1 text-xl font-black">{order ? deliveryStatus(order).label : "รอเลือกออเดอร์"}</p></div>
        <div className="rounded-2xl border-2 border-cyan-300/50 bg-cyan-400/10 px-4 py-3 text-center text-cyan-100 shadow-[0_0_24px_rgba(40,220,255,.2)]"><p className="text-[10px] uppercase tracking-[0.22em] opacity-70">COD</p><p className="mt-1 text-xl font-black">{order?.cod_amount != null ? `${order.cod_amount} บาท` : "ไม่ระบุ"}</p></div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[350px_1fr]">
        <Card className="rounded-3xl border-orange-400/15 bg-[#100d0b]">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2 text-base text-orange-100"><Clock3 className="h-4 w-4 text-orange-300" />คิวตามเวลาจริง</CardTitle><Button size="sm" variant="outline" onClick={() => query.refetch()} className="border-orange-400/20 text-orange-200"><RefreshCw className="mr-1 h-3.5 w-3.5" />รีเฟรช</Button></div>
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาเลขออเดอร์ / ลูกค้า / สินค้า" className="border-orange-400/20 bg-black/40 text-orange-100 placeholder:text-orange-100/30" />
            <div className="flex items-center justify-between text-xs text-orange-100/55"><span>แสดง {waiting.length} รายการ</span><span className="font-mono">ใหม่สุดอยู่บน</span></div>
          </CardHeader>
          <CardContent><div className="max-h-[640px] space-y-2 overflow-auto pr-1">
            {query.isLoading && <div className="rounded-2xl border border-dashed border-orange-400/20 p-6 text-center text-sm text-orange-100/55">กำลังอ่านห้อง...</div>}
            {query.error && <div className="rounded-2xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-200">อ่านข้อมูลไม่สำเร็จ: {String(query.error.message)}</div>}
            {!query.isLoading && !query.error && waiting.length === 0 && <div className="rounded-2xl border border-dashed border-emerald-400/20 p-6 text-center text-sm text-emerald-200/70">คิวว่างแล้ว</div>}
            {waiting.map((item, index) => {
              const issues = issueOf(item);
              const warnings = warningOf(item);
              return <button type="button" key={item.upsert_key || item.order_number || item.id || index} onClick={() => setSelected(index)} className={`w-full rounded-2xl border p-3 text-left ${index === selected ? "border-orange-300/70 bg-orange-500/15 shadow-lg shadow-orange-950/20" : "border-white/10 bg-black/20 hover:border-orange-400/30"}`}>
                <div className="flex items-center justify-between gap-2"><span className="font-mono text-xs text-orange-100">{item.order_number || item.upsert_key || `#${item.id ?? "?"}`}</span><span className="text-[10px] text-orange-100/45">{displayTime(item)}</span></div>
                <p className="mt-2 truncate text-xs text-orange-100/70">{productOf(item)}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5"><span className={`rounded-full border px-2 py-0.5 text-[10px] ${deliveryStatus(item).tone}`}>{deliveryStatus(item).label}</span>{warnings.length > 0 && <span className="rounded-full border border-red-300/30 bg-red-400/10 px-2 py-0.5 text-[10px] text-red-200">เตือน {warnings.length}</span>}{issues.length > 0 && <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-200">ตรวจ {issues.length}</span>}</div><p className="mt-1 text-[10px] text-orange-100/40">{deliveryStatus(item).slogan}</p>
              </button>;
            })}
          </div></CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="rounded-3xl border-orange-400/15 bg-[#100d0b]"><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle className="flex items-center gap-2 text-base text-orange-100"><Eye className="h-4 w-4 text-orange-300" />ข้อมูลแต่งหล่อสำหรับส่ง</CardTitle><div className="flex flex-wrap gap-2"><Button onClick={sendCurrentOrder} disabled={!order || sendMessage === "กำลังส่ง Telegram..."} className="bg-emerald-600 text-white hover:bg-emerald-500"><Send className="mr-2 h-4 w-4" />{sendMessage === "กำลังส่ง Telegram..." ? "กำลังส่ง..." : "กดส่ง Telegram"}</Button><Button onClick={copyMessage} disabled={!order} variant="outline" className="border-orange-400/20 text-orange-200"><Clipboard className="mr-2 h-4 w-4" />{copied ? "คัดลอกแล้ว" : "คัดลอกทั้งบิล"}</Button><Button variant="outline" onClick={() => setShowEvidence((value) => !value)} disabled={!order} className="border-cyan-400/20 text-cyan-200"><MessageSquareText className="mr-2 h-4 w-4" />{showEvidence ? "ซ่อนแชท" : "ดูแชท"}</Button></div></div>{sendMessage && <p className={`mt-3 rounded-xl border p-3 text-xs ${sendMessage.includes("สำเร็จ") ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : "border-red-400/25 bg-red-400/10 text-red-200"}`}>{sendMessage}</p>}</CardHeader><CardContent>
            {order ? <div className="grid gap-4 lg:grid-cols-2"><pre className="min-h-[480px] whitespace-pre-wrap rounded-2xl border border-orange-400/15 bg-black/55 p-5 text-sm leading-7 text-orange-50">{message}</pre><div className="space-y-3"><div className="rounded-2xl border border-orange-400/15 bg-black/25 p-4 text-sm"><p className="text-[10px] uppercase tracking-[0.18em] text-orange-200/45">จุดตรวจ</p><div className="mt-3 space-y-2"><p className="flex items-center gap-2 text-xs text-emerald-200"><CheckCircle2 className="h-4 w-4" />เวลาจริง: {displayTime(order)}</p><p className="flex items-center gap-2 text-xs text-cyan-200"><Sparkles className="h-4 w-4" />สินค้า: {productOf(order)}</p><p className="flex items-center gap-2 text-xs text-orange-100/70"><ShieldAlert className="h-4 w-4" />สถานะข้อมูล: {mappingLabel(order)}</p>{selectedWarnings.length > 0 && <div className="rounded-xl border border-red-300/30 bg-red-400/10 p-3 text-xs text-red-100"><p className="mb-1 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" />คำเตือนระบบ</p>{selectedWarnings.map((warning) => <p key={warning}>• {warning}</p>)}</div>}{selectedIssues.length > 0 ? <div className="rounded-xl border border-amber-300/20 bg-amber-400/10 p-3 text-xs text-amber-100"><p className="mb-1 flex items-center gap-2 font-semibold"><FileWarning className="h-4 w-4" />พบจุดต้องตรวจ</p>{selectedIssues.map((issue) => <p key={issue}>• {issue}</p>)}</div> : selectedWarnings.length === 0 && <p className="text-xs text-emerald-200">ไม่พบคำเตือนพื้นฐาน</p>}</div></div><div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-xs leading-6 text-orange-100/65"><b className="text-orange-200">สถานะการส่ง</b><br /><span className={`inline-flex rounded-full border px-2.5 py-1 text-sm font-semibold ${deliveryStatus(order).tone}`}>{deliveryStatus(order).label}</span><p className="mt-2">{deliveryStatus(order).slogan}</p><p className="mt-1">{isSent(order) ? "รายการนี้ถูกทำเครื่องหมายส่งแล้ว" : "ยังไม่ควรทำเครื่องหมาย SENT ก่อนตัวส่งตอบกลับ"}</p></div></div></div> : <div className="rounded-2xl border border-dashed border-orange-400/20 p-10 text-center text-sm text-orange-100/55">เลือกออเดอร์จากคิวเพื่อดูรายละเอียด</div>}
          </CardContent></Card>

          {order && showEvidence && <Card className="rounded-3xl border-cyan-400/15 bg-[#0d1015]"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-cyan-100"><MessageSquareText className="h-4 w-4 text-cyan-300" />หลักฐานแชทต้นทาง</CardTitle></CardHeader><CardContent><pre className="max-h-[340px] overflow-auto whitespace-pre-wrap rounded-2xl border border-cyan-400/15 bg-black/45 p-5 text-xs leading-6 text-cyan-50/80">{cleanEvidence(order)}</pre><p className="mt-3 text-xs text-cyan-100/45">ใช้ส่วนนี้เทียบกับข้อมูลแต่งหล่อก่อนคัดลอกหรือส่ง ไม่เขียนทับหลักฐานต้นทาง</p></CardContent></Card>}
        </div>
      </div>

      <Card className="rounded-3xl border-fuchsia-400/15 bg-[#100b15]"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-fuchsia-100"><ShieldAlert className="h-4 w-4 text-fuchsia-300" />สรุปคิวตามจังหวัด</CardTitle></CardHeader><CardContent><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{provinceSummary.length === 0 ? <p className="text-sm text-fuchsia-100/55">ยังไม่มีจังหวัดในคิว</p> : provinceSummary.map(([province, count]) => <div key={province} className="flex items-center justify-between rounded-2xl border border-fuchsia-400/10 bg-black/25 px-4 py-3"><span className="text-sm text-fuchsia-100/75">{province}</span><span className="font-mono text-lg text-fuchsia-200">{count}</span></div>)}</div><p className="mt-4 text-xs text-fuchsia-100/40">จังหวัดอยู่ด้านล่างเพื่อไม่แย่งความสำคัญจากงานตรวจและส่งออเดอร์</p></CardContent></Card>
    </div>
  );
}
