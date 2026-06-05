/**
 * readout.ts — assembles a deal readout.
 *
 * Division of labor:
 *   - The Mosca risk verdict + score come from computeMosca() (deterministic code).
 *   - The regulatory deadlines, NIST suite, and mandate names come from VERTICALS (the data file).
 *   - The LLM ONLY composes prose around those injected facts; it never computes the math
 *     and never sources a date or algorithm name from memory. The prose-only output schema
 *     and the grounding gate enforce this.
 */

import { callLlm, type JsonSchema } from "@/lib/llm";
import { checkReadoutGrounding, FactsGroundingError } from "@/lib/facts-grounding";
import { computeMosca, type MoscaResult } from "@/lib/mosca";
import {
  VERTICALS,
  MOSCA_Z,
  NIST_STANDARDS,
  type Vertical,
} from "@/data/verticals";

/** The prose the model composes. Strings only — no numbers it could get wrong. */
export type ReadoutProse = {
  discoveryBrief: string;
  hndlNarrative: string;
  migrationSketch: string;
  cisoOnePager: string;
};

/** The full readout: deterministic/data parts + composed prose. */
export type Readout = {
  vertical: Vertical;
  companyName: string | null;
  mosca: MoscaResult;
  prose: ReadoutProse;
};

export type GenerateInput = {
  verticalId: Vertical["id"];
  companyName?: string | null;
  /** Override X (data shelf-life). Defaults to the vertical's modeling assumption. */
  dataShelfLifeYears?: number;
  /** Override Y (migration time). Defaults to the vertical's modeling assumption. */
  migrationYears?: number;
  /** Reference "now". Defaults to the current calendar year. */
  currentYear?: number;
};

const PROSE_SCHEMA: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    discoveryBrief: { type: "string" },
    hndlNarrative: { type: "string" },
    migrationSketch: { type: "string" },
    cisoOnePager: { type: "string" },
  },
  required: ["discoveryBrief", "hndlNarrative", "migrationSketch", "cisoOnePager"],
};

const SYSTEM = [
  "You are a sales engineer translating post-quantum-cryptography (PQC) risk into business urgency for a CISO.",
  "Hard rules, in priority order:",
  "1. NEVER invent or alter a regulatory date, deadline year, or algorithm name. Use ONLY the facts provided in the prompt. If a fact is not provided, do not state it.",
  "2. Do NOT do any risk arithmetic. The Mosca risk verdict and score are computed for you and given in the prompt; refer to them, never recompute them.",
  "3. Never claim this tool scans, detects, or analyzes code. It consumes a vertical profile; it does not scan.",
  "4. No em dashes in any prose. Plain language first. Board-ready: a busy executive gets the point in one read.",
  "5. Cite the mandate name when you reference a deadline (the prompt gives you the names).",
  "6. Do NOT write any calendar year that is not explicitly listed in the prompt (in the deadlines or the Z-range). Never interpolate, estimate, or guess a year. For example, do not write 'by 2033' or 'by the mid-2030s, around 2033'. If you must describe a timeframe with no provided year, describe it qualitatively (for example 'within the decade' or 'before the next deadline') with no number.",
].join("\n");

const MAX_ATTEMPTS = 2;

function correctionSuffix(violations: string[]): string {
  return [
    "",
    "",
    `CORRECTION REQUIRED: your previous draft used these values that are NOT permitted: ${violations.join(", ")}.`,
    "Rewrite every section. Remove or rephrase each flagged value. Use ONLY the exact years and algorithm names provided above; write no year that is not listed in the deadlines or the Z-range.",
  ].join("\n");
}

/** Build the user-turn prompt, injecting every grounded fact the model may use. */
export function buildPrompt(
  vertical: Vertical,
  mosca: MoscaResult,
  companyName: string | null,
): string {
  const deadlines = vertical.deadlines
    .map(
      (d) =>
        `  - ${d.year} (${d.status}${d.approximate ? ", approximate" : ""}): ${d.mandate} — ${d.milestone}`,
    )
    .join("\n");

  const nist = NIST_STANDARDS.map(
    (s) => `  - ${s.name} (${s.fips}, formerly ${s.formerName}): ${s.purpose}`,
  ).join("\n");

  const target = companyName?.trim()
    ? `Target account: ${companyName.trim()} (treat as a representative ${vertical.label} organization).`
    : `Target profile: a representative ${vertical.label} organization.`;

  return [
    target,
    "",
    `Sector framing: ${vertical.summary}`,
    "",
    "MOSCA RISK (computed deterministically — refer to these, do not recompute):",
    `  - Verdict: ${mosca.verdict}`,
    `  - Urgency score: ${mosca.score}/100`,
    `  - Data shelf-life X = ${mosca.x} years; migration time Y = ${mosca.y} years; X+Y = ${mosca.xPlusY} years`,
    `  - Years until a cryptographically relevant quantum computer (Z): ${mosca.zLowYears} (earliest plausible) to ${mosca.zHighYears} (latest plausible). ${MOSCA_Z.note}`,
    "",
    "REGULATORY DEADLINES (use ONLY these; cite the mandate name):",
    deadlines,
    "",
    "NIST PQC SUITE (use ONLY these names):",
    nist,
    `Recommended parameters for this vertical: KEM ${vertical.nistSuite.kem}, signatures ${vertical.nistSuite.signature}, hash-based signatures ${vertical.nistSuite.hashSignature}. ${vertical.nistSuite.paramNote}`,
    "",
    `HNDL framing for this vertical: ${vertical.hndl}`,
    "",
    "Compose four prose sections:",
    "  - discoveryBrief: the account's likely crypto exposure (sector, regulatory surface, data confidentiality horizon).",
    "  - hndlNarrative: why harvest-now-decrypt-later makes this urgent today, grounded in the Mosca verdict above.",
    "  - migrationSketch: where PQC slots in (TLS, PKI/certificates, code signing), naming the recommended NIST suite.",
    "  - cisoOnePager: a ready-to-send leave-behind a CISO could act on, leading with the single most urgent deadline.",
  ].join("\n");
}

/** Generate a complete readout. Math + facts from code/data; prose from the model. */
export async function generateReadout(input: GenerateInput): Promise<Readout> {
  const vertical = VERTICALS[input.verticalId];
  if (!vertical) {
    throw new Error(`Unknown vertical: ${input.verticalId}`);
  }

  const currentYear = input.currentYear ?? new Date().getFullYear();
  const mosca = computeMosca({
    dataShelfLifeYears: input.dataShelfLifeYears ?? vertical.dataShelfLifeYears,
    migrationYears: input.migrationYears ?? vertical.migrationYears,
    zLowYear: MOSCA_Z.lowYear,
    zHighYear: MOSCA_Z.highYear,
    currentYear,
  });

  const companyName = input.companyName?.trim() || null;
  const basePrompt = buildPrompt(vertical, mosca, companyName);

  // Bounded self-correction loop: if the grounding gate flags an invented fact,
  // feed the violations back and let the model rewrite (keeps the gate strict while
  // making a clean render reliable). Fails closed if the
  // model can't produce grounded prose within MAX_ATTEMPTS.
  let lastViolations: string[] = [];
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const prompt = attempt === 1 ? basePrompt : basePrompt + correctionSuffix(lastViolations);
    const prose = await callLlm<ReadoutProse>({ system: SYSTEM, prompt, schema: PROSE_SCHEMA });

    const grounding = checkReadoutGrounding(prose);
    if (grounding.grounded) {
      return { vertical, companyName, mosca, prose };
    }
    lastViolations = grounding.violations;
  }

  throw new FactsGroundingError(lastViolations);
}
