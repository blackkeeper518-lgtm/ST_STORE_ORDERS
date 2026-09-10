import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { storeConfig } from "./store-config";

export const SUPHABASS_SUPABASE_URL_KEY = `${storeConfig.storagePrefix}:supabase-url`;
export const SUPHABASS_SUPABASE_ANON_KEY = `${storeConfig.storagePrefix}:supabase-anon-key`;
export const SUPHABASS_SUPABASE_TABLE_KEY = `${storeConfig.storagePrefix}:supabase-order-table`;

export type SupabaseBrowserSettings = { url: string; anonKey: string; orderTable: string };

export function readSupabaseSettings(): SupabaseBrowserSettings {
  if (typeof window === "undefined") return { url: "", anonKey: "", orderTable: "central_order_master" };
  return {
    url: localStorage.getItem(SUPHABASS_SUPABASE_URL_KEY) ?? "",
    anonKey: localStorage.getItem(SUPHABASS_SUPABASE_ANON_KEY) ?? "",
    orderTable: localStorage.getItem(SUPHABASS_SUPABASE_TABLE_KEY) ?? "central_order_master",
  };
}

export function saveSupabaseSettings(settings: SupabaseBrowserSettings) {
  localStorage.setItem(SUPHABASS_SUPABASE_URL_KEY, settings.url.trim().replace(/\/$/, ""));
  localStorage.setItem(SUPHABASS_SUPABASE_ANON_KEY, settings.anonKey.trim());
  localStorage.setItem(SUPHABASS_SUPABASE_TABLE_KEY, settings.orderTable.trim() || "central_order_master");
}

export function clearSupabaseSettings() {
  localStorage.removeItem(SUPHABASS_SUPABASE_URL_KEY);
  localStorage.removeItem(SUPHABASS_SUPABASE_ANON_KEY);
  localStorage.removeItem(SUPHABASS_SUPABASE_TABLE_KEY);
}

export function createBrowserSupabase(settings = readSupabaseSettings()): SupabaseClient | null {
  if (!settings.url || !settings.anonKey) return null;
  return createClient(settings.url, settings.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function readCanonicalOrderPreview(limit = 5) {
  const client = createBrowserSupabase();
  if (!client) return { rows: [], error: "ยังไม่ได้ตั้งค่า Supabase URL และ anon key" };
  const { orderTable } = readSupabaseSettings();
  const { data, error } = await client.from(orderTable || "central_order_master").select("*").limit(limit);
  return { rows: data ?? [], error: error?.message ?? null };
}
