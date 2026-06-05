/**
 * POST /api/generate — server-side readout generation.
 *
 * Runs server-side only; the ANTHROPIC_API_KEY never reaches the client bundle.
 * Rate-limited per IP to cap LLM quota burn.
 */

import { NextResponse } from "next/server";
import { generateReadout } from "@/lib/readout";
import { checkRateLimit } from "@/lib/rate-limit";
import { VERTICALS, type Vertical } from "@/data/verticals";
import { LlmConfigError, LlmRefusalError } from "@/lib/llm";
import { FactsGroundingError } from "@/lib/facts-grounding";

export const runtime = "nodejs";

function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "unknown";
}

function isVerticalId(value: unknown): value is Vertical["id"] {
  return typeof value === "string" && value in VERTICALS;
}

export async function POST(req: Request) {
  const rl = checkRateLimit(clientKey(req));
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again shortly." },
      { status: 429, headers: { "retry-after": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { vertical, companyName } = (body ?? {}) as {
    vertical?: unknown;
    companyName?: unknown;
  };

  if (!isVerticalId(vertical)) {
    return NextResponse.json(
      { error: `Unknown vertical. Expected one of: ${Object.keys(VERTICALS).join(", ")}.` },
      { status: 400 },
    );
  }

  // Bound companyName: it flows into the prompt, so cap length to limit token-cost
  // amplification and shrink the prompt-injection surface. A company name is short.
  if (typeof companyName === "string" && companyName.length > 100) {
    return NextResponse.json(
      { error: "companyName too long (max 100 characters)." },
      { status: 400 },
    );
  }

  try {
    const readout = await generateReadout({
      verticalId: vertical,
      companyName: typeof companyName === "string" ? companyName : null,
    });
    return NextResponse.json(readout);
  } catch (err) {
    if (err instanceof LlmConfigError) {
      // Misconfiguration (missing key). Don't leak details to the client.
      console.error("LLM config error:", err.message);
      return NextResponse.json({ error: "Generation is not configured." }, { status: 503 });
    }
    if (err instanceof LlmRefusalError) {
      return NextResponse.json({ error: "Could not generate a readout for this input." }, { status: 422 });
    }
    if (err instanceof FactsGroundingError) {
      // Model produced an ungrounded fact; we refused to ship it. Retryable.
      console.error("Facts-grounding violation:", err.violations);
      return NextResponse.json({ error: "Generation failed a fact check. Please retry." }, { status: 502 });
    }
    console.error("Generation failed:", err);
    return NextResponse.json({ error: "Generation failed. Please retry." }, { status: 500 });
  }
}
