import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createBrowserSupabase, readSupabaseSettings, saveSupabaseSettings, clearSupabaseSettings } from "@/lib/supabaseClient";
import { CheckCircle2, Database, KeyRound, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";

export default function ConnectSupabase() {
  const initial = readSupabaseSettings();
  const [url, setUrl] = useState(initial.url);
  const [anonKey, setAnonKey] = useState(initial.anonKey);
  const [orderTable, setOrderTable] = useState(initial.orderTable);
  const [status, setStatus] = useState<{ kind: "idle" | "success" | "error"; message: string }>({ kind: "idle", message: "" });
  const [checking, setChecking] = useState(false);

  const testConnection = async () => {
    const cleanUrl = url.trim().replace(/\/$/, "");
    const cleanKey = anonKey.trim();
    const cleanTable = orderTable.trim() || "central_order_master";
    if (!cleanUrl || !cleanKey) return setStatus({ kind: "error", message: "กรุณากรอก URL และ anon key ให้ครบ" });
    setChecking(true);
    const client = createBrowserSupabase({ url: cleanUrl, anonKey: cleanKey, orderTable: cleanTable });
    const result = await client?.from(cleanTable).select("order_number,upsert_key").limit(1);
    setChecking(false);
    if (result?.error) return setStatus({ kind: "error", message: `เชื่อมต่อได้แต่ยังอ่าน ${cleanTable} ไม่สำเร็จ: ${result.error.message}` });
    saveSupabaseSettings({ url: cleanUrl, anonKey: cleanKey, orderTable: cleanTable });
    setStatus({ kind: "success", message: `บันทึกการเชื่อมต่อแล้ว — browser จะอ่าน ${cleanTable} ด้วย anon key เท่านั้น` });
  };

  const clear = () => { clearSupabaseSettings(); setUrl(""); setAnonKey(""); setOrderTable("central_order_master"); setStatus({ kind: "idle", message: "ล้างค่าการเชื่อมต่อจาก localStorage แล้ว" }); };

  return <div className="min-h-[calc(100vh-2rem)] bg-[#09070d] p-3 text-white sm:p-6"><div className="mx-auto max-w-4xl space-y-5"><header className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-[#100c19] p-6 shadow-2xl shadow-cyan-950/20"><div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" /><div className="relative flex items-start gap-4"><div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-200"><Database className="h-7 w-7" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">SUPHABASS · BROWSER CONNECTION</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">เชื่อมต่อ Supabase</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-violet-100/60">เลือกโต๊ะหรือ View ที่หัวตารางตรงกับระบบ เพื่ออ่านออเดอร์โดยไม่ส่ง service-role key ไปที่หน้าเว็บ</p></div></div></header><Card className="rounded-3xl border-violet-500/15 bg-[#100d15]"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><KeyRound className="h-4 w-4 text-cyan-300" />การตั้งค่าการเชื่อมต่อ</CardTitle></CardHeader><CardContent className="space-y-5"><label className="block text-sm text-violet-100/65">Project URL<Input value={url} onChange={event => setUrl(event.target.value)} placeholder="https://your-project.supabase.co" className="mt-2 border-violet-500/20 bg-black/25 text-white placeholder:text-violet-100/25" /></label><label className="block text-sm text-violet-100/65">Anon / public key<Input type="password" value={anonKey} onChange={event => setAnonKey(event.target.value)} placeholder="eyJ... (ห้ามใช้ service_role)" className="mt-2 border-violet-500/20 bg-black/25 text-white placeholder:text-violet-100/25" /></label><label className="block text-sm text-violet-100/65">Order table / view<Input value={orderTable} onChange={event => setOrderTable(event.target.value)} placeholder="central_order_master" className="mt-2 border-violet-500/20 bg-black/25 text-white placeholder:text-violet-100/25" /><span className="mt-1 block text-xs text-violet-100/40">ค่าเริ่มต้น: <code>public.central_order_master</code> · เปลี่ยนเป็นชื่อ View ได้</span></label><div className="flex flex-wrap items-center gap-3"><Button onClick={testConnection} disabled={checking} className="bg-gradient-to-r from-cyan-600 to-blue-600">{checking ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}ทดสอบและบันทึก</Button><Button variant="outline" onClick={clear} className="border-red-400/20 bg-red-400/5 text-red-200"><Trash2 className="mr-2 h-4 w-4" />ล้างค่าที่บันทึก</Button>{status.kind === "success" ? <Badge className="border-emerald-400/20 bg-emerald-400/10 text-emerald-300">พร้อมใช้งาน</Badge> : null}</div>{status.message ? <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-violet-100/80">{status.message}</p> : null}</CardContent></Card><Card className="rounded-3xl border-amber-400/15 bg-amber-950/10"><CardContent className="flex gap-3 p-5 text-sm leading-6 text-amber-100/70"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" /><p><strong className="text-amber-200">ความปลอดภัย:</strong> ระบบเก็บเฉพาะ URL, anon key และชื่อตารางใน localStorage ของเครื่องนี้เท่านั้น ห้ามใส่ service-role key ในช่องนี้ โดยค่าเริ่มต้นอ่าน <code className="text-cyan-200">central_order_master</code></p></CardContent></Card></div></div>;
}
