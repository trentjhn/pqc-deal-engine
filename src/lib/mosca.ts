/**
 * mosca.ts — the Mosca inequality, as deterministic code.
 *
 * The Mosca risk math is deterministic code, never done by the model. This module is the
 * only place the risk verdict is computed.
 *
 * Mosca's inequality: if X + Y > Z you are already exposed, where
 *   X = how long your data must stay secret (years),
 *   Y = how long migrating to PQC takes (years),
 *   Z = how long until a cryptographically relevant quantum computer (CRQC) exists (years).
 *
 * Z is contested, so it is supplied as a RANGE (earliest .. latest plausible CRQC year).
 * `currentYear` is passed in (not read from the clock) to keep the function pure and testable.
 */

export type MoscaInput = {
  /** X: years the data must stay confidential. */
  dataShelfLifeYears: number;
  /** Y: years to migrate to PQC. */
  migrationYears: number;
  /** Earliest plausible CRQC year (sooner = worse). */
  zLowYear: number;
  /** Latest plausible CRQC year (later = better). */
  zHighYear: number;
  /** Reference "now" in calendar years. */
  currentYear: number;
};

/**
 * exposed   = exposed even under the LATEST (most generous) Q-Day estimate.
 * at-risk   = exposed only if Q-Day arrives at the EARLIEST estimate.
 * lower-risk = not exposed even under the earliest estimate.
 */
export type MoscaVerdict = "exposed" | "at-risk" | "lower-risk";

export type MoscaResult = {
  x: number;
  y: number;
  xPlusY: number;
  /** Years until the earliest plausible CRQC. */
  zLowYears: number;
  /** Years until the latest plausible CRQC. */
  zHighYears: number;
  /** zLowYears - (X+Y); negative means exposed under the earliest estimate. */
  marginToEarliest: number;
  /** zHighYears - (X+Y); negative means exposed even under the latest estimate. */
  marginToLatest: number;
  exposedUnderEarliest: boolean;
  exposedUnderLatest: boolean;
  verdict: MoscaVerdict;
  /** 0..100 urgency, mapped linearly from the margin to the latest estimate. */
  score: number;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function computeMosca(input: MoscaInput): MoscaResult {
  const { dataShelfLifeYears: x, migrationYears: y, zLowYear, zHighYear, currentYear } = input;

  if (!Number.isFinite(x) || x < 0) {
    throw new Error(`dataShelfLifeYears must be a non-negative number, got ${x}`);
  }
  if (!Number.isFinite(y) || y < 0) {
    throw new Error(`migrationYears must be a non-negative number, got ${y}`);
  }
  if (zHighYear < zLowYear) {
    throw new Error(`zHighYear (${zHighYear}) must be >= zLowYear (${zLowYear})`);
  }

  const xPlusY = x + y;
  const zLowYears = zLowYear - currentYear;
  const zHighYears = zHighYear - currentYear;

  const marginToEarliest = zLowYears - xPlusY;
  const marginToLatest = zHighYears - xPlusY;

  const exposedUnderEarliest = xPlusY > zLowYears;
  const exposedUnderLatest = xPlusY > zHighYears;

  const verdict: MoscaVerdict = exposedUnderLatest
    ? "exposed"
    : exposedUnderEarliest
      ? "at-risk"
      : "lower-risk";

  // Urgency: anchored at 50 when X+Y exactly meets the latest threshold, +/- 5 points
  // per year of margin. More exposure (negative margin) -> higher score.
  const score = clamp(Math.round(50 - marginToLatest * 5), 0, 100);

  return {
    x,
    y,
    xPlusY,
    zLowYears,
    zHighYears,
    marginToEarliest,
    marginToLatest,
    exposedUnderEarliest,
    exposedUnderLatest,
    verdict,
    score,
  };
}
