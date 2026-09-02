import { describe, expect, it } from "vitest";
import { envSecret, passwordCandidates } from "@/lib/password-candidates";

describe("passwordCandidates", () => {
  it("includes the typed password and a YAML # truncation", () => {
    expect(passwordCandidates("Abdi123###")).toEqual([
      "Abdi123###",
      '"Abdi123###"',
      "'Abdi123###'",
      "Abdi123",
    ]);
  });

  it("strips surrounding quotes", () => {
    expect(passwordCandidates('"secret"')[0]).toBe("secret");
  });
});

describe("envSecret", () => {
  it("treats quoted Coolify values as the inner password", () => {
    expect(envSecret('"secret#"')).toBe("secret#");
  });
});
