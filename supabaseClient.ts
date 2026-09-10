import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const SUPHABASS_SUPABASE_URL_KEY = "suphabass:supabase-url";
export const SUPHABASS_SUPABASE_ANON_KEY = "suphabass:supabase-anon-key";

export type SupabaseBrowserSettings = { url: string; anonKey: string };

export function readSupabaseSettings(): SupabaseBrowserSettings {
  if (typeof window === "undefined") return { url: "", anonKey: "" };
  return {
    url: localStorage.getItem(SUPHABASS_SUPABASE_URL_KEY) ?? "",
    anonKey: localStorage.getItem(SUPHABASS_SUPABASE_ANON_KEY) ?? "",
  };
}

export function saveSupabaseSettings(settings: SupabaseBrowserSettings) {
  localStorage.setItem(SUPHABASS_SUPABASE_URL_KEY, settings.url.trim().replace(/\/$/, ""));
  localStorage.setItem(SUPHABASS_SUPABASE_ANON_KEY, settings.anonKey.trim());
}

export function clearSupabaseSettings() {
  localStorage.removeItem(SUPHABASS_SUPABASE_URL_KEY);
  localStorage.removeItem(SUPHABASS_SUPABASE_ANON_KEY);
}

export function createBrowserSupabase(settings = readSupabaseSettings()): SupabaseClient | null {
  if (!settings.url || !settings.anonKey) return null;
  return createClient(settings.url, settings.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function readCanonicalOrderPreview(limit = 5) {
  const client = createBrowserSupabase();
  if (!client) return { rows: [], error: "ยังไม่ได้ตั้งค่า Supabase URL และ anon key" };
  const { data, error } = await client.from("vw_orders_web_all_fields").select("*").limit(limit);
  return { rows: data ?? [], error: error?.message ?? null };
}
