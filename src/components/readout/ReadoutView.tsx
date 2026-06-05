/**
 * ReadoutView — the board-ready PQC deal readout.
 *
 * Register (frontend-taste): an EDITORIALLY BOLD briefing, in the family of a
 * premium research report, not an app dashboard and not a timid grey memo. It
 * earns attention through dramatic typographic scale, a masthead where the
 * Mosca verdict is the hero, and one signature data visualization (the exposure
 * timeline) that lets a board SEE the years of exposure. Fixed warm-paper light
 * theme, Geist + Geist Mono, tabular numerals, one slate-ink accent, muted
 * ink-like verdict semantics.
 *
 * Grounding: every fact comes from typed fields. Years
 * and mandate names come from `readout.vertical`; the Mosca verdict, score, and
 * figures come from `readout.mosca` (computed in code). Only `readout.prose` is
 * model-authored, and it renders into prose slots only.
 */

import type { Readout } from "@/lib/readout";
import type { MoscaResult, MoscaVerdict } from "@/lib/mosca";
import { MOSCA_Z, NIST_STANDARDS, type Deadline, type DeadlineStatus } from "@/data/verticals";
import OnePagerActions from "@/components/readout/OnePagerActions";

/* ── verdict + status presentation maps ─────────────────────────────────── */

const VERDICT: Record<
  MoscaVerdict,
  { label: string; text: string; bar: string; bg: string; ring: string; gloss: string }
> = {
  exposed: {
    label: "Exposed",
    text: "text-exposed",
    bar: "bg-exposed",
    bg: "bg-exposed-soft",
    ring: "ring-exposed/25",
    gloss: "Exposed even under the most generous estimate of when a quantum computer arrives.",
  },
  "at-risk": {
    label: "At risk",
    text: "text-atrisk",
    bar: "bg-atrisk",
    bg: "bg-atrisk-soft",
    ring: "ring-atrisk/25",
    gloss: "Exposed if a quantum computer arrives at the earliest plausible estimate.",
  },
  "lower-risk": {
    label: "Lower risk",
    text: "text-lowerrisk",
    bar: "bg-lowerrisk",
    bg: "bg-lowerrisk-soft",
    ring: "ring-lowerrisk/25",
    gloss: "Not exposed even under the earliest plausible estimate.",
  },
};

const STATUS_LABEL: Record<DeadlineStatus, string> = {
  "in-force": "In force",
  proposed: "Proposed",
  target: "Target",
  preference: "Preference",
};

/* ── small shared primitives ─────────────────────────────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ink-faint">
      {children}
    </span>
  );
}

function paragraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function Prose({ text, lead = false }: { text: string; lead?: boolean }) {
  return (
    <div className={`space-y-4 ${lead ? "text-[17px] leading-8 text-ink" : "text-[15px] leading-7 text-ink-soft"}`}>
      {paragraphs(text).map((p, i) => (
        <p key={i} className="max-w-[68ch]">
          {p}
        </p>
      ))}
    </div>
  );
}

function Section({
  index,
  title,
  kicker,
  children,
}: {
  index: number;
  title: string;
  kicker?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="readout-rise scroll-mt-24"
      style={{ "--rise-index": index } as React.CSSProperties}
    >
      <div className="mb-7 flex items-baseline gap-5 border-t-2 border-ink/80 pt-5">
        <span className="font-mono text-sm font-medium text-accent tabular-nums">
          {String(index).padStart(2, "0")}
        </span>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">{title}</h2>
          {kicker ? <p className="mt-1 text-sm text-ink-faint">{kicker}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

/* ── masthead with the verdict as the hero ───────────────────────────────── */

function VerdictHero({ mosca }: { mosca: MoscaResult }) {
  const v = VERDICT[mosca.verdict];
  return (
    <div className={`print-keep rounded-2xl ${v.bg} p-1.5 ring-1 ${v.ring}`}>
      <div className="rounded-[calc(1rem-0.375rem)] bg-surface px-7 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
        <Eyebrow>Mosca urgency</Eyebrow>
        <div className="mt-3 flex items-end gap-2">
          <span className={`font-mono text-7xl font-medium leading-[0.85] tabular-nums ${v.text}`}>
            {mosca.score}
          </span>
          <span className="pb-2 font-mono text-base text-ink-faint tabular-nums">/100</span>
        </div>
        <div className={`mt-2 text-3xl font-semibold tracking-tight ${v.text}`}>{v.label}</div>
        <p className="mt-4 border-t border-line pt-4 text-[13px] leading-6 text-ink-soft">
          {v.gloss}
        </p>
      </div>
    </div>
  );
}

