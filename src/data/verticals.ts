/**
 * verticals.ts — the single source of truth for every PQC fact in any readout.
 *
 * Every regulatory deadline and NIST algorithm name that appears in any output must trace
 * to this file. The model composes prose around these facts; it never sources a date or an
 * algorithm name from memory. The facts-grounding gate imports `groundedFacts()` and
 * asserts the model output contains nothing outside it.
 *
 * Every fact below is transcribed from a primary source and cited in its `sources` entry.
 * Timelines verified against primary sources on 2026-06-05:
 *   - Defense  — CNSA 2.0 (2025/2026/2027/2030/2033) + NSM-10 (2035): NSA CNSA 2.0 FAQ.
 *   - Finance  — EU DORA (applies 17 Jan 2025) + EU PQC roadmap (plans 2026, high-risk 2030,
 *                full 2035): EU Coordinated Implementation Roadmap (NIS Cooperation Group).
 *   - Healthcare — HIPAA Security Rule NPRM (issued Dec 2024 / published Jan 2025): proposed,
 *                no final rule as of mid-2026, timeline uncertain.
 *   - Mosca Z range (2029–2035): a contested CRQC estimate; presented as a range, never a
 *                single Q-Day.
 * Several dates are hedged (proposed, approximate) and labelled as such in the output.
 * Re-confirm against the cited primary sources before any high-stakes use.
 *
 * X (data shelf-life) and Y (migration time) are editable modeling assumptions per vertical,
 * not cited facts; the UI lets the user override them.
 */

export type DeadlineStatus = "in-force" | "proposed" | "target" | "preference";

export type Deadline = {
  /** Short mandate name this milestone belongs to. */
  mandate: string;
  /** Plain-language milestone, customer-facing (no em dashes). */
  milestone: string;
  /** Calendar year the milestone lands. */
  year: number;
  /** Whether this is law today, a proposal, a target, or a stated preference. */
  status: DeadlineStatus;
  /** Key into `sources`. */
  sourceId: string;
  /** Optional note when the date is approximate or hedged in the spec. */
  approximate?: boolean;
};

export type Source = {
  id: string;
  title: string;
  body: string;
  /** Canonical URL where confidently known; otherwise null (cite by title + body). */
  url: string | null;
};

export type NistStandard = {
  /** FIPS number, e.g. "FIPS 203". */
  fips: string;
  /** Standardized name, e.g. "ML-KEM". */
  name: string;
  /** Pre-standardization name, e.g. "Kyber". */
  formerName: string;
  /** What it is for, customer-facing. */
  purpose: string;
  /** Year finalized. */
  year: number;
};

export type Vertical = {
  id: "defense" | "finance" | "healthcare";
  label: string;
  /** One-line sector exposure framing (customer-facing). */
  summary: string;
  /** X: default years the data must stay confidential. EDITABLE ASSUMPTION. */
  dataShelfLifeYears: number;
  /** Y: default years to migrate to PQC. EDITABLE ASSUMPTION. */
  migrationYears: number;
  /** The regulatory clock for this vertical. */
  deadlines: Deadline[];
  /** Mandate names that apply to this vertical. */
  mandates: string[];
  /** Recommended NIST parameter sets for this vertical. */
  nistSuite: {
    kem: string;
    signature: string;
    hashSignature: string;
    /** Why these parameters, customer-facing. */
    paramNote: string;
  };
  /** Vertical-specific "harvest now, decrypt later" framing (customer-facing). */
  hndl: string;
  /** Citations backing this vertical's deadlines. */
  sources: Source[];
};

/**
 * The quantum threat primitives. Symmetric (AES) is weakened, not broken;
 * public-key (RSA, ECC) is broken by Shor's algorithm on a CRQC.
 */
export const THREAT = {
  brokenByShor: ["RSA", "ECC"],
  weakenedByGrover: ["AES"],
  algorithms: ["Shor", "Grover"],
  hndl: "Adversaries capture encrypted data today and decrypt it after a cryptographically relevant quantum computer exists. Data with a long confidentiality lifetime is therefore at risk now.",
} as const;

