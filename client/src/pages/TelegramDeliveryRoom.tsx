import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getActiveCamp, readCanonicalOrders } from "@/lib/canonical";
import { CheckCircle2, Clipboard, Clock3, Eye, FileWarning, MessageSquareText, RefreshCw, Send, ShieldAlert, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

const DEFAULT_HEADER = "🚀 [บิลสมบูรณ์ - READY]";

type OrderRow = Record<string, any>;

function isSent(row: OrderRow) {
  const status = String(row.telegram_status ?? "").trim().toLowerCase();
  const sent = String(row.telegram_sent ?? "").trim().toLowerCase();
  return ["1", "true", "t", "sent", "delivered", "ไปแล้วไปลับ"].includes(status) || ["1", "true", "t", "sent"].includes(sent);
}

function realTime(row: OrderRow) {
  return row.order_time || row.order_message_created_at || row.order_close_time_from_chat || row.created_at || null;
}

function displayTime(row: OrderRow) {
  return row.order_time_display || (realTime(row) ? new Date(realTime(row)).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", hour12: false }) : "ไม่พบเวลาจริง");
}

function productOf(row: OrderRow) {
  return String(row.alien_display_with_quantity || row.master_display_for_packer || row.display_for_packer || row.items_text || row.product_name || row.sku || "ยังไม่มีข้อมูลสินค้า").trim();
}

function cleanEvidence(row: OrderRow) {
  return String(row.raw_text_with_phone_timed || row.raw_text_with_phone || row.raw_text || row.source_text || row.single_cleaned_block || "ไม่พบแชทต้นทางในแถวนี้").trim();
}

function addressOf(row: OrderRow) {
  return String(row.master_delivery_address || row.address_display_packer || row.addressclean || row.full_address || row.address_display_primary || "ยังไม่มีที่อยู่").trim();
}

function provinceOf(row: OrderRow) {
  return String(row.province || row.master_province || "ไม่ระบุจังหวัด").trim();
}

function telegramText(row: OrderRow, header: string) {
  const customer = row.master_customer_name || row.customer_name || row.facebook_name || "";
  const phone = row.master_customer_phone || row.phone || row.extracted_phone || "";
  const orderNumber = row.order_number_display || row.order_number || "";
  const time = row.order_time_display || "";
  return [
    header,
    "━━━━━━━━━━━━━━━━━━━━",
    time && `⏰ วันที่สั่งซื้อ : ${time}`,
    orderNumber && `🆔 เลขออเดอร์ : ${orderNumber}`,
    row.page_name && `📢 PAGE : ${row.page_name}`,
    customer && `👤 FB : ${customer}`,
    "━━━━━━━━━━━━━━━━━━━━",
    customer,
    phone,
    addressOf(row),
    "━━━━━━━━━━━━━━━━━━━━",
    "📦 รายการสินค้าสำหรับจัดของ",
    productOf(row),
  ].filter(Boolean).join("\n");
}

function issueOf(row: OrderRow) {
  const issues: string[] = [];
  if (!row.upsert_key) issues.push("ไม่มี upsert_key");
  if (!productOf(row) || productOf(row).includes("ยังไม่มี")) issues.push("ไม่พบสินค้า");
  if (!addressOf(row) || addressOf(row).includes("ยังไม่มี")) issues.push("ไม่พบที่อยู่");
  if (!row.mapping_status && !row.web_mapping_status) issues.push("ยังไม่ระบุผลแมป");
  return issues;
}

export default function TelegramDeliveryRoom() {
  const [header, setHeader] = useState(DEFAULT_HEADER);
  const [selected, setSelected] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showEvidence, setShowEvidence] = useState(true);
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: ["telegram-delivery-room", getActiveCamp()],
    queryFn: () => readCanonicalOrders(search),
    refetchInterval: 180_000,
  });

  const allOrders = (query.data?.orders ?? []) as OrderRow[];
  const waiting = useMemo(() => allOrders.filter((row) => !isSent(row)).sort((a, b) => new Date(realTime(b) || 0).getTime() - new Date(realTime(a) || 0).getTime()), [allOrders]);
  const order = waiting[selected];
  const message = useMemo(() => order ? telegramText(order, header || DEFAULT_HEADER) : "คิวว่าง — ไม่มีออเดอร์รอส่ง", [order, header]);
  const selectedIssues = order ? issueOf(order) : [];

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

  return (
    <div className="min-h-full space-y-5 text-white">
      <header className="relative overflow-hidden rounded-3xl border border-orange-400/25 bg-[#100b08] p-6 shadow-2xl shadow-orange-950/30">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-300"><Send className="mr-2 inline h-4 w-4" />TELEGRAM DELIVERY · {getActiveCamp()}</p>
            <h1 className="cyber-title mt-3 text-3xl font-semibold">ห้องตรวจและส่ง Telegram</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-orange-100/60">คิวเรียงตามเวลาสั่งซื้อจริง · ตรวจหลักฐานแชทเทียบข้อมูลแต่งหล่อ · ส่งแล้วต้องตัดออกจากคิว</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />ระบบอ่านคิวแล้ว</div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-orange-400/15 bg-black/25 p-3"><p className="text-[10px] uppercase tracking-[0.18em] text-orange-200/50">รอส่ง</p><p className="mt-1 text-2xl font-semibold text-orange-200">{waiting.length}</p></div>
          <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-3"><p className="text-[10px] uppercase tracking-[0.18em] text-cyan-200/50">ส่งแล้วในข้อมูลที่อ่าน</p><p className="mt-1 text-2xl font-semibold text-cyan-200">{allOrders.filter(isSent).length}</p></div>
          <div className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-400/5 p-3"><p className="text-[10px] uppercase tracking-[0.18em] text-fuchsia-200/50">อัปเดตล่าสุด</p><p className="mt-1 text-sm font-medium text-fuchsia-100">{query.data?.fetchedAt ? new Date(query.data.fetchedAt).toLocaleTimeString("th-TH") : "ยังไม่อ่าน"}</p></div>
        </div>
      </header>

      <div className="rounded-2xl border border-orange-400/15 bg-[#100d0b] p-4 text-xs leading-6 text-orange-100/65">
        <b className="text-orange-200">กฎห้องนี้</b> · ใช้เวลาสั่งซื้อจริง · สินค้าใช้ Alien/Master ที่อ่านได้ · ข้อมูลดิบจากแชทเก็บไว้ให้เทียบ · ปุ่มคัดลอกไม่เปลี่ยนสถานะ · สถานะส่งสำเร็จต้องมาจากตัวส่งภายนอก
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
              return <button type="button" key={item.upsert_key || item.order_number || item.id || index} onClick={() => setSelected(index)} className={`w-full rounded-2xl border p-3 text-left ${index === selected ? "border-orange-300/70 bg-orange-500/15 shadow-lg shadow-orange-950/20" : "border-white/10 bg-black/20 hover:border-orange-400/30"}`}>
                <div className="flex items-center justify-between gap-2"><span className="font-mono text-xs text-orange-100">{item.order_number || item.upsert_key || `#${item.id ?? "?"}`}</span><span className="text-[10px] text-orange-100/45">{displayTime(item)}</span></div>
                <p className="mt-2 truncate text-xs text-orange-100/70">{productOf(item)}</p>
                <div className="mt-2 flex flex-wrap gap-1.5"><span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-200">รอส่ง</span>{issues.length > 0 && <span className="rounded-full bg-red-400/10 px-2 py-0.5 text-[10px] text-red-200">ต้องตรวจ {issues.length}</span>}</div>
              </button>;
            })}
          </div></CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="rounded-3xl border-orange-400/15 bg-[#100d0b]"><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle className="flex items-center gap-2 text-base text-orange-100"><Eye className="h-4 w-4 text-orange-300" />ข้อมูลแต่งหล่อสำหรับส่ง</CardTitle><div className="flex gap-2"><Button onClick={copyMessage} disabled={!order} className="bg-orange-600 text-white hover:bg-orange-500"><Clipboard className="mr-2 h-4 w-4" />{copied ? "คัดลอกแล้ว" : "คัดลอกทั้งบิล"}</Button><Button variant="outline" onClick={() => setShowEvidence((value) => !value)} disabled={!order} className="border-cyan-400/20 text-cyan-200"><MessageSquareText className="mr-2 h-4 w-4" />{showEvidence ? "ซ่อนแชท" : "ดูแชท"}</Button></div></div></CardHeader><CardContent>
            {order ? <div className="grid gap-4 lg:grid-cols-2"><pre className="min-h-[480px] whitespace-pre-wrap rounded-2xl border border-orange-400/15 bg-black/55 p-5 text-sm leading-7 text-orange-50">{message}</pre><div className="space-y-3"><div className="rounded-2xl border border-orange-400/15 bg-black/25 p-4 text-sm"><p className="text-[10px] uppercase tracking-[0.18em] text-orange-200/45">จุดตรวจ</p><div className="mt-3 space-y-2"><p className="flex items-center gap-2 text-xs text-emerald-200"><CheckCircle2 className="h-4 w-4" />เวลาจริง: {displayTime(order)}</p><p className="flex items-center gap-2 text-xs text-cyan-200"><Sparkles className="h-4 w-4" />สินค้า: {productOf(order)}</p><p className="flex items-center gap-2 text-xs text-orange-100/70"><ShieldAlert className="h-4 w-4" />สถานะข้อมูล: {order.mapping_status || order.web_mapping_status || "ยังไม่ระบุ"}</p>{selectedIssues.length > 0 ? <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-200"><p className="mb-1 flex items-center gap-2 font-semibold"><FileWarning className="h-4 w-4" />พบจุดต้องตรวจ</p>{selectedIssues.map((issue) => <p key={issue}>• {issue}</p>)}</div> : <p className="text-xs text-emerald-200">ไม่พบจุดผิดปกติพื้นฐาน</p>}</div></div><div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-xs leading-6 text-orange-100/65"><b className="text-orange-200">สถานะการส่ง</b><br />{isSent(order) ? "ไปแล้วไปลับ — รายการนี้ถูกทำเครื่องหมายส่งแล้ว" : "รอส่ง — ยังไม่ควรทำเครื่องหมาย SENT ก่อนตัวส่งตอบกลับ"}</div></div></div> : <div className="rounded-2xl border border-dashed border-orange-400/20 p-10 text-center text-sm text-orange-100/55">เลือกออเดอร์จากคิวเพื่อดูรายละเอียด</div>}
          </CardContent></Card>

          {order && showEvidence && <Card className="rounded-3xl border-cyan-400/15 bg-[#0d1015]"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-cyan-100"><MessageSquareText className="h-4 w-4 text-cyan-300" />หลักฐานแชทต้นทาง</CardTitle></CardHeader><CardContent><pre className="max-h-[340px] overflow-auto whitespace-pre-wrap rounded-2xl border border-cyan-400/15 bg-black/45 p-5 text-xs leading-6 text-cyan-50/80">{cleanEvidence(order)}</pre><p className="mt-3 text-xs text-cyan-100/45">ใช้ส่วนนี้เทียบกับข้อมูลแต่งหล่อก่อนคัดลอกหรือส่ง ไม่เขียนทับหลักฐานต้นทาง</p></CardContent></Card>}
        </div>
      </div>

      <Card className="rounded-3xl border-fuchsia-400/15 bg-[#100b15]"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-fuchsia-100"><ShieldAlert className="h-4 w-4 text-fuchsia-300" />สรุปคิวตามจังหวัด</CardTitle></CardHeader><CardContent><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{provinceSummary.length === 0 ? <p className="text-sm text-fuchsia-100/55">ยังไม่มีจังหวัดในคิว</p> : provinceSummary.map(([province, count]) => <div key={province} className="flex items-center justify-between rounded-2xl border border-fuchsia-400/10 bg-black/25 px-4 py-3"><span className="text-sm text-fuchsia-100/75">{province}</span><span className="font-mono text-lg text-fuchsia-200">{count}</span></div>)}</div><p className="mt-4 text-xs text-fuchsia-100/40">จังหวัดอยู่ด้านล่างเพื่อไม่แย่งความสำคัญจากงานตรวจและส่งออเดอร์</p></CardContent></Card>
    </div>
  );
}