function Masthead({ readout }: { readout: Readout }) {
  const { vertical, companyName } = readout;
  const subject = companyName ?? `Representative ${vertical.label} organization`;

  return (
    <header className="readout-rise" style={{ "--rise-index": 0 } as React.CSSProperties}>
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <Eyebrow>Post-quantum deal readout</Eyebrow>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            {subject}
          </h1>
          <p className="mt-5 max-w-[52ch] text-[17px] leading-8 text-ink-soft">{vertical.summary}</p>
          <dl className="mt-7 flex flex-wrap gap-x-10 gap-y-3 text-sm">
            <div>
              <dt className="text-xs text-ink-faint">Vertical</dt>
              <dd className="mt-0.5 font-medium text-ink">{vertical.label}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-faint">Mandates</dt>
              <dd className="mt-0.5 font-medium text-ink">{vertical.mandates.join(", ")}</dd>
            </div>
          </dl>
        </div>
        <div className="lg:col-span-5">
          <VerdictHero mosca={readout.mosca} />
        </div>
      </div>
    </header>
  );
}

/* ── section 2: the exposure timeline (signature visualization) ──────────── */

function pctOf(years: number, axisMax: number): number {
  return Math.min(100, Math.max(0, (years / axisMax) * 100));
}

function ExposureTimeline({ mosca }: { mosca: MoscaResult }) {
  const v = VERDICT[mosca.verdict];
  const axisMax = Math.max(mosca.xPlusY, mosca.zHighYears, 1);
  const overhang = Math.max(0, mosca.xPlusY - mosca.zHighYears);

  const barWidth = pctOf(mosca.xPlusY, axisMax);
  const threatLeft = pctOf(mosca.zLowYears, axisMax);
  const threatWidth = Math.max(2, pctOf(mosca.zHighYears, axisMax) - threatLeft);
  // Inside the bar (which spans 0..X+Y), the exposed years begin once the latest
  // plausible quantum-computer arrival (zHigh) has passed.
  const redLeftInBar = mosca.xPlusY > 0 ? (mosca.zHighYears / mosca.xPlusY) * 100 : 100;

  return (
    <div className={`print-keep rounded-2xl ${v.bg} p-1.5 ring-1 ${v.ring}`}>
      <div className="rounded-[calc(1rem-0.375rem)] bg-surface px-6 py-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] sm:px-8">
        <p className="text-[15px] font-medium leading-6 text-ink">
          How long this data must stay secret, against when a quantum computer could break it.
        </p>

        {/* one shared timeline: a bar (secrecy need) crossed by the quantum-threat window */}
        <div className="relative mt-7 h-14">
          {/* quantum-threat window — a vertical zone on the same axis */}
          <div
            className="absolute inset-y-0 rounded-sm border-x border-dashed border-ink-faint bg-ink/[0.07]"
            style={{ left: `${threatLeft}%`, width: `${threatWidth}%` }}
            aria-hidden
          />
          <div
            className="absolute -top-0.5 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium uppercase tracking-wider text-ink-faint"
            style={{ left: `${threatLeft + threatWidth / 2}%` }}
            aria-hidden
          >
            quantum
          </div>
          {/* the secrecy-requirement bar */}
          <div
            className="bar-grow absolute left-0 top-1/2 h-9 -translate-y-1/2 overflow-hidden rounded-md ring-1 ring-line"
            style={{ width: `${barWidth}%` }}
            aria-hidden
          >
            <div className="h-full w-full bg-accent/20" />
            {overhang > 0 ? (
              <div
                className={`absolute inset-y-0 right-0 ${v.bar}`}
                style={{ left: `${redLeftInBar}%` }}
              />
            ) : null}
          </div>
        </div>

        {/* axis */}
        <div className="mt-2 flex justify-between font-mono text-[11px] tabular-nums text-ink-faint">
          <span>now</span>
          <span>+{axisMax} yrs</span>
        </div>

        {/* legend — names every colour so the chart explains itself */}
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[12px]">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-5 rounded-sm bg-accent/20 ring-1 ring-line" aria-hidden />
            <span className="text-ink-soft">
              Secrecy needed <span className="font-medium text-ink">{mosca.xPlusY} yrs</span>
            </span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-5 rounded-sm border-x border-dashed border-ink-faint bg-ink/[0.07]" aria-hidden />
            <span className="text-ink-soft">
              Quantum computer{" "}
              <span className="font-medium text-ink">
                {mosca.zLowYears}&ndash;{mosca.zHighYears} yrs
              </span>
            </span>
          </span>
          {overhang > 0 ? (
            <span className="inline-flex items-center gap-2">
              <span className={`h-3 w-5 rounded-sm ${v.bar}`} aria-hidden />
              <span className="text-ink-soft">
                Exposed <span className={`font-medium ${v.text}`}>{overhang} yrs</span>
              </span>
            </span>
          ) : null}
        </div>

        {overhang > 0 ? (
          <p className="mt-6 border-t border-line pt-5 text-[15px] leading-7 text-ink">
            This data must stay protected for{" "}
            <span className="font-medium">{mosca.xPlusY} years</span>, but a quantum computer that
            can break today&rsquo;s encryption is plausible within{" "}
            <span className="font-medium">
              {mosca.zLowYears} to {mosca.zHighYears} years
            </span>
            . That leaves <span className={`font-semibold ${v.text}`}>{overhang} years</span> where
            the data is still secret but already decryptable: anything captured today can be unlocked
            before its secrecy requirement ends.
          </p>
        ) : (
          <p className="mt-6 border-t border-line pt-5 text-[15px] leading-7 text-ink-soft">
            {v.gloss}
          </p>
        )}
      </div>
    </div>
  );
}

