import { describe, test, expect, vi } from "vitest";

// Hoisted mock: the only consumer is the integration test below (via generateReadout).
// Returns prose with an in-band invented year so the gate must reject it.
vi.mock("@/lib/llm", () => ({
  callLlm: vi.fn(async () => ({
    discoveryBrief: "ok",
    hndlNarrative: "ok",
    migrationSketch: "Migrate by 2032.", // 2032 is in-band (2020-2039) and NOT a grounded deadline
    cisoOnePager: "ok",
  })),
}));

import {
  checkGrounding,
  checkReadoutGrounding,
  FactsGroundingError,
} from "@/lib/facts-grounding";
import { groundedFacts } from "@/data/verticals";
import { generateReadout } from "@/lib/readout";

describe("checkGrounding — catches invented facts", () => {
  test("passes text whose facts are all grounded", () => {
    const text =
      "By 2027 under CNSA 2.0, prefer ML-KEM-1024 and ML-DSA-87 (FIPS 203, FIPS 204). Full target 2035.";
    const r = checkGrounding(text);
    expect(r.grounded).toBe(true);
    expect(r.violations).toEqual([]);
  });

  test("flags an invented deadline year", () => {
    const r = checkGrounding("The mandate lands in 2032.");
    expect(r.grounded).toBe(false);
    expect(r.violations).toContain("2032");
  });

  test("flags an invented FIPS number", () => {
    const r = checkGrounding("Adopt FIPS 206 immediately.");
    expect(r.grounded).toBe(false);
    expect(r.violations).toContain("FIPS 206");
  });

  test("flags an invented NIST parameter set", () => {
    const r = checkGrounding("Use ML-KEM-512 for key exchange.");
    expect(r.grounded).toBe(false);
    expect(r.violations).toContain("ML-KEM-512");
  });

  test("does not false-positive on key sizes (RSA-2048, AES-256)", () => {
    const r = checkGrounding("Today's RSA-2048 and AES-256 are at risk.");
    expect(r.grounded).toBe(true);
    expect(r.violations).toEqual([]);
  });

  test("grounded year set covers all real deadlines", () => {
    const facts = groundedFacts();
    for (const y of ["2024", "2025", "2026", "2027", "2030", "2033", "2035"]) {
      expect(facts).toContain(y);
    }
  });
});

describe("checkReadoutGrounding — over a prose object", () => {
  test("scans all four prose sections", () => {
    const prose = {
      discoveryBrief: "Exposure is high.",
      hndlNarrative: "Harvest now, decrypt later.",
      migrationSketch: "Adopt ML-KEM-1024.",
      cisoOnePager: "Act before the 2032 deadline.", // in-band invented year, not a grounded deadline
    };
    const r = checkReadoutGrounding(prose);
    expect(r.grounded).toBe(false);
    expect(r.violations).toContain("2032");
  });
});

describe("generateReadout integration — fails closed on ungrounded output", () => {
  test("throws FactsGroundingError when the model invents a year", async () => {
    await expect(
      generateReadout({ verticalId: "defense", currentYear: 2026 }),
    ).rejects.toBeInstanceOf(FactsGroundingError);
  });
});
