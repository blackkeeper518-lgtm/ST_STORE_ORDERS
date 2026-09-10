export type StoreId = "bb" | "st";
const rawStore = String(import.meta.env.VITE_STORE_ID ?? "bb").toLowerCase();
export const storeId: StoreId = rawStore === "st" ? "st" : "bb";
export const storeConfig = {
  id: storeId,
  name: storeId === "st" ? "ST STORE" : "BB STORE",
  thaiName: storeId === "st" ? "สิงโตสโตร์" : "BB STORE",
  tagline: storeId === "st" ? "สิงโตสโตร์ · ระบบจัดการออเดอร์" : "แหล่งรวมสินค้าสายควัน แห่งสมรภูมิออนไลน์",
  theme: storeId === "st" ? "orange" : "neon",
  storagePrefix: storeId === "st" ? "st-store" : "bb-store",
} as const;
