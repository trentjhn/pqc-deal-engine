import { describe, test, expect, vi, beforeEach } from "vitest";

// Mock the LLM module so an accidental success-path call can't spend. All cases below
// are rejection paths that short-circuit BEFORE generateReadout, so callLlm is never hit.
vi.mock("@/lib/llm", () => ({
  callLlm: vi.fn(),
  LlmConfigError: class extends Error {},
  LlmRefusalError: class extends Error {},
  LlmOutputError: class extends Error {},
}));

import { POST } from "@/app/api/generate/route";
import { _resetRateLimit } from "@/lib/rate-limit";
import { callLlm } from "@/lib/llm";

function post(body: unknown, ip = "9.9.9.9"): Request {
  return new Request("http://localhost/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/generate — input validation (no LLM spend)", () => {
  beforeEach(() => _resetRateLimit());

  test("400 on malformed JSON", async () => {
    const res = await POST(post("{not json", "1.1.1.1"));
    expect(res.status).toBe(400);
    expect(callLlm).not.toHaveBeenCalled();
  });

  test("400 on unknown vertical", async () => {
    const res = await POST(post({ vertical: "energy" }, "2.2.2.2"));
    expect(res.status).toBe(400);
    expect(callLlm).not.toHaveBeenCalled();
  });

  test("400 on over-long companyName", async () => {
    const res = await POST(post({ vertical: "defense", companyName: "x".repeat(101) }, "3.3.3.3"));
    expect(res.status).toBe(400);
    expect(callLlm).not.toHaveBeenCalled();
  });

  test("429 once the rate limit is exceeded", async () => {
    let last: Response | undefined;
    for (let i = 0; i < 11; i++) {
      // unknown vertical so each request 400s after the limiter increments (no LLM call)
      last = await POST(post({ vertical: "energy" }, "4.4.4.4"));
    }
    expect(last?.status).toBe(429);
    expect(callLlm).not.toHaveBeenCalled();
  });
});
