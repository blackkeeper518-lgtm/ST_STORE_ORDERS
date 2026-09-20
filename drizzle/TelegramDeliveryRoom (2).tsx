import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getActiveCamp, readCanonicalOrders } from "@/lib/canonical";
import { Clipboard, Eye, Flame, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

const DEFAULT_HEADER = "🚀 [บิลสมบูรณ์ - READY]";
const FALLBACK_PRODUCT_KEYS = ["alien_display_with_quantity", "alien_trusted_master_displays", "master_display_with_quantity", "master_display_for_packer", "display_for_packer", "product_display_for_packer", "final_display_for_packer", "product_copy_text", "product_backup_1", "product_backup_2", "product_name", "th_name", "sku"];
const ADDRESS_KEYS = ["master_delivery_address", "full_address", "final_address_for_bill", "address_display_packer", "addressclean", "full_address_backup_1", "full_address_backup_2"];

function firstText(row: Record<string, any>, keys: string[]) { for (const key of keys) { const value = row[key]; if (Array.isArray(value) && value.length) return value.join("\n"); if (value != null && String(value).trim()) return String(value).trim(); } return ""; }
function productText(row: Record<string, any>) { return firstText(row, FALLBACK_PRODUCT_KEYS) || "📦 ตรวจสอบสินค้า — ไม่ทิ้งรายการ"; }
function addressText(row: Record<string, any>) { return firstText(row, ADDRESS_KEYS) || [row.short_address, row.district && `ต.${row.district}`, row.amphoe && `อ.${row.amphoe}`, row.province && `จ.${row.province}`, row.zipcode].filter(Boolean).join(" ") || "ไม่ระบุที่อยู่"; }
function deliveryStatus(row: Record<string, any>) {
  const sent = String(row.telegram_status ?? row.telegram_body_status ?? "").toUpperCase() === "SENT" || row.telegram_sent === true;
  return sent ? { label: "ไปแล้วไปลับ", slogan: "ไปแล้วไม่กลับ — ค่อยแวะมาใหม่", tone: "border-orange-300/60 bg-orange-500/15 text-orange-200" } : { label: "รอส่ง", slogan: "ยังอยู่ในห้องรอจัดส่ง", tone: "border-amber-300/40 bg-amber-500/10 text-amber-200" };
}
function buildTelegram(row: Record<string, any>, header: string) { const product = productText(row); const address = addressText(row); return [header, "━━━━━━━━━━━━━━━━━━━━", `⏰ ${row.order_time_display || row.order_time || row.order_date || "ไม่ระบุเวลา"}`, `🆔 ${row.master_order_number_raw || row.order_number || row.upsert_key || "ไม่ระบุออเดอร์"}`, `📢 ${row.page_name || "ไม่ระบุเพจ"}`, `👤 ${row.master_customer_name || row.customer_name || row.facebook_name || "ไม่ระบุชื่อ"}`, `💰 COD: ${row.cod_amount ?? "ตรวจสอบยอด"} บาท`, "━━━━━━━━━━━━━━━━━━━━", `${row.master_customer_name || row.customer_name || row.facebook_name || "ลูกค้า"}`, `${row.master_customer_phone || row.phone || row.extracted_phone || "ไม่ระบุเบอร์"}`, `📍 ${address}`, "━━━━━━━━━━━━━━━━━━━━", "📦 รายการสินค้าสำหรับจัดของ:", product, row.alien_product_stock_notices || row.alien_out_of_stock_notices || ""].filter(Boolean).join("\n"); }

export default function TelegramDeliveryRoom() {
  const [header, setHeader] = useState(DEFAULT_HEADER);
  const [selected, setSelected] = useState(0);
  const [copied, setCopied] = useState(false);
  const query = useQuery({ queryKey: ["telegram-delivery-orders", getActiveCamp()], queryFn: () => readCanonicalOrders(""), refetchInterval: 30_000 });
  const orders = query.data?.orders ?? [];
  const order = orders[selected] as Record<string, any> | undefined;
  const message = useMemo(() => order ? buildTelegram(order, header || DEFAULT_HEADER) : "ยังไม่มีออเดอร์ให้ส่ง", [order, header]);
  const copy = async () => { await navigator.clipboard?.writeText(message); setCopied(true); window.setTimeout(() => setCopied(false), 1600); };
  return <div className="min-h-full space-y-5 text-white">
    <header className="rounded-3xl border border-orange-400/25 bg-[#100c0a] p-6 shadow-2xl shadow-orange-950/20"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-300"><Send className="mr-2 inline h-4 w-4" />TELEGRAM DELIVERY ROOM · {getActiveCamp()}</p><h1 className="mt-3 text-3xl font-semibold">ห้องส่ง Telegram</h1><p className="mt-2 text-sm leading-6 text-orange-100/60">หัวบิลแก้ไขได้ • สินค้าสำคัญก่อนที่อยู่ • ไม่ทิ้งฟิวด์สำรอง • อ่านจาก Order Master Center</p></header>
    <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <Card className="rounded-3xl border-orange-400/15 bg-[#100d0b]"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-orange-100"><Flame className="h-4 w-4 text-orange-300" />หัวบิล / ป้ายส่ง</CardTitle></CardHeader><CardContent className="space-y-4"><label className="text-xs text-orange-100/60">แก้ป้ายหัวบิลได้ทันที</label><Input value={header} onChange={e => setHeader(e.target.value)} className="border-orange-400/20 bg-black/40 text-orange-100" /><div className="flex items-center justify-between text-xs text-orange-100/50"><span>ออเดอร์พร้อมส่ง {orders.length}</span><Button size="sm" variant="outline" onClick={() => query.refetch()} className="border-orange-400/20 text-orange-200"><RefreshCw className="mr-1 h-3.5 w-3.5" />รีเฟรช</Button></div><div className="max-h-[520px] space-y-2 overflow-auto">{orders.map((item: any, index: number) => <button type="button" key={item.upsert_key || item.order_number || index} onClick={() => setSelected(index)} className={`w-full rounded-xl border p-3 text-left transition ${index === selected ? "border-orange-300/60 bg-orange-500/15 shadow-[0_0_16px_rgba(249,115,22,0.2)]" : "border-white/10 bg-black/20 hover:border-orange-400/30"}`}><div className="flex items-center justify-between gap-2"><span className="font-mono text-xs text-orange-100">{item.order_number || item.upsert_key || "ไม่มีเลขออเดอร์"}</span><span className="text-[10px] text-orange-100/45">{item.cod_amount ?? "COD ?"}</span></div><div className="mt-2 flex items-center justify-between gap-2"><p className="truncate text-xs text-orange-100/60">{productText(item)}</p><span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${deliveryStatus(item).tone}`}>{deliveryStatus(item).label}</span></div><p className="mt-1 text-[10px] text-orange-100/40">{deliveryStatus(item).slogan}</p></button>)}</div></CardContent></Card>
      <Card className="rounded-3xl border-orange-400/15 bg-[#100d0b]"><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle className="flex items-center gap-2 text-base text-orange-100"><Eye className="h-4 w-4 text-orange-300" />ตัวอย่างข้อความส่ง</CardTitle><div className="flex gap-2"><Button onClick={copy} className="bg-orange-600 text-white hover:bg-orange-500"><Clipboard className="mr-2 h-4 w-4" />{copied ? "คัดลอกแล้ว" : "คัดลอกข้อความ"}</Button></div></div></CardHeader><CardContent className="space-y-4"><pre className="min-h-[520px] whitespace-pre-wrap rounded-2xl border border-orange-400/15 bg-black/50 p-5 text-sm leading-7 text-orange-50">{message}</pre><div className="flex flex-wrap items-center gap-2 text-xs text-orange-100/50"><span className={`rounded-full border px-2.5 py-1 ${order ? deliveryStatus(order).tone : "border-white/10 text-orange-100/40"}`}>{order ? `${deliveryStatus(order).label} · ${deliveryStatus(order).slogan}` : "ยังไม่มีสถานะ"}</span><ShieldCheck className="h-4 w-4 text-orange-300" />สินค้าและจำนวนถูกเลือกก่อนที่อยู่; ถ้าฟิวด์หลักว่าง ระบบไล่ฟิวด์สำรองต่อจนกว่าจะเจอ</div></CardContent></Card>
    </div>
  </div>;
}
