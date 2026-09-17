import { useMemo } from "react";
import { AlertTriangle, Boxes, MessageSquareQuote, PackageX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type OutOfStockProduct = {
  sku: string;
  brand: string;
  name: string;
  /** ชื่อไทยที่อ่านจาก product_master โดยตรง */
  masterThaiName?: string | null;
  /** มุกบ่นเฉพาะสินค้านี้; ควรอ่านจาก product_master หรือ content config */
  outOfStockMessage?: string | null;
  stockQty: number;
  icon?: string;
  tag?: string;
  category?: string;
};

const OUT_OF_STOCK_COPY = [
  "แพลตตินั่มบอกเหนื่อย ขอเป็นไฮโซพักก่อน ลูกค้าเรียกไม่หัน!",
  "หน้าร้านยังอยู่ แต่ของในสต๊อกขอลาพักร้อนก่อนนะ!",
  "ของหมดไม่ใช่หาย แค่น้องไปเติมพลัง เดี๋ยวกลับมาเท่กว่าเดิม!",
  "ลูกค้าเรียกน้องดังมาก แต่น้องติดภารกิจเติมสต๊อกอยู่ครับ!",
  "รอบนี้น้องขอพักก่อน หมดแล้วหมดเลย แต่ความเท่ยังเต็มสต๊อก!",
  "น้องไม่ได้เท ไม่ได้หาย แค่สต๊อกหมดแบบมีสไตล์!",
  "เรียกได้เรียกไป แต่น้องยังไม่พร้อมออกงาน ขอเติมของก่อนครับ!",
  "ของหมดชั่วคราว ความหล่อถาวร รอรอบใหม่ได้เลย!",
  "สต๊อกเป็นศูนย์ แต่ระดับความจี๊ดยังไม่ลดนะครับ!",
  "น้องขอหลบไปหลังร้านก่อน เติมของเสร็จแล้วจะกลับมาป่วนใหม่!",
];

const STOCK_HEADERS = [
  "ขายสินค้าหมด - เติมด่วน!",
  "สต๊อกหมด แต่ความเท่ยังไม่หมด!",
  "ของหมดแล้วแม่ - รอรอบใหม่!",
  "OUT OF STOCK - พักเติมของแป๊บ!",
  "น้องลาสต๊อกชั่วคราว - เดี๋ยวกลับมา!",
];

function stableCopy(sku: string, productName?: string | null, brand?: string) {
  const total = Array.from(sku).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const label = productName?.trim() || brand?.trim() || "น้องสินค้า";
  const productSpecificFallbacks = [
    `${label} ขอพักก่อนนะ สต๊อกหมด แต่ฟอร์มยังเต็มอยู่!`,
    `${label} วันนี้ขอไม่รับแขก เติมของก่อนแล้วค่อยกลับมาเจอกัน!`,
    `${label} ไม่ได้หาย แค่ของหมดแบบมีชั้นเชิง เดี๋ยวกลับมา!`,
    `${label} ลูกค้าเรียกได้ แต่อย่าเพิ่งเรียกแรง น้องกำลังรอเติมสต๊อก!`,
  ];
  return productSpecificFallbacks[total % productSpecificFallbacks.length] || OUT_OF_STOCK_COPY[total % OUT_OF_STOCK_COPY.length];
}

function stableHeader(dateKey: string) {
  const total = Array.from(dateKey).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return STOCK_HEADERS[total % STOCK_HEADERS.length];
}

export default function OutOfStockBoard({
  products,
  updatedAt = new Date(),
}: {
  products: OutOfStockProduct[];
  updatedAt?: Date;
}) {
  const dateKey = updatedAt.toISOString().slice(0, 10);
  const header = useMemo(() => stableHeader(dateKey), [dateKey]);
  const soldOutCount = products.filter((product) => product.stockQty <= 0).length;

  return (
    <main className="min-h-full bg-[#090909] px-4 py-6 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex items-center gap-3 text-sm font-semibold tracking-wide text-zinc-200">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-black">BB</span>
          <span>SINGTO STORE</span>
          <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] text-zinc-400">
            LIVE STOCK BOARD
          </span>
        </div>

        <section className="mb-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-orange-400">
              <AlertTriangle className="mr-1 inline h-3.5 w-3.5" /> สินค้าหมด / เติมสต๊อก
            </p>
            <h1 className="text-4xl font-black tracking-tight text-orange-500 sm:text-5xl">
              {header}
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              แจ้งเตือนจากข้อมูลจริง ไม่เดา 10 รายการ แค่อยู่ในจังหวะพักก่อน เดี๋ยวค่อยไปป่วนห้องส่ง 😎
            </p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-3">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500">วันนี้</p>
              <p className="mt-1 text-lg font-bold">{updatedAt.toLocaleDateString("th-TH")}</p>
            </div>
            <div className="rounded-2xl bg-orange-600 px-5 py-3 shadow-lg shadow-pink-600/20">
              <p className="text-[10px] uppercase tracking-widest text-orange-100">หมดทั้งหมด</p>
              <p className="mt-1 text-lg font-bold">{soldOutCount} ตัว</p>
            </div>
          </div>
        </section>

        <div className="mb-5 flex flex-wrap gap-2 text-xs text-zinc-400">
          <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-orange-300">
            <PackageX className="mr-1 inline h-3.5 w-3.5" /> STOCK = 0
          </span>
          <span className="rounded-full border border-zinc-800 px-3 py-1.5">
            <MessageSquareQuote className="mr-1 inline h-3.5 w-3.5" /> สุ่มคำพูดตาม SKU
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <Card key={product.sku} className="relative overflow-hidden rounded-2xl border-zinc-800 bg-[#151515] text-white">
              <div className="absolute right-3 top-3 rotate-6 rounded-md bg-orange-600 px-2 py-1 text-[10px] font-black">OUT!</div>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl border border-zinc-700 bg-zinc-950 text-xl">
                    {product.icon ?? "📦"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-white px-2 py-0.5 text-[10px] font-black text-black">{product.brand}</span>
                      <span className="rounded bg-orange-600 px-2 py-0.5 text-[10px] font-bold">หมด</span>
                    </div>
                    <CardTitle className="mt-1 truncate text-base">{product.name}</CardTitle>
                    <p className="mt-1 text-sm font-semibold text-orange-300">
                      ❌สินค้าหมด❌ {product.masterThaiName ?? product.name}
                    </p>
                    <p className="text-[10px] tracking-widest text-zinc-600">{product.sku}</p>
                  </div>
                  <div className="rounded-xl bg-black px-3 py-2 text-center">
                    <p className="text-[9px] uppercase tracking-widest text-zinc-500">stock</p>
                    <p className="text-xl font-black text-orange-500">{product.stockQty}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-zinc-700 bg-zinc-900/70 p-3 text-sm leading-6 text-zinc-200">
                  <MessageSquareQuote className="mr-2 inline h-4 w-4 text-zinc-400" />
                  “{product.outOfStockMessage ?? stableCopy(product.sku, product.masterThaiName ?? product.name, product.brand)}”
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500">
                  <span>#{product.category ?? "สินค้าหมด"}</span>
                  <span><Boxes className="mr-1 inline h-3.5 w-3.5" /> อัปเดตจาก View</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}

export { OUT_OF_STOCK_COPY, STOCK_HEADERS, stableCopy, stableHeader };