function Inequality({ mosca }: { mosca: MoscaResult }) {
  const v = VERDICT[mosca.verdict];
  const zRange =
    mosca.zLowYears === mosca.zHighYears
      ? `${mosca.zLowYears}`
      : `${mosca.zLowYears}–${mosca.zHighYears}`;
  const figures: { value: string; label: string }[] = [
    { value: `${mosca.x}`, label: "X · data shelf-life" },
    { value: "+", label: "" },
    { value: `${mosca.y}`, label: "Y · migration" },
    { value: "=", label: "" },
    { value: `${mosca.xPlusY}`, label: "X + Y" },
    { value: ">", label: "" },
    { value: zRange, label: "Z · to quantum" },
  ];
  return (
    <div className="print-keep mt-6 flex flex-wrap items-start justify-center gap-x-5 gap-y-3 rounded-xl border border-line bg-paper px-5 py-5 sm:gap-x-7">
      {figures.map((f, i) =>
        f.label ? (
          <div key={i} className="flex flex-col items-center">
            <span className="font-mono text-2xl font-medium tabular-nums text-ink">{f.value}</span>
            <span className="mt-1 text-[10px] uppercase tracking-wider text-ink-faint">{f.label}</span>
          </div>
        ) : (
          <span key={i} className="font-mono text-xl text-ink-faint">
            {f.value}
          </span>
        ),
      )}
      <div className="flex flex-col items-center">
        <span className="font-mono text-xl text-ink-faint">&rarr;</span>
      </div>
      <span className={`self-center text-lg font-semibold ${v.text}`}>{v.label}</span>
    </div>
  );
}

/* ── section 3: regulatory clock ─────────────────────────────────────────── */

function statusTone(status: DeadlineStatus): { dot: string; text: string } {
  if (status === "in-force") return { dot: "bg-exposed ring-exposed/30", text: "text-exposed" };
  if (status === "proposed") return { dot: "bg-atrisk ring-atrisk/30", text: "text-atrisk" };
  if (status === "preference") return { dot: "bg-accent ring-accent/30", text: "text-accent" };
  return { dot: "bg-ink-faint ring-ink-faint/30", text: "text-ink-faint" };
}

function NowMarker({ year }: { year: number }) {
  return (
    <li className="relative pb-8 pl-8">
      <span
        className="absolute -left-[9px] top-0.5 h-4 w-4 rounded-full bg-accent ring-4 ring-paper"
        aria-hidden
      />
      <div className="flex flex-wrap items-baseline gap-x-3">
        <span className="font-mono text-xl font-semibold tabular-nums text-accent">{year}</span>
        <span className="text-sm font-semibold uppercase tracking-wider text-accent">Today</span>
      </div>
      <p className="mt-1.5 text-[13px] text-ink-faint">Where the regulatory clock stands now.</p>
    </li>
  );
}

