import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(): TrpcContext {
  return {
    user: null,
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("SUPHABASS canonical router", () => {
  it("exposes an explicit desk key health contract", async () => {
    const result = await appRouter.createCaller(context()).health();
    expect(result).toMatchObject({ ok: true, deskKey: "suphabass", service: "suphabass-canonical-order-desk" });
  });

  it("keeps presentation auth aligned with the admin vault surface", async () => {
    const user = await appRouter.createCaller(context()).auth.me();
    expect(user?.role).toBe("admin");
    expect(user?.name).toBeTruthy();
  });
});
