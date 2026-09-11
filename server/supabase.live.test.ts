import { describe, expect, it } from "vitest";

describe("live Supabase order connection", () => {
  const runLive = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? it : it.skip;

  runLive("can read one lightweight row from both live order tables without exposing secrets", async () => {
    const baseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!baseUrl || !serviceKey) return;

    for (const table of ["central_order_master", "canonical_order_items"]) {
      const response = await fetch(`${baseUrl}/rest/v1/${table}?select=*&limit=1`, {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      });

      expect(response.ok, `${table} returned HTTP ${response.status}`).toBe(true);
      const payload = await response.json();
      expect(Array.isArray(payload)).toBe(true);
    }
  }, 20_000);
});
