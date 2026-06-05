"use client";

/**
 * ReadoutComposer — the interactive shell around the readout.
 *
 * Design contract: the page is NEVER blank and NEVER an error screen. The selected vertical's
 * archetype renders instantly with no network call; live LLM generation is an
 * enhancement layered on top, and ANY failure in it falls back to that same
 * archetype with a quiet notice. Switching verticals is zero-network.
 *
 * Scope: pick a vertical, optionally type a company name for
 * flavor. The company name never drives facts (the vertical does); it only
 * colors the prose, so a nonsense company name still renders a complete readout
 * because the facts always anchor to the vertical.
 */

import { useState } from "react";
import ReadoutView from "@/components/readout/ReadoutView";
import { sampleReadout } from "@/lib/sample-readout";
import { buildShareUrl } from "@/lib/share";
import type { Readout } from "@/lib/readout";
import { VERTICALS, VERTICAL_IDS, type Vertical } from "@/data/verticals";

type Source = "archetype" | "live";

const COMPANY_MAX = 100;

export default function ReadoutComposer({ initialReadout }: { initialReadout: Readout }) {
  const [verticalId, setVerticalId] = useState<Vertical["id"]>(initialReadout.vertical.id);
  // Pre-fill a recognizable defense prime so the strongest capability (live, company-tailored
  // generation) is one obvious click away rather than hidden behind an empty field.
  const [companyName, setCompanyName] = useState("Lockheed Martin");
  const [readout, setReadout] = useState<Readout>(initialReadout);
  const [source, setSource] = useState<Source>("archetype");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  /** Switch vertical: instantly show that archetype, zero network. */
  function selectVertical(id: Vertical["id"]) {
    if (id === verticalId) return;
    setVerticalId(id);
    setReadout(sampleReadout(id, { companyName }));
    setSource("archetype");
    setNotice(null);
  }

  /** Generate a live, tailored readout; fall back to the archetype on any failure. */
  async function generate() {
    setLoading(true);
    setNotice(null);
    const name = companyName.trim() || null;
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ vertical: verticalId, companyName: name }),
      });
      if (!res.ok) {
        throw new Error(`status ${res.status}`);
      }
      const data = (await res.json()) as Readout;
      setReadout(data);
      setSource("live");
    } catch {
      // Never show a blank or error screen: fall back to the grounded archetype.
      setReadout(sampleReadout(verticalId, { companyName: name }));
      setSource("archetype");
      setNotice(
        "Live generation was unavailable, so this is the grounded archetype readout for the selected vertical. The facts and the regulatory clock are identical; only the prose is templated rather than tailored.",
      );
    } finally {
      setLoading(false);
    }
  }

  /** Copy a stateless share link for the current readout to the clipboard. */
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(buildShareUrl(readout));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (insecure context / permissions); no-op.
    }
  }

  return (
    <div className="flex-1">
      <Controls
        verticalId={verticalId}
        companyName={companyName}
        loading={loading}
        source={source}
        copied={copied}
        onSelectVertical={selectVertical}
        onCompanyChange={setCompanyName}
        onGenerate={generate}
        onCopyLink={copyLink}
      />

      {notice ? (
        <div className="mx-auto max-w-3xl px-5 pt-5 sm:px-8">
          <p
            role="status"
            className="rounded-lg border border-atrisk/30 bg-atrisk-soft px-4 py-3 text-[13px] leading-6 text-ink-soft"
          >
            {notice}
          </p>
        </div>
      ) : source === "archetype" && !loading ? (
        <div className="mx-auto max-w-3xl px-5 pt-5 sm:px-8">
          <p className="rounded-lg border border-accent/25 bg-accent/[0.05] px-4 py-3 text-[13px] leading-6 text-ink-soft">
            This is the grounded archetype. Hit{" "}
            <span className="font-medium text-ink">Generate readout</span> to compose a live,{" "}
            {companyName.trim() ? `${companyName.trim()}-tailored` : "company-tailored"} brief in a
            few seconds. Every fact stays sourced from the data file; only the narrative is written live.
          </p>
        </div>
      ) : null}

      <div className={loading ? "pointer-events-none opacity-50 transition-opacity" : "transition-opacity"}>
        <ReadoutView readout={readout} />
      </div>
    </div>
  );
}

/* ── control bar ─────────────────────────────────────────────────────────── */

function Controls({
  verticalId,
  companyName,
  loading,
  source,
  copied,
  onSelectVertical,
  onCompanyChange,
  onGenerate,
  onCopyLink,
}: {
  verticalId: Vertical["id"];
  companyName: string;
  loading: boolean;
  source: Source;
  copied: boolean;
  onSelectVertical: (id: Vertical["id"]) => void;
  onCompanyChange: (v: string) => void;
  onGenerate: () => void;
  onCopyLink: () => void;
}) {
  return (
    <div className="no-print sticky top-0 z-10 border-b border-line bg-paper/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-5 py-4 sm:px-8 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <fieldset className="flex flex-col gap-1.5">
            <legend className="text-[11px] uppercase tracking-wider text-ink-faint">Vertical</legend>
            <div
              role="radiogroup"
              aria-label="Vertical"
              className="inline-flex rounded-lg border border-line bg-surface p-0.5"
            >
              {VERTICAL_IDS.map((id) => {
                const active = id === verticalId;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={loading}
                    onClick={() => onSelectVertical(id)}
                    className={
                      "rounded-[7px] px-3 py-1.5 text-sm font-medium transition-colors active:scale-[0.98] disabled:opacity-50 " +
                      (active
                        ? "bg-ink text-paper"
                        : "text-ink-soft hover:bg-ink/[0.04] hover:text-ink")
                    }
                  >
                    {VERTICALS[id].label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="company" className="text-[11px] uppercase tracking-wider text-ink-faint">
              Company <span className="normal-case text-ink-faint">(optional)</span>
            </label>
            <input
              id="company"
              type="text"
              value={companyName}
              maxLength={COMPANY_MAX}
              disabled={loading}
              placeholder="e.g. Lockheed Martin"
              onChange={(e) => onCompanyChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) onGenerate();
              }}
              className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50 sm:w-56"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {source === "live" && !loading ? (
            <span className="hidden text-[11px] uppercase tracking-wider text-lowerrisk sm:inline">
              Tailored
            </span>
          ) : null}
          <button
            type="button"
            onClick={onCopyLink}
            disabled={loading}
            className="inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-lg border border-line bg-surface px-3.5 text-sm font-medium text-ink-soft transition-colors hover:border-line-strong hover:text-ink active:scale-[0.98] disabled:opacity-50"
          >
            {copied ? "Link copied" : "Copy link"}
          </button>
          <button
            type="button"
            onClick={onGenerate}
            disabled={loading}
            className="group inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-accent px-4 text-sm font-medium text-paper transition-colors hover:bg-accent/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <>
                <Spinner />
                Composing…
              </>
            ) : (
              "Generate readout"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-paper/40 border-t-paper"
    />
  );
}
