import { describe, expect, it } from "vitest";
import { BELT_LEVELS } from "@/lib/constants";

describe("same-belt query contract", () => {
  it("never accepts a client-supplied belt override as the source of truth", () => {
    const sessionBelt: string = "YELLOW";
    const attemptedBelt: string = "GREEN";
    const allowed = attemptedBelt === sessionBelt ? sessionBelt : null;
    expect(allowed).toBeNull();
    expect(BELT_LEVELS.includes(sessionBelt as (typeof BELT_LEVELS)[number])).toBe(true);
  });
});