/** NIST PQC standards, finalized August 2024. */
export const NIST_STANDARDS: NistStandard[] = [
  {
    fips: "FIPS 203",
    name: "ML-KEM",
    formerName: "Kyber",
    purpose: "Key encapsulation and encryption.",
    year: 2024,
  },
  {
    fips: "FIPS 204",
    name: "ML-DSA",
    formerName: "Dilithium",
    purpose: "Digital signatures.",
    year: 2024,
  },
  {
    fips: "FIPS 205",
    name: "SLH-DSA",
    formerName: "SPHINCS+",
    purpose: "Stateless hash-based signatures.",
    year: 2024,
  },
];

/**
 * Mosca Z: years until a cryptographically relevant quantum computer.
 * Contested; presented as a RANGE, never a single Q-Day.
 */
export const MOSCA_Z = {
  lowYear: 2029,
  highYear: 2035,
  note: "Z is contested. Estimates span roughly 2029 to 2035. Urgency rests on the fixed regulatory deadlines and on harvest-now-decrypt-later, not on a predicted Q-Day.",
} as const;

/**
 * Cross-cutting reference (not vertical-specific). CISA published a list of PQC
 * product categories in January 2026, useful context for buyers evaluating
 * PQC-ready products. Available to any readout; cite by title.
 */
export const CISA_PQC_REFERENCE: Source = {
  id: "cisa-pqc",
  title: "CISA Post-Quantum Cryptography product categories",
  body: "CISA published a list of PQC product categories (January 2026). Cross-cutting reference for buyers evaluating PQC-ready products.",
  url: null,
};

const NIST_SOURCES: Source[] = [
  {
    id: "fips203",
    title: "FIPS 203, Module-Lattice-Based Key-Encapsulation Mechanism Standard",
    body: "NIST, finalized August 2024. Defines ML-KEM.",
    url: "https://csrc.nist.gov/pubs/fips/203/final",
  },
  {
    id: "fips204",
    title: "FIPS 204, Module-Lattice-Based Digital Signature Standard",
    body: "NIST, finalized August 2024. Defines ML-DSA.",
    url: "https://csrc.nist.gov/pubs/fips/204/final",
  },
  {
    id: "fips205",
    title: "FIPS 205, Stateless Hash-Based Digital Signature Standard",
    body: "NIST, finalized August 2024. Defines SLH-DSA.",
    url: "https://csrc.nist.gov/pubs/fips/205/final",
  },
];

