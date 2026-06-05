/**
 * share.ts — stateless share links (URL-encoded payload in the fragment).
 *
 * A share link carries only {vertical, company, prose} base64url-encoded in the
 * URL fragment. Facts are NOT carried: they are rebuilt from the data file on
 * load via computeMosca() + VERTICALS, exactly as a fresh readout would. Two
 * consequences:
 *   1. The link is small (prose only) and needs no storage or server round-trip
 *      (the fragment never leaves the browser).
 *   2. A tampered link can never surface a fake fact. The regulatory clock,
 *      Mosca math, and NIST suite always come from the data file; and the shared
 *      prose is re-run through the grounding gate, falling back to the grounded
 *      archetype prose if it fails. The "wrong date in front of a board" failure
 *      cannot be introduced through a share link.
 */

import { computeMosca } from "@/lib/mosca";
import { checkReadoutGrounding } from "@/lib/facts-grounding";
import { sampleReadout } from "@/lib/sample-readout";
import type { Readout, ReadoutProse } from "@/lib/readout";
import { VERTICALS, MOSCA_Z, VERTICAL_IDS, type Vertical } from "@/data/verticals";

type SharePayload = {
  /** vertical id */
  v: Vertical["id"];
  /** company name (flavor only) */
  c: string | null;
  /** the four composed prose sections */
  p: ReadoutProse;
};

const PROSE_KEYS: (keyof ReadoutProse)[] = [
  "discoveryBrief",
  "hndlNarrative",
  "migrationSketch",
  "cisoOnePager",
];

/* ── base64url over UTF-8 (handles curly quotes etc. in prose) ───────────── */

function bytesToB64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBytes(s: string): Uint8Array {
  const pad = (4 - (s.length % 4)) % 4;
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/* ── encode / decode ─────────────────────────────────────────────────────── */

/** Serialize a readout to the fragment payload (prose + identity only). */
export function encodeShare(readout: Readout): string {
  const payload: SharePayload = {
    v: readout.vertical.id,
    c: readout.companyName,
    p: readout.prose,
  };
  return bytesToB64url(new TextEncoder().encode(JSON.stringify(payload)));
}

function isProse(x: unknown): x is ReadoutProse {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return PROSE_KEYS.every((k) => typeof o[k] === "string");
}

function parsePayload(fragment: string): SharePayload | null {
  try {
    const json = new TextDecoder().decode(b64urlToBytes(fragment));
    const obj = JSON.parse(json) as unknown;
    if (!obj || typeof obj !== "object") return null;
    const o = obj as Record<string, unknown>;
    if (typeof o.v !== "string" || !(VERTICAL_IDS as string[]).includes(o.v)) return null;
    if (o.c !== null && typeof o.c !== "string") return null;
    if (!isProse(o.p)) return null;
    return { v: o.v as Vertical["id"], c: o.c, p: o.p };
  } catch {
    return null;
  }
}

/**
 * Rebuild a full readout from a fragment. Facts come from the data file; only
 * prose comes from the link, and only if it passes the grounding gate. Returns
 * null if the fragment is malformed (caller shows a graceful invalid state).
 */
export function decodeShare(fragment: string, currentYear?: number): Readout | null {
  const payload = parsePayload(fragment);
  if (!payload) return null;

  const vertical = VERTICALS[payload.v];
  const year = currentYear ?? new Date().getFullYear();
  const mosca = computeMosca({
    dataShelfLifeYears: vertical.dataShelfLifeYears,
    migrationYears: vertical.migrationYears,
    zLowYear: MOSCA_Z.lowYear,
    zHighYear: MOSCA_Z.highYear,
    currentYear: year,
  });

  // Re-ground the shared prose. If a link was tampered to inject an ungrounded
  // date or algorithm name, drop the prose back to the grounded archetype so no
  // fake fact can render. Facts (above) are already data-file sourced.
  const grounded = checkReadoutGrounding(payload.p).grounded
    ? payload.p
    : sampleReadout(payload.v, { companyName: payload.c, currentYear: year }).prose;

  return {
    vertical,
    companyName: payload.c?.trim() || null,
    mosca,
    prose: grounded,
  };
}

/** Build the absolute share URL for the current readout (browser only). */
export function buildShareUrl(readout: Readout): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/r#${encodeShare(readout)}`;
}