function RegulatoryNode({ d, passed }: { d: Deadline; passed: boolean }) {
  const tone = statusTone(d.status);
  const label = passed ? "Passed" : d.status === "in-force" ? "In force" : STATUS_LABEL[d.status];
  return (
    <li className={`relative pb-8 pl-8 last:pb-0 ${passed ? "opacity-55" : ""}`}>
      <span
        className={`absolute -left-[7px] top-1 h-3 w-3 rounded-full ring-4 ring-paper ${
          passed ? "bg-ink-faint" : tone.dot.split(" ")[0]
        }`}
        aria-hidden
      />
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono text-xl font-medium tabular-nums text-ink">
          {d.year}
          {d.approximate ? <span className="text-ink-faint">~</span> : null}
        </span>
        <span className="text-sm font-semibold text-ink">{d.mandate}</span>
        <span
          className={`text-[10px] font-medium uppercase tracking-wider ${
            passed ? "text-ink-faint" : tone.text
          }`}
        >
          {label}
        </span>
      </div>
      <p className="mt-1.5 max-w-[58ch] text-[15px] leading-6 text-ink-soft">{d.milestone}</p>
    </li>
  );
}

function RegulatoryClock({
  deadlines,
  currentYear,
}: {
  deadlines: Deadline[];
  currentYear: number;
}) {
  const ordered = [...deadlines].sort((a, b) => a.year - b.year);
  // The "now" marker sits before the first deadline dated this year or later.
  const idx = ordered.findIndex((d) => d.year >= currentYear);
  const nowAt = idx === -1 ? ordered.length : idx;
  // A milestone is "passed" only if its date is behind us AND it is a point-in-time
  // target/preference. In-force law is an active obligation, and a proposed rule is
  // still pending; neither is "passed" just because its year is in the past.
  const isPassed = (d: Deadline) =>
    d.year < currentYear && (d.status === "target" || d.status === "preference");

  return (
    <ol className="relative ml-3 border-l-2 border-line-strong">
      {ordered.slice(0, nowAt).map((d, i) => (
        <RegulatoryNode key={`a-${d.mandate}-${d.year}-${i}`} d={d} passed={isPassed(d)} />
      ))}
      <NowMarker year={currentYear} />
      {ordered.slice(nowAt).map((d, i) => (
        <RegulatoryNode key={`b-${d.mandate}-${d.year}-${i}`} d={d} passed={false} />
      ))}
    </ol>
  );
}

/* ── section 4: migration sketch + NIST suite table ──────────────────────── */

