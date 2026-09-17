import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getActiveCamp, readCanonicalOrders } from "@/lib/canonical";
import { useQuery } from "@tanstack/react-query";
import { Check, Clipboard, ExternalLink, PackageSearch, RefreshCw, Search, Send, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

const MAP_KEY = "parcel-mapping-drafts";
const IMPORT_KEY = "parcel-import-rows";
const money = new Intl.NumberFormat("th-TH");
const TRACKING_LINKS: Record<ReturnType<typeof getActiveCamp>, string> = { BB: "https://bbstorefullv-1.vercel.app/", ST: "https://singto-one.vercel.app/", SB: "https://suphabass.vercel.app/" };

function normalizePhone(value: string) {
  return value.replace(/\D/g, "").replace(/^66/, "0");
}

function itemText(item: any) {
  return item.display_for_packer || item.label_display || item.th_name || item.product_name || item.sku || "สินค้า";
}

function orderProducts(order: any) {
  if (Array.isArray(order.items) && order.items.length) return order.items.map((item: any) => `${itemText(item)}${item.quantity != null ? ` ${item.quantity} คอต` : ""}`).join("\n");
  return order.display_for_packer || order.th_name || order.sku || "ไม่ระบุสินค้า";
}

function loadDrafts(): Record<string, { tracking: string; carrier: string }> {
  try { return JSON.parse(localStorage.getItem(MAP_KEY) || "{}"); } catch { return {}; }
}

function textCell(row: Record<string, unknown>, names: string[]) {
  const clean = (value: string) => value.toLowerCase().replace(/[\s_\-]/g, "");
  const entry = Object.entries(row).find(([key, value]) => names.some(name => clean(key) == clean(name)) && value != null && String(value).trim());
  return entry ? String(entry[1]).trim() : "";
}

function normalizeImportRow(row: Record<string, unknown>) {
  return {
    name: textCell(row, ["ชื่อ", "ชื่อลูกค้า", "ชื่อผู้รับ", "customer_name", "name"]),
    phone: normalizePhone(textCell(row, ["เบอร์", "เบอร์โทร", "โทร", "โทรศัพท์", "phone", "phone_norm"])),
    tracking: textCell(row, ["เลขพัสดุ", "เลขที่พัสดุ", "เลขแทรค", "tracking", "tracking_number", "waybill"]),
    carrier: textCell(row, ["ขนส่ง", "carrier", "shipping_company"]) || "FLASH EXPRESS",
    status: textCell(row, ["สถานะ", "status"]),
  };
}

function loadImportedRows() {
  try { return JSON.parse(localStorage.getItem(IMPORT_KEY) || "[]") as ReturnType<typeof normalizeImportRow>[]; } catch { return []; }
}

export default function ParcelMapping() {
  const [phone, setPhone] = useState("");
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [tracking, setTracking] = useState("");
  const [carrier, setCarrier] = useState("FLASH EXPRESS");
  const [copied, setCopied] = useState(false);
  const [drafts, setDrafts] = useState(loadDrafts);
  const [importedRows, setImportedRows] = useState(loadImportedRows);
  const [importMessage, setImportMessage] = useState("");
  const query = useQuery({ queryKey: ["parcel-mapping-orders"], queryFn: () => readCanonicalOrders(), refetchInterval: 30_000 });
  const importByPhone = useMemo(() => new Map(importedRows.filter(row => row.phone).map(row => [row.phone, row])), [importedRows]);
  const orders = useMemo(() => (query.data?.orders ?? []).map((order: any) => {
    const imported = importByPhone.get(normalizePhone(String(order.phone || "")));
    return imported ? { ...order, customer_name: imported.name || order.customer_name, imported_tracking: imported.tracking, imported_carrier: imported.carrier, imported_status: imported.status } : order;
  }), [query.data?.orders, importByPhone]);
  const matchedOrders = useMemo(() => {
    const q = normalizePhone(phone);
    if (!q) return [];
    return orders.filter((order: any) => normalizePhone(String(order.phone || "")).includes(q));
  }, [orders, phone]);
  const selectedOrder = orders.find((order: any) => order.order_number === selectedNumber) ?? null;
  const activeCamp = getActiveCamp();
  const trackingLink = TRACKING_LINKS[activeCamp];
  const selectedDraft = selectedOrder ? drafts[selectedOrder.order_number] : undefined;
  const effectiveTracking = selectedOrder ? (tracking || selectedDraft?.tracking || selectedOrder.imported_tracking || "") : "";
  const message = selectedOrder ? [
    `แจ้งเลขพัสดุ ${selectedOrder.customer_name || "คุณลูกค้า"}`,
    `เลขออเดอร์: ${selectedOrder.order_number}`,
    `เลขพัสดุ: ${effectiveTracking || "รอเลขพัสดุ"}`,
    `ขนส่ง: ${carrier || selectedDraft?.carrier || selectedOrder.imported_carrier || "ไม่ระบุ"}`,
    `ยอดเก็บปลายทาง: ${selectedOrder.cod_amount != null ? `${money.format(Number(selectedOrder.cod_amount))} บาท` : "ไม่ระบุ"}`,
    "",
    `ลิ้งเช็คเลขพัสดุ : 🤩 ${trackingLink}`,
    "ขอบคุณครับ สามารถตรวจสอบสถานะได้จากหน้าเช็คเลขพัสดุของร้านได้เลยครับ",
  ].join("\n") : "";

  useEffect(() => {
    if (!selectedOrder) return;
    setTracking(drafts[selectedOrder.order_number]?.tracking || selectedOrder.imported_tracking || "");
    setCarrier(drafts[selectedOrder.order_number]?.carrier || selectedOrder.imported_carrier || "FLASH EXPRESS");
  }, [selectedNumber]);


  const importExcel = async (file: File) => {
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = (XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" }) || []).map(normalizeImportRow).filter(row => row.phone || row.tracking || row.name);
      setImportedRows(rows);
      localStorage.setItem(IMPORT_KEY, JSON.stringify(rows));
      setImportMessage(`นำเข้า ${rows.length.toLocaleString("th-TH")} แถวแล้ว · จับคู่ด้วยเบอร์โทรเรียบร้อย`);
    } catch (error) { setImportMessage(`อ่าน Excel ไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)}`); }
  };

  const saveMapping = () => { // เก็บ draft เท่านั้นจนกว่าจะยืนยัน schema สำหรับเขียนกลับตารางต้นทาง
    if (!selectedOrder || !tracking.trim()) return;
    const next = { ...drafts, [selectedOrder.order_number]: { tracking: tracking.trim(), carrier: carrier.trim() || "ไม่ระบุ" } };
    setDrafts(next);
    localStorage.setItem(MAP_KEY, JSON.stringify(next));
  };

  const copyMessage = async () => {
    if (!message) return;
    await navigator.clipboard?.writeText(message);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return <div className="min-h-[calc(100vh-2rem)] bg-[#09090b] text-white"><div className="mx-auto max-w-[1500px] space-y-5 p-3 sm:p-5 lg:p-7">
    <header className="relative overflow-hidden rounded-3xl border border-orange-400/20 bg-[#111116] px-6 py-6 shadow-2xl shadow-orange-950/10 sm:px-8"><div className="pointer-events-none absolute -right-20 -top-32 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" /><div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-300"><Truck className="h-3.5 w-3.5" /> PARCEL LINK · ORDER MAPPING</div><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">ห้องแมปเลขพัสดุ</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">ค้นออเดอร์จากเบอร์ลูกค้า ใส่เลขพัสดุ แล้วสร้างข้อความส่งลูกค้าในคลิกเดียว</p></div><Badge className="w-fit border border-orange-400/30 bg-orange-400/10 text-amber-200">ใช้ค่ายที่เลือกอยู่ · Live 30s</Badge></div></header>
    <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]"><Card className="rounded-3xl border-white/10 bg-[#111116]"><CardContent className="space-y-5 p-5"><div><p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-300">FIND ORDER</p><h2 className="mt-1 text-xl font-semibold">ค้นจากเบอร์โทรศัพท์</h2><p className="mt-1 text-xs text-slate-400">กรอกเบอร์บางส่วนได้ ระบบจะค้นจากออเดอร์และไฟล์ Excel พัสดุที่นำเข้าแล้ว</p></div><label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-orange-300/30 bg-orange-300/[0.04] px-4 py-3 text-xs text-orange-100 hover:bg-orange-300/10"><input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) void importExcel(file); }} /><span>📥 โยนไฟล์ Excel พัสดุเข้าระบบ</span></label>{importMessage ? <p className="rounded-xl border border-orange-300/20 bg-orange-300/5 p-3 text-xs text-orange-100">{importMessage}</p> : null}<div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" /><Input value={phone} onChange={event => { setPhone(event.target.value); setSelectedNumber(null); }} placeholder="เช่น 0812345678" className="h-10 border-white/10 bg-black/30 pl-9 text-white placeholder:text-slate-600" /></div>{query.isError ? <p className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-xs text-red-200">อ่านออเดอร์ไม่สำเร็จ: {(query.error as Error).message}</p> : null}{phone && !query.isLoading && matchedOrders.length === 0 ? <div className="rounded-2xl border border-white/5 bg-black/20 p-6 text-center text-sm text-slate-500"><PackageSearch className="mx-auto mb-2 h-7 w-7 text-slate-700" />ยังไม่พบออเดอร์จากเบอร์นี้</div> : null}<div className="space-y-2">{matchedOrders.map((order: any) => <button key={order.order_number} onClick={() => setSelectedNumber(order.order_number)} className={`w-full rounded-2xl border p-4 text-left transition ${selectedNumber === order.order_number ? "border-orange-400/60 bg-orange-400/10" : "border-white/5 bg-black/20 hover:border-white/20"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-xs font-semibold text-amber-200">{order.order_number}</p><p className="mt-1 truncate text-sm font-semibold text-slate-100">{order.customer_name || "ไม่ระบุชื่อ"}</p><p className="mt-1 text-xs text-slate-400">{order.phone || "ไม่ระบุเบอร์"}</p></div><div className="text-right"><p className="text-xs text-orange-300">{order.cod_amount != null ? `${money.format(Number(order.cod_amount))} ฿` : "ไม่มี COD"}</p><p className="mt-1 text-[11px] text-slate-500">{orderProductPreview(order)}</p></div></div></button>)}</div><Button variant="outline" size="sm" onClick={() => query.refetch()} className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"><RefreshCw className={`mr-2 h-3.5 w-3.5 ${query.isFetching ? "animate-spin" : ""}`} />รีเฟรชออเดอร์</Button></CardContent></Card>
    <Card className="rounded-3xl border-white/10 bg-[#111116]"><CardContent className="space-y-5 p-5">{selectedOrder ? <><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-300">LINK TRACKING TO ORDER</p><h2 className="mt-1 font-mono text-xl font-semibold">{selectedOrder.order_number}</h2><p className="mt-1 text-sm text-slate-300">{selectedOrder.customer_name || "ไม่ระบุชื่อ"} · {selectedOrder.phone || "ไม่ระบุเบอร์"}</p></div><Badge variant="outline" className="border-amber-400/30 bg-amber-400/5 text-amber-200">LOCAL DRAFT / ยังไม่เขียน DB</Badge></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs text-slate-400">ขนส่ง<Input value={carrier} onChange={event => setCarrier(event.target.value)} className="mt-1 border-white/10 bg-black/30 text-white" /></label><label className="text-xs text-slate-400">เลขพัสดุ<Input value={tracking} onChange={event => setTracking(event.target.value)} placeholder="เช่น TH123456789" className="mt-1 border-white/10 bg-black/30 font-mono text-white placeholder:text-slate-600" /></label></div><div className="grid gap-4 lg:grid-cols-2"><div className="rounded-2xl border border-white/5 bg-black/20 p-4"><p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">ORDER SNAPSHOT</p><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-300">{selectedOrder.full_address || "ไม่ระบุที่อยู่"}{"\n"}{orderProducts(selectedOrder)}{selectedOrder.cod_amount != null ? `\nCOD ${money.format(Number(selectedOrder.cod_amount))} บาท` : ""}</p></div><div className="rounded-2xl border border-orange-400/20 bg-orange-400/[0.04] p-4"><p className="text-[10px] uppercase tracking-[0.2em] text-amber-300">CUSTOMER MESSAGE</p><pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-7 text-slate-200">{message}</pre></div></div><div className="flex flex-wrap gap-2"><Button onClick={saveMapping} disabled={!tracking.trim()} className="bg-orange-500 text-black hover:bg-orange-400"><Check className="mr-2 h-4 w-4" />บันทึกแมป</Button><Button onClick={copyMessage} disabled={!effectiveTracking} variant="outline" className="border-orange-400/30 bg-orange-400/5 text-amber-100 hover:bg-orange-400/10">{copied ? <Check className="mr-2 h-4 w-4" /> : <Clipboard className="mr-2 h-4 w-4" />}{copied ? "คัดลอกแล้ว" : "คัดลอกข้อความส่งลูกค้า"}</Button><Button disabled variant="outline" className="border-white/10 text-slate-500"><Send className="mr-2 h-4 w-4" />ส่งอัตโนมัติ (ต่อช่องแชท)</Button><Button variant="ghost" onClick={() => setSelectedNumber(null)} className="text-slate-400">ยกเลิก</Button></div></> : <div className="flex min-h-[440px] flex-col items-center justify-center text-center text-slate-500"><PackageSearch className="mb-4 h-10 w-10 text-amber-300/40" /><p className="text-sm">เลือกออเดอร์จากด้านซ้าย</p><p className="mt-1 text-xs text-slate-600">แล้วใส่เลขพัสดุเพื่อสร้างข้อความให้ลูกค้า</p></div>}</CardContent></Card></div>
    <footer className="flex flex-wrap items-center justify-between gap-3 px-2 text-[11px] text-slate-500"><span className="flex items-center gap-2"><ExternalLink className="h-3.5 w-3.5" />{activeCamp === "BB" ? "SINGTO STORE" : "SINGTO"} · ลูกค้าเช็คสถานะได้จากเว็บหน้าบ้าน</span><span>ลิ้งเช็คพัสดุพร้อมใช้เป็นแบนเนอร์ขายของในข้อความ</span></footer>
  </div></div>;
}

function orderProductPreview(order: any) {
  if (Array.isArray(order.items) && order.items.length) return order.items.map((item: any) => itemText(item)).join(" · ");
  return order.display_for_packer || order.th_name || order.sku || "สินค้า";
}
