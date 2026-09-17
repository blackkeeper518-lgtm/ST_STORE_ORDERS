import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send } from "lucide-react";

/** Replace this isolated page with the Telegram delivery implementation. */
export default function TelegramDeliveryRoom() {
  return <div className="min-h-full space-y-5 text-white">
    <header className="rounded-3xl border border-cyan-400/20 bg-[#100c19] p-6 shadow-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300"><Send className="mr-2 inline h-4 w-4" />TELEGRAM DELIVERY ROOM</p>
      <h1 className="mt-3 text-3xl font-semibold">ห้องส่ง Telegram</h1>
      <p className="mt-2 text-sm leading-6 text-orange-100/55">พื้นที่แยกสำหรับเสียบระบบส่ง Telegram ภายหลัง โดยอ่านผลจาก View และไม่แก้ห้อง Alien / Master / Map</p>
    </header>
    <Card className="rounded-3xl border-cyan-400/15 bg-[#100d15]"><CardHeader><CardTitle className="text-base">พร้อมสำหรับการเสียบโมดูลส่ง</CardTitle></CardHeader><CardContent className="text-sm leading-7 text-orange-100/60">หน้านี้ตั้งใจแยกไฟล์ไว้ให้พัฒนาต่อได้โดยไม่กระทบระบบแมปสินค้า</CardContent></Card>
  </div>;
}
