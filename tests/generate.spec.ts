import { describe, test, expect, vi, beforeEach } from "vitest";

// Mock the deep LLM module so no real API call (and no spend) happens in tests.
// This is the payoff of routing every call through one module: it's trivially mockable.
vi.mock("@/lib/llm", () => ({
  callLlm: vi.fn(async () => ({
    discoveryBrief: "Discovery brief prose.",
    hndlNarrative: "HNDL narrative prose.",
    migrationSketch: "Migration sketch prose.",
    cisoOnePager: "CISO one-pager prose.",
  })),
}));

import { generateReadout } from "@/lib/readout";
import { callLlm } from "@/lib/llm";
import { checkRateLimit, _resetRateLimit } from "@/lib/rate-limit";

describe("generateReadout — structure + division of labor", () => {
  test("assembles all five sections; math from code, facts from data, prose from model", async () => {
    const r = await generateReadout({ verticalId: "defense", currentYear: 2026 });

    // Prose (composed by the model) — all four prose sections present.
    expect(r.prose.discoveryBrief).toBeTruthy();
    expect(r.prose.hndlNarrative).toBeTruthy();
    expect(r.prose.migrationSketch).toBeTruthy();
    expect(r.prose.cisoOnePager).toBeTruthy();

    // Mosca verdict computed in code, not by the model.
    expect(r.mosca.verdict).toBe("exposed");
    expect(r.mosca.score).toBe(100);

    // Regulatory clock + NIST suite injected from the data file.
    expect(r.vertical.deadlines.length).toBeGreaterThan(0);
    expect(r.vertical.nistSuite.kem).toBe("ML-KEM-1024");
    expect(r.vertical.nistSuite.signature).toBe("ML-DSA-87");

    // Exactly one model call, and it was the mock (no live API spend).
    expect(callLlm).toHaveBeenCalledOnce();
  });

  test("rejects an unknown vertical", async () => {
    await expect(generateReadout({ verticalId: "nonsense" as never })).rejects.toThrow();
  });

  test("company name is normalized to null when blank", async () => {
    const r = await generateReadout({ verticalId: "finance", companyName: "   ", currentYear: 2026 });
    expect(r.companyName).toBeNull();
  });
});

describe("rate limiter — caps quota burn", () => {
  beforeEach(() => _resetRateLimit());

  test("allows up to the limit then blocks", () => {
    const now = 1_000_000;
    let last;
    for (let i = 0; i < 10; i++) {
      last = checkRateLimit("1.2.3.4", now, 10);
      expect(last.allowed).toBe(true);
    }
    const blocked = checkRateLimit("1.2.3.4", now, 10);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  test("resets after the window", () => {
    const now = 1_000_000;
    for (let i = 0; i < 10; i++) checkRateLimit("5.6.7.8", now, 10);
    expect(checkRateLimit("5.6.7.8", now, 10).allowed).toBe(false);
    expect(checkRateLimit("5.6.7.8", now + 61_000, 10).allowed).toBe(true);
  });
});
