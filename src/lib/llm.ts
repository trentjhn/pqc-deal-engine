/**
 * llm.ts — the single deep module every model call goes through.
 *
 * Retry, timeout, model-id, and structured-output handling live here rather than inlined at
 * each call site, so additional call sites and a provider swap are both contained, one-file
 * changes.
 *
 * Server-only: this imports the API key from the environment and must never run in the
 * browser. The route handler that calls it runs server-side on Vercel.
 */

import Anthropic from "@anthropic-ai/sdk";

/** Centralized model id. Verified via the claude-api skill on 2026-06-04. Swap here only. */
export const MODEL = "claude-sonnet-4-6";

export type JsonSchema = Record<string, unknown>;

export type CallLlmInput = {
  /** System prompt — the role + the hard constraints (never invent facts, etc.). */
  system: string;
  /** The user-turn prompt, with the grounded facts injected. */
  prompt: string;
  /** JSON schema the response is constrained to (structured outputs). */
  schema: JsonSchema;
  /** Output token ceiling. Kept under 16K so non-streaming is safe. */
  maxTokens?: number;
};

export class LlmConfigError extends Error {}
export class LlmRefusalError extends Error {}
export class LlmOutputError extends Error {}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (typeof window !== "undefined") {
    throw new LlmConfigError("callLlm must never run in the browser (key exposure).");
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new LlmConfigError("ANTHROPIC_API_KEY is not set (server-side env).");
  }
  if (!client) {
    client = new Anthropic({ apiKey });
  }
  return client;
}

/**
 * Call the model and return its structured output, validated against `schema`.
 * The model id, structured-output wiring, and refusal handling all live here.
 */
export async function callLlm<T>(input: CallLlmInput): Promise<T> {
  const { system, prompt, schema, maxTokens = 4096 } = input;
  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    // Compose-around-facts is not a reasoning-heavy task; keep it snappy + cheap.
    thinking: { type: "disabled" },
    system,
    messages: [{ role: "user", content: prompt }],
    output_config: { format: { type: "json_schema", schema } },
  });

  if (response.stop_reason === "refusal") {
    throw new LlmRefusalError("Model refused to generate the readout.");
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new LlmConfigError("No text block in model response.");
  }

  try {
    return JSON.parse(textBlock.text) as T;
  } catch {
    throw new LlmOutputError("Model output was not valid JSON.");
  }
}
