/**
 * facts-grounding.ts — the runtime enforcement of the grounding contract.
 *
 * After the model composes prose, extract every date / FIPS number / NIST parameter set
 * and assert each appears in groundedFacts() (derived from the verticals data file). A
 * violation means the model invented or altered a fact, which is the one fatal failure
 * this whole design guards against. generateReadout() fails closed on any violation.
 *
 * Scope: the high-value, fatal-failure classes — regulatory years, FIPS standard numbers,
 * and NIST KEM/signature parameter sets. Mandate-name invention (e.g. "CNSA 3.0") is lower
 * risk and not extracted here; the prompt only injects the real names, and the prose-only
 * output schema plus this date/algorithm gate cover the failure the spec calls fatal.
 */

import { groundedFacts } from "@/data/verticals";
import type { ReadoutProse } from "@/lib/readout";

export class FactsGroundingError extends Error {
  readonly violations: string[];
  constructor(violations: string[]) {
    super(`Ungrounded facts in generated output: ${violations.join(", ")}`);
    this.violations = violations;
  }
}

export type GroundingResult = { grounded: boolean; violations: string[] };

// Years 2020-2039 only: covers every grounded deadline (all <= 2035) while excluding
// key sizes like RSA-2048 (third digit 4) and AES-256 from being read as dates.
const YEAR_RE = /\b20[23]\d\b/g;
// FIPS standard numbers, normalized to "FIPS NNN".
const FIPS_RE = /\bFIPS[\s-]?(\d+)\b/gi;
// NIST suites with any parameter suffix (catches invented sets like ML-KEM-512).
const NIST_RE = /\b(?:ML-KEM|ML-DSA|SLH-DSA)(?:-\d+)?\b/g;

export function checkGrounding(
  text: string,
  facts: string[] = groundedFacts(),
): GroundingResult {
  const allow = new Set(facts);
  const violations = new Set<string>();

  for (const m of text.matchAll(YEAR_RE)) {
    if (!allow.has(m[0])) violations.add(m[0]);
  }
  for (const m of text.matchAll(FIPS_RE)) {
    const normalized = `FIPS ${m[1]}`;
    if (!allow.has(normalized)) violations.add(normalized);
  }
  for (const m of text.matchAll(NIST_RE)) {
    if (!allow.has(m[0])) violations.add(m[0]);
  }

  return { grounded: violations.size === 0, violations: [...violations] };
}

/** Scan all prose sections of a readout. */
export function checkReadoutGrounding(
  prose: ReadoutProse,
  facts?: string[],
): GroundingResult {
  const text = [
    prose.discoveryBrief,
    prose.hndlNarrative,
    prose.migrationSketch,
    prose.cisoOnePager,
  ].join("\n");
  return checkGrounding(text, facts);
}
