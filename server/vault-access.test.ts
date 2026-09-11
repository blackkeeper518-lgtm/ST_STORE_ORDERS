import { describe, expect, it } from "vitest";
import { verifyVaultAccessCode } from "./vault-access";

describe("vault access code", () => {
  const runConfigured = process.env.VAULT_ACCESS_CODE ? it : it.skip;

  runConfigured("accepts the configured secret and rejects a wrong code", () => {
    const configured = process.env.VAULT_ACCESS_CODE;
    if (!configured) return;
    expect(verifyVaultAccessCode(configured!)).toBe(true);
    expect(verifyVaultAccessCode(`${configured}x`)).toBe(false);
  });
});
