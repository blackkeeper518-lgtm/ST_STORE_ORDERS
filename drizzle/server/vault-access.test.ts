import { describe, expect, it } from "vitest";
import { verifyVaultAccessCode } from "./vault-access";

const hasVaultAccessCode = Boolean(process.env.VAULT_ACCESS_CODE);
describe.skipIf(!hasVaultAccessCode)("vault access code", () => {
  it("accepts the configured secret and rejects a wrong code", () => {
    const configured = process.env.VAULT_ACCESS_CODE;
    if (!configured) return;
    expect(verifyVaultAccessCode(configured!)).toBe(true);
    expect(verifyVaultAccessCode(`${configured}x`)).toBe(false);
  });
});
