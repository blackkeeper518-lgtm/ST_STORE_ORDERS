export type StoreId = "bb" | "st";
const rawStore = String(import.meta.env.VITE_STORE_ID ?? "bb").toLowerCase();
export const storeId: StoreId = rawStore === "st" ? "st" : "bb";

export const storeConfig = {
  id: storeId,
  name: storeId === "st" ? "SINGTO" : "BB STORE",
  thaiName: storeId === "st" ? "สิงโตสโตร์" : "BB STORE",
  tagline: storeId === "st" ? "สิงโตสโตร์ · KING👑" : "แหล่งรวมสินค้าสายควัน แห่งสมรภูมิออนไลน์",
  // เปลี่ยน theme เป็น 'gold-black' เพื่อให้ตรงตาม Ref Image
  theme: storeId === "st" ? "gold-black" : "neon",
  storagePrefix: storeId === "st" ? "st-store" : "bb-store",
  colors: {
    // อัปเดตชุดสีตาม reference
    primary: storeId === "st" ? "from-yellow-500 to-amber-700" : "from-purple-600 to-pink-600", // ทอง-อำพัน
    accent: storeId === "st" ? "#eab308" : "#a855f7", // สีเหลืองทองเข้ม
    glow: storeId === "st" ? "rgba(234, 179, 8, 0.35)" : "rgba(168, 85, 247, 0.25)", // ทองเรืองรอง
    border: storeId === "st" ? "border-amber-500/50" : "border-purple-500/30",
    textSubtle: storeId === "st" ? "text-amber-300" : "text-slate-300", // ปรับสีซับไตเติ้ลให้เข้ากัน
  },
} as const;
