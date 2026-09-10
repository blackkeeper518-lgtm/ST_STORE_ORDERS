import { describe, expect, it } from "vitest";
import { verifyVaultAccessCode } from "./vault-access";

describe("vault access code", () => {
  it.skipIf(!process.env.VAULT_ACCESS_CODE)("accepts the configured secret and rejects a wrong code", () => {
    const configured = process.env.VAULT_ACCESS_CODE;
    if (!configured) return;
    expect(verifyVaultAccessCode(configured!)).toBe(true);
    expect(verifyVaultAccessCode(`${configured}x`)).toBe(false);
  });
});
