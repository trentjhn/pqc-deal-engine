import { describe, test, expect } from "vitest";
import { computeMosca, type MoscaInput } from "@/lib/mosca";
import { VERTICALS, MOSCA_Z } from "@/data/verticals";

const NOW = 2026;

function input(partial: Partial<MoscaInput>): MoscaInput {
  return {
    dataShelfLifeYears: 10,
    migrationYears: 4,
    zLowYear: MOSCA_Z.lowYear,
    zHighYear: MOSCA_Z.highYear,
    currentYear: NOW,
    ...partial,
  };
}

describe("computeMosca — verdict logic", () => {
  test("defense profile is exposed even under the latest Q-Day estimate", () => {
    const r = computeMosca(input({ dataShelfLifeYears: 25, migrationYears: 5 }));
    expect(r.xPlusY).toBe(30);
    expect(r.zLowYears).toBe(3); // 2029 - 2026
    expect(r.zHighYears).toBe(9); // 2035 - 2026
    expect(r.exposedUnderLatest).toBe(true);
    expect(r.verdict).toBe("exposed");
    expect(r.score).toBe(100);
  });

  test("finance profile is exposed with a non-saturated score", () => {
    const r = computeMosca(input({ dataShelfLifeYears: 10, migrationYears: 4 }));
    expect(r.xPlusY).toBe(14);
    expect(r.verdict).toBe("exposed");
    expect(r.score).toBe(75);
  });

  test("short-lived data is lower-risk (safe even if Q-Day comes early)", () => {
    const r = computeMosca(input({ dataShelfLifeYears: 1, migrationYears: 1 }));
    expect(r.xPlusY).toBe(2);
    expect(r.exposedUnderEarliest).toBe(false);
    expect(r.verdict).toBe("lower-risk");
    expect(r.score).toBe(15);
  });

  test("mid-range data is at-risk (exposed only if Q-Day comes early)", () => {
    const r = computeMosca(input({ dataShelfLifeYears: 3, migrationYears: 2 }));
    expect(r.xPlusY).toBe(5);
    expect(r.exposedUnderEarliest).toBe(true);
    expect(r.exposedUnderLatest).toBe(false);
    expect(r.verdict).toBe("at-risk");
    expect(r.score).toBe(30);
  });
});

describe("computeMosca — determinism", () => {
  test("identical inputs produce identical results across runs", () => {
    const i = input({ dataShelfLifeYears: 25, migrationYears: 5 });
    expect(computeMosca(i)).toEqual(computeMosca(i));
  });

  test("real defense vertical defaults resolve to exposed", () => {
    const v = VERTICALS.defense;
    const r = computeMosca(
      input({
        dataShelfLifeYears: v.dataShelfLifeYears,
        migrationYears: v.migrationYears,
      }),
    );
    expect(r.verdict).toBe("exposed");
  });
});

describe("computeMosca — error paths", () => {
  test("rejects negative data shelf-life", () => {
    expect(() => computeMosca(input({ dataShelfLifeYears: -1 }))).toThrow();
  });

  test("rejects negative migration time", () => {
    expect(() => computeMosca(input({ migrationYears: -2 }))).toThrow();
  });

  test("rejects an inverted Z range (high < low)", () => {
    expect(() =>
      computeMosca(input({ zLowYear: 2035, zHighYear: 2029 })),
    ).toThrow();
  });

  test("score is always clamped to 0..100", () => {
    const huge = computeMosca(input({ dataShelfLifeYears: 200, migrationYears: 50 }));
    const tiny = computeMosca(input({ dataShelfLifeYears: 0, migrationYears: 0 }));
    expect(huge.score).toBeLessThanOrEqual(100);
    expect(huge.score).toBeGreaterThanOrEqual(0);
    expect(tiny.score).toBeLessThanOrEqual(100);
    expect(tiny.score).toBeGreaterThanOrEqual(0);
  });
});
