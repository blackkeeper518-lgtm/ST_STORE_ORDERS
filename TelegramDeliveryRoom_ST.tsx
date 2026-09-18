import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getActiveCamp, readCanonicalOrders } from "@/lib/canonical";
import { Clipboard, Eye, RefreshCw, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

const DEFAULT_HEADER = "🚀 [บิลสมบูรณ์ - READY]";

function alreadySent(row: Record<string, any>) {
  const value = String(row.telegram_status ?? "").trim().toLowerCase();
  return value === "1" || value === "sent" || value === "delivered" || value === "ไปแล้วไปลับ" || row.telegram_sent === true;
}

function productOf(row: Record<string, any>) {
  const master = String(row.master_display_for_packer ?? "").trim();
  const quantity = String(row.master_qty ?? "").trim();
  return [master, quantity && `${quantity} คอต`].filter(Boolean).join(" ");
}

function addressOf(row: Record<string, any>) {
  return row.master_delivery_address || "";
}

function telegramText(row: Record<string, any>, header: string) {
  const customer = row.master_customer_name || row.facebook_name || "";
  const phone = row.master_customer_phone || "";
  const orderNumber = row.order_number_display || "";
  const orderTime = row.order_time_display || "";
  const cod = row.cod_amount;
  const stockNotice = String(row.alien_out_of_stock_notices ?? "").trim();
  return [
    stockNotice || header,
    "━━━━━━━━━━━━━━━━━━━━",
    orderTime && `⏰ ${orderTime}`,
    orderNumber && `🆔 ${orderNumber}`,
    row.page_name && `📢 ${row.page_name}`,
    customer && `👤 ${customer}`,
    cod != null && `💰 COD: ${cod} บาท`,
    "━━━━━━━━━━━━━━━━━━━━",
    customer,
    phone,
    addressOf(row) && `📍 ${addressOf(row)}`,
    "━━━━━━━━━━━━━━━━━━━━",
    "📦 รายการสินค้าสำหรับจัดของ:",
    productOf(row),
  ].filter(Boolean).join("\n");
}

export default function TelegramDeliveryRoom() {
  const [header, setHeader] = useState(DEFAULT_HEADER);
  const [selected, setSelected] = useState(0);
  const [copied, setCopied] = useState(false);
  const query = useQuery({
    queryKey: ["telegram-delivery-room", getActiveCamp()],
    queryFn: () => readCanonicalOrders(""),
    refetchInterval: 180_000,
  });
  const allOrders = query.data?.orders ?? [];
  const waiting = useMemo(() => allOrders.filter((row: any) => !alreadySent(row)), [allOrders]);
  const order = waiting[selected] as Record<string, any> | undefined;
  const message = useMemo(() => order ? telegramText(order, header || DEFAULT_HEADER) : "คิวว่าง — ไม่มีออเดอร์รอส่ง", [order, header]);

  useEffect(() => {
    if (selected >= waiting.length && waiting.length > 0) setSelected(waiting.length - 1);
    if (waiting.length === 0) setSelected(0);
  }, [selected, waiting.length]);

  async function copyMessage() {
    if (!order) return;
    await navigator.clipboard?.writeText(message);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return <div className="min-h-full space-y-5 text-white">
    <header className="rounded-3xl border border-orange-400/20 bg-[#100c0a] p-6 shadow-2xl shadow-orange-950/20">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-300"><Send className="mr-2 inline h-4 w-4" />TELEGRAM DELIVERY · {getActiveCamp()}</p>
      <h1 className="mt-3 text-3xl font-semibold">ห้องส่ง Telegram</h1>
      <p className="mt-2 text-sm leading-6 text-orange-100/60">สถานะ 1 = ส่งแล้ว • ส่งแล้วไม่กลับเข้าคิว • เช็กข้อมูลใหม่ทุก 3 นาที</p>
    </header>

    <div className="rounded-2xl border border-orange-400/15 bg-[#100d0b] p-4 text-xs leading-6 text-orange-100/65">
      <b className="text-orange-200">กฎห้อง Telegram</b> · อ่านจาก View หลักเท่านั้น · หัวบิลใช้เลข `order_number_display` และเวลา `order_time_display` · ลูกค้า/เบอร์/ที่อยู่ใช้ Master · สินค้าใช้ `master_display_for_packer + master_qty + คอต` · ถ้ามี `alien_out_of_stock_notices` ให้ขึ้นแทนหัวบิล · สถานะ `1` ส่งแล้วและตัดออกจากคิว
    </div>

    <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <Card className="rounded-3xl border-orange-400/15 bg-[#100d0b]"><CardHeader><CardTitle className="text-base text-orange-100">คิวรอส่ง</CardTitle></CardHeader><CardContent className="space-y-4">
        <Input value={header} onChange={(event) => setHeader(event.target.value)} className="border-orange-400/20 bg-black/40 text-orange-100" />
        <div className="flex items-center justify-between text-xs text-orange-100/55"><span>รอส่ง {waiting.length} · ส่งแล้ว {allOrders.length - waiting.length}</span><Button size="sm" variant="outline" onClick={() => query.refetch()} className="border-orange-400/20 text-orange-200"><RefreshCw className="mr-1 h-3.5 w-3.5" />รีเฟรช</Button></div>
        <div className="max-h-[540px] space-y-2 overflow-auto">
          {waiting.length === 0 ? <div className="rounded-2xl border border-dashed border-orange-400/20 p-6 text-center text-sm text-orange-100/55">คิวว่างแล้ว</div> : waiting.map((item: any, index: number) => <button type="button" key={item.upsert_key || item.order_number || item.id || index} onClick={() => setSelected(index)} className={`w-full rounded-xl border p-3 text-left ${index === selected ? "border-orange-300/60 bg-orange-500/15" : "border-white/10 bg-black/20 hover:border-orange-400/30"}`}><div className="flex justify-between gap-2"><span className="font-mono text-xs text-orange-100">{item.order_number || item.upsert_key || `#${item.id ?? "?"}`}</span><span className="text-[10px] text-orange-100/45">{item.cod_amount ?? "COD ?"}</span></div><p className="mt-2 truncate text-xs text-orange-100/60">{productOf(item)}</p><p className="mt-1 text-[10px] text-amber-200">รอส่ง</p></button>)}
        </div>
      </CardContent></Card>

      <Card className="rounded-3xl border-orange-400/15 bg-[#100d0b]"><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle className="flex items-center gap-2 text-base text-orange-100"><Eye className="h-4 w-4 text-orange-300" />ตัวอย่างข้อความ</CardTitle><Button onClick={copyMessage} disabled={!order} className="bg-orange-600 text-white hover:bg-orange-500"><Clipboard className="mr-2 h-4 w-4" />{copied ? "คัดลอกแล้ว" : "คัดลอกข้อความ"}</Button></div></CardHeader><CardContent><pre className="min-h-[540px] whitespace-pre-wrap rounded-2xl border border-orange-400/15 bg-black/50 p-5 text-sm leading-7 text-orange-50">{message}</pre><p className="mt-4 text-xs text-orange-100/50">ตัวส่งภายนอกเป็นผู้เขียนสถานะ <b className="text-orange-200">telegram_status = 1</b> หลังส่งสำเร็จ ห้องจะไม่ดึงรายการนี้กลับมาอีก</p></CardContent></Card>
    </div>
  </div>;
}