export const VERTICALS: Record<Vertical["id"], Vertical> = {
  defense: {
    id: "defense",
    label: "Defense / DIB",
    summary:
      "Defense and federal contractors face the hardest regulatory clock and the longest data confidentiality horizon, which makes the harvest-now-decrypt-later exposure acute.",
    dataShelfLifeYears: 25,
    migrationYears: 5,
    mandates: ["CNSA 2.0", "NSM-10"],
    nistSuite: {
      kem: "ML-KEM-1024",
      signature: "ML-DSA-87",
      hashSignature: "SLH-DSA",
      paramNote:
        "CNSA 2.0 specifies the highest-strength parameter sets, ML-KEM-1024 and ML-DSA-87, for national security systems.",
    },
    hndl: "National security data carries a multi-decade confidentiality requirement, so traffic captured today can stay sensitive well past any realistic Q-Day window.",
    deadlines: [
      {
        mandate: "CNSA 2.0",
        milestone: "Software and firmware signing should support and prefer CNSA 2.0.",
        year: 2025,
        status: "preference",
        sourceId: "cnsa2",
      },
      {
        mandate: "CNSA 2.0",
        milestone:
          "Traditional networking equipment (VPNs, routers) should support and prefer CNSA 2.0.",
        year: 2026,
        status: "target",
        sourceId: "cnsa2",
      },
      {
        mandate: "CNSA 2.0",
        milestone: "Operating systems should support and prefer CNSA 2.0.",
        year: 2027,
        status: "target",
        sourceId: "cnsa2",
      },
      {
        mandate: "CNSA 2.0",
        milestone:
          "Software signing, firmware signing, and networking equipment should use CNSA 2.0 exclusively.",
        year: 2030,
        status: "target",
        sourceId: "cnsa2",
      },
      {
        mandate: "CNSA 2.0",
        milestone:
          "CNSA 2.0 used exclusively across national security systems (browsers, servers, cloud, operating systems, niche equipment).",
        year: 2033,
        status: "target",
        sourceId: "cnsa2",
      },
      {
        mandate: "NSM-10",
        milestone: "Target for national security systems to be quantum-resistant.",
        year: 2035,
        status: "target",
        sourceId: "nsm10",
      },
    ],
    sources: [
      {
        id: "cnsa2",
        title: "Commercial National Security Algorithm Suite 2.0 FAQ",
        body: "NSA (FAQ, Dec 2024). Transition timeline by category: support and prefer CNSA 2.0 from 2025 (signing, browsers/servers), 2026 (networking), 2027 (operating systems), 2030 (niche); exclusive use by 2030 (signing, networking) and 2033 (all other national security systems). Specifies ML-KEM-1024 and ML-DSA-87. Years confirmed against the NSA CNSA 2.0 FAQ on 2026-06-05.",
        url: "https://www.nsa.gov/Press-Room/Digital-Media-Center/Document-Gallery/igphoto/2003071836/",
      },
      {
        id: "nsm10",
        title: "National Security Memorandum 10 (NSM-10)",
        body: "White House. Sets 2035 as the target for migrating national security systems to quantum-resistant cryptography.",
        url: "https://www.whitehouse.gov/briefing-room/statements-releases/2022/05/04/national-security-memorandum-on-promoting-united-states-leadership-in-quantum-computing-while-mitigating-risks-to-vulnerable-cryptographic-systems/",
      },
      ...NIST_SOURCES,
    ],
  },

  finance: {
    id: "finance",
    label: "Finance",
    summary:
      "Financial institutions hold long-lived transaction, contract, and customer data under rising operational-resilience expectations, which raises both the migration bar and the harvest-now-decrypt-later stakes.",
    dataShelfLifeYears: 10,
    migrationYears: 4,
    mandates: ["EU DORA", "EU PQC Roadmap"],
    nistSuite: {
      kem: "ML-KEM",
      signature: "ML-DSA",
      hashSignature: "SLH-DSA",
      paramNote:
        "The finalized NIST suite (FIPS 203/204/205) applies; parameter selection follows institutional risk tiering.",
    },
    hndl: "Financial records, contracts, and customer identity data retain value for many years, so encrypted archives harvested now remain a liability after Q-Day.",
    deadlines: [
      {
        mandate: "EU DORA",
        milestone:
          "Digital Operational Resilience Act applies (from 17 January 2025), raising ICT risk-management and cryptographic-control expectations for financial entities.",
        year: 2025,
        status: "in-force",
        sourceId: "dora",
      },
      {
        mandate: "EU PQC Roadmap",
        milestone:
          "EU Member States should have a national post-quantum cryptography implementation plan in place.",
        year: 2026,
        status: "target",
        sourceId: "eu-roadmap",
      },
      {
        mandate: "EU PQC Roadmap",
        milestone:
          "High-risk use cases, including financial services, should be transitioned to post-quantum cryptography.",
        year: 2030,
        status: "target",
        sourceId: "eu-roadmap",
      },
      {
        mandate: "EU PQC Roadmap",
        milestone:
          "Medium-risk use cases fully migrated; low-risk use cases substantially migrated.",
        year: 2035,
        status: "target",
        sourceId: "eu-roadmap",
      },
    ],
    sources: [
      {
        id: "dora",
        title: "Digital Operational Resilience Act (Regulation (EU) 2022/2554)",
        body: "EU. Applies from 17 January 2025. Raises operational-resilience and cryptography expectations for financial entities.",
        url: "https://eur-lex.europa.eu/eli/reg/2022/2554/oj",
      },
      {
        id: "eu-roadmap",
        title: "A Coordinated Implementation Roadmap for the Transition to Post-Quantum Cryptography",
        body: "EU NIS Cooperation Group, adopted June 2025. National PQC implementation plans by end of 2026; high-risk use cases (including financial services) transitioned by end of 2030; medium-risk fully and low-risk substantially migrated by end of 2035. Years confirmed against the published roadmap on 2026-06-05.",
        url: "https://digital-strategy.ec.europa.eu/en/library/coordinated-implementation-roadmap-transition-post-quantum-cryptography",
      },
      ...NIST_SOURCES,
    ],
  },

  healthcare: {
    id: "healthcare",
    label: "Healthcare",
    summary:
      "Patient records carry a multi-decade confidentiality horizon, which produces strong harvest-now-decrypt-later exposure even though the encryption mandate is still tightening.",
    dataShelfLifeYears: 25,
    migrationYears: 4,
    mandates: ["HIPAA Security Rule (proposed update)"],
    nistSuite: {
      kem: "ML-KEM",
      signature: "ML-DSA",
      hashSignature: "SLH-DSA",
      paramNote:
        "The finalized NIST suite (FIPS 203/204/205) applies; encryption-at-rest and in-transit are the primary surfaces.",
    },
    hndl: "Patient health records stay sensitive for a lifetime, so encrypted clinical data captured today is among the most exposed to a future decryption capability.",
    deadlines: [
      {
        mandate: "HIPAA Security Rule (proposed update)",
        milestone:
          "HIPAA Security Rule update proposed (NPRM, January 2025): would make encryption of electronic protected health information mandatory at rest and in transit, removing the current addressable designation. Proposed and not yet final; the final-rule timeline is uncertain.",
        year: 2025,
        status: "proposed",
        sourceId: "hipaa",
      },
    ],
    sources: [
      {
        id: "hipaa",
        title: "HIPAA Security Rule Notice of Proposed Rulemaking (NPRM)",
        body: "HHS Office for Civil Rights. NPRM issued 27 December 2024 and published in the Federal Register 6 January 2025; proposes mandatory encryption of ePHI at rest and in transit. Status PROPOSED; no final rule issued as of mid-2026 and the timeline is uncertain. Confirmed 2026-06-05.",
        url: "https://www.hhs.gov/hipaa/for-professionals/security/hipaa-security-rule-nprm/index.html",
      },
      ...NIST_SOURCES,
    ],
  },
};