function NistSuite({ readout }: { readout: Readout }) {
  const { nistSuite } = readout.vertical;
  const byName = (name: string) => {
    const base = name.replace(/-\d+$/, "");
    return NIST_STANDARDS.find((s) => s.name === base) ?? null;
  };

  const rows = [
    { role: "Key establishment", pick: nistSuite.kem, std: byName(nistSuite.kem) },
    { role: "Signatures", pick: nistSuite.signature, std: byName(nistSuite.signature) },
    { role: "Hash-based signatures", pick: nistSuite.hashSignature, std: byName(nistSuite.hashSignature) },
  ];

  return (
    <div className="print-keep mt-8 overflow-hidden rounded-xl border border-line">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-ink/[0.03] text-[10px] uppercase tracking-wider text-ink-faint">
            <th scope="col" className="px-5 py-3 font-semibold">Surface</th>
            <th scope="col" className="px-5 py-3 font-semibold">Recommended</th>
            <th scope="col" className="px-5 py-3 font-semibold">NIST standard</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => (
            <tr key={r.role}>
              <td className="px-5 py-3.5 text-ink-soft">{r.role}</td>
              <td className="px-5 py-3.5 font-mono font-medium text-accent">{r.pick}</td>
              <td className="px-5 py-3.5 text-ink-soft">
                {r.std ? (
                  <>
                    <span className="font-medium text-ink">{r.std.fips}</span>{" "}
                    <span className="text-ink-faint">
                      ({r.std.name}, formerly {r.std.formerName})
                    </span>
                  </>
                ) : (
                  <span className="text-ink-faint">NIST PQC suite</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-line bg-ink/[0.03] px-5 py-3.5 text-[13px] leading-6 text-ink-soft">
        {nistSuite.paramNote}
      </p>
    </div>
  );
}

/* ── section 5: CISO one-pager (the leave-behind) ────────────────────────── */

/** The soonest deadline still ahead of us (year >= now); the latest if all have passed. */
function nextMilestone(deadlines: Deadline[], currentYear: number): Deadline | null {
  const upcoming = deadlines.filter((d) => d.year >= currentYear).sort((a, b) => a.year - b.year);
  if (upcoming.length) return upcoming[0];
  return [...deadlines].sort((a, b) => b.year - a.year)[0] ?? null;
}

function CisoOnePager({ readout, currentYear }: { readout: Readout; currentYear: number }) {
  const { vertical, companyName } = readout;
  const subject = companyName ?? `a representative ${vertical.label} organization`;
  const lead = nextMilestone(vertical.deadlines, currentYear);
  const brief = `Post-quantum readiness brief for ${subject}\n\n${readout.prose.cisoOnePager}`;

  return (
    <div className="print-keep rounded-2xl bg-ink/[0.04] p-1.5 ring-1 ring-line-strong">
      <article className="rounded-[calc(1rem-0.375rem)] border border-line bg-surface px-7 py-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_18px_40px_-22px_rgba(0,0,0,0.22)] sm:px-9 sm:py-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-ink/80 pb-4">
          <div>
            <Eyebrow>CISO leave-behind</Eyebrow>
            <p className="mt-2 text-base font-semibold text-ink">
              Post-quantum readiness brief for {subject}
            </p>
          </div>
          {lead ? (
            <div className="text-right">
              <div className="font-mono text-2xl font-medium tabular-nums text-accent">
                {lead.year}
                {lead.approximate ? "~" : ""}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-ink-faint">
                next {lead.mandate} milestone
              </div>
            </div>
          ) : null}
        </div>
        <div className="pt-6">
          <Prose text={readout.prose.cisoOnePager} />
        </div>
        <OnePagerActions brief={brief} />
      </article>
    </div>
  );
}

/* ── sources footer ──────────────────────────────────────────────────────── */

function Sources({ readout }: { readout: Readout }) {
  const seen = new Set<string>();
  const sources: typeof readout.vertical.sources = [];
  for (const s of readout.vertical.sources) {
    if (!seen.has(s.id)) {
      seen.add(s.id);
      sources.push(s);
    }
  }

  return (
    <footer
      className="readout-rise border-t-2 border-ink/80 pt-6"
      style={{ "--rise-index": 6 } as React.CSSProperties}
    >
      <Eyebrow>Sources</Eyebrow>
      <ol className="mt-5 grid gap-3 sm:grid-cols-2">
        {sources.map((s, i) => (
          <li key={s.id} className="flex gap-3 text-[13px] leading-6">
            <span className="font-mono text-xs text-ink-faint tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-ink-soft">
              <span className="font-medium text-ink">{s.title}.</span> {s.body}
              {s.url ? (
                <>
                  {" "}
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent underline decoration-line-strong underline-offset-2 hover:decoration-accent"
                  >
                    Source
                  </a>
                </>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-8 max-w-[72ch] border-t border-line pt-5 text-[12px] leading-6 text-ink-faint">
        This readout is a go-to-market translation of post-quantum risk into business urgency. It
        does not scan, detect, or analyze code, and it does not produce a cryptographic bill of
        materials. Every date and algorithm name above traces to the cited sources.
      </p>
    </footer>
  );
}

/* ── the assembled readout ───────────────────────────────────────────────── */

export default function ReadoutView({ readout }: { readout: Readout }) {
  // Recover the calendar "now" the Mosca math was computed against, so the
  // regulatory clock anchors to the same year (mosca.zLowYears = MOSCA_Z.lowYear - now).
  const currentYear = MOSCA_Z.lowYear - readout.mosca.zLowYears;

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
      <Masthead readout={readout} />

      <div className="mt-16 space-y-16">
        <Section index={1} title="Discovery brief">
          <Prose text={readout.prose.discoveryBrief} lead />
        </Section>

        <Section
          index={2}
          title="Harvest-now-decrypt-later risk"
          kicker="Quantified with Mosca's inequality"
        >
          <ExposureTimeline mosca={readout.mosca} />
          <Inequality mosca={readout.mosca} />
          <div className="mt-7">
            <Prose text={readout.prose.hndlNarrative} />
          </div>
        </Section>

        <Section index={3} title="Regulatory clock" kicker="The deadlines that apply to this vertical">
          <RegulatoryClock deadlines={readout.vertical.deadlines} currentYear={currentYear} />
        </Section>

        <Section index={4} title="Migration sketch" kicker="Where the NIST suite slots in">
          <Prose text={readout.prose.migrationSketch} />
          <NistSuite readout={readout} />
        </Section>

        <Section index={5} title="CISO one-pager" kicker="A ready-to-send leave-behind">
          <CisoOnePager readout={readout} currentYear={currentYear} />
        </Section>
      </div>

      <div className="mt-16">
        <Sources readout={readout} />
      </div>
    </article>
  );
}