/**
 * groundedFacts — the grounding contract.
 *
 * Returns every atomic fact (year strings + algorithm/standard names) that may legitimately
 * appear in a generated readout, DERIVED from the structured data above so there is exactly
 * one source of truth. The facts-grounding gate uses this to assert the model invented
 * no date or algorithm name.
 */
export function groundedFacts(): string[] {
  const facts = new Set<string>();

  // Threat primitives.
  for (const a of THREAT.brokenByShor) facts.add(a);
  for (const a of THREAT.weakenedByGrover) facts.add(a);
  for (const a of THREAT.algorithms) facts.add(a);

  // NIST standards: FIPS numbers, standardized names, former names.
  for (const s of NIST_STANDARDS) {
    facts.add(s.fips);
    facts.add(s.name);
    facts.add(s.formerName);
    facts.add(String(s.year));
  }

  // Mosca Z range.
  facts.add(String(MOSCA_Z.lowYear));
  facts.add(String(MOSCA_Z.highYear));

  // Per-vertical: deadline years, mandate names, recommended parameter sets.
  for (const v of Object.values(VERTICALS)) {
    for (const m of v.mandates) facts.add(m);
    for (const d of v.deadlines) {
      facts.add(String(d.year));
      facts.add(d.mandate);
    }
    facts.add(v.nistSuite.kem);
    facts.add(v.nistSuite.signature);
    facts.add(v.nistSuite.hashSignature);
  }

  return Array.from(facts);
}

export const VERTICAL_IDS = Object.keys(VERTICALS) as Vertical["id"][];
