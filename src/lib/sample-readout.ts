/**
 * sample-readout.ts — the deterministic, zero-cost archetype readout.
 *
 * Why this exists: the app must always be able to render a complete, correct readout without an
 * LLM call. This builds one from the same grounded sources every live readout
 * uses: facts + Mosca math come from code/data; only the four prose strings are
 * curated here. Those strings reference ONLY grounded facts (RSA/ECC/Shor,
 * the NIST suite names, CNSA 2.0) and contain no em dashes, so they satisfy the
 * same grounding contract the model output must.
 *
 * Uses:
 *   - The page renders this on first load so a complete readout shows with no API call.
 *   - Generation falls back to this whenever a live readout is unavailable, so the page
 *     never shows a blank or error screen.
 */

import { computeMosca } from "@/lib/mosca";
import type { Readout, ReadoutProse } from "@/lib/readout";
import { VERTICALS, MOSCA_Z, type Vertical } from "@/data/verticals";

const SAMPLE_PROSE: Record<Vertical["id"], ReadoutProse> = {
  defense: {
    discoveryBrief:
      "A defense or defense-industrial-base contractor sits on the hardest regulatory clock in the market and the longest data confidentiality horizon. Classified and controlled-unclassified program data must stay secret for decades, while the cryptography protecting it today rests on RSA and ECC, both breakable by a sufficiently capable quantum computer running Shor's algorithm. The exposure is neither theoretical nor distant. It is a function of how long this data must stay secret set against a fixed federal migration timeline.",
    hndlNarrative:
      "Harvest-now-decrypt-later is why this is urgent today rather than at some future Q-Day. An adversary needs no quantum computer now. It needs only to capture encrypted traffic now and hold it until one exists. For national security data with a multi-decade secrecy requirement, traffic intercepted today stays sensitive well past any plausible window for a cryptographically relevant quantum computer. The Mosca comparison below makes the gap explicit: the time this data must stay secret plus the time to migrate already exceeds the time until that machine is plausible.",
    migrationSketch:
      "Post-quantum cryptography slots into the same places classical public-key crypto lives today: TLS for data in transit, the PKI and certificate chains that establish trust, and the code signing that protects software and firmware supply chains. For national security systems the recommended suite is ML-KEM-1024 for key establishment and ML-DSA-87 for signatures, the highest-strength parameter sets in the finalized NIST standards, with SLH-DSA available as a stateless hash-based signature option. The work is inventory first, then prioritize the longest-lived secrets and the trust anchors that are hardest to rotate.",
    cisoOnePager:
      "The case in one read. Your data must stay secret for decades. The federal clock is fixed and already running. Adversaries are collecting encrypted traffic today to decrypt later. Start with a cryptographic inventory, prioritize the systems whose secrets outlive the migration window, and align the roadmap to the CNSA 2.0 milestones rather than to a contested Q-Day prediction. The standards are final. The deadlines are real. The variable you control is when you start.",
  },
  finance: {
    discoveryBrief:
      "A financial institution holds transaction histories, contracts, and customer identity data that retain value for many years, under operational-resilience expectations that keep rising. The public-key cryptography securing those records today, RSA and ECC, is breakable by a quantum computer running Shor's algorithm. The combination of long-lived data and a tightening regulatory surface is what raises both the migration bar and the harvest-now-decrypt-later stakes.",
    hndlNarrative:
      "Encrypted financial archives captured today remain a liability after a cryptographically relevant quantum computer exists, because the underlying records stay valuable for years. Harvest-now-decrypt-later turns a future capability into a present exposure. The Mosca comparison below sets the confidentiality horizon and migration time against the window until that machine is plausible.",
    migrationSketch:
      "The migration surfaces are familiar: TLS for data in transit, certificate and PKI trust chains, and signing for software and transaction integrity. The finalized NIST suite applies directly, ML-KEM for key establishment and ML-DSA for signatures, with SLH-DSA available for hash-based signatures, and parameter selection following institutional risk tiering. Inventory the long-lived data stores first.",
    cisoOnePager:
      "The case in one read. Your records stay valuable for years. Operational-resilience expectations are rising under EU DORA. Adversaries can harvest encrypted archives now and decrypt them later. Begin with a cryptographic inventory, prioritize the longest-lived data, and adopt the finalized NIST suite on a schedule you set rather than one a breach sets for you.",
  },
  healthcare: {
    discoveryBrief:
      "A healthcare organization holds patient records whose confidentiality horizon runs for a lifetime, which produces strong harvest-now-decrypt-later exposure even as the encryption mandate is still tightening. The cryptography protecting clinical data today, RSA and ECC, is breakable by a quantum computer running Shor's algorithm. Lifetime-sensitive data is among the most exposed to a future decryption capability.",
    hndlNarrative:
      "Patient health data captured in encrypted form today stays sensitive for decades, so it is among the most exposed to a future quantum decryption capability. Harvest-now-decrypt-later is the active threat: collection now, decryption later. The Mosca comparison below sets the multi-decade confidentiality horizon against the plausible window until a capable machine exists.",
    migrationSketch:
      "Encryption at rest and in transit are the primary surfaces, alongside the certificate and PKI trust that secure clinical systems. The finalized NIST suite applies, ML-KEM for key establishment and ML-DSA for signatures, with SLH-DSA available for hash-based signatures. Start the inventory with the systems that store records for the longest.",
    cisoOnePager:
      "The case in one read. Patient records stay sensitive for a lifetime. The encryption mandate is tightening. Adversaries can harvest encrypted clinical data now and decrypt it later. Begin with a cryptographic inventory, prioritize lifetime-sensitive records, and move to the finalized NIST suite ahead of the rule rather than behind it.",
  },
};

/**
 * Build a complete, grounded readout for a vertical with no LLM call.
 * Facts and Mosca math derive from the same sources as live generation; prose
 * is curated and grounded. `currentYear` is injected for deterministic tests.
 */
export function sampleReadout(
  verticalId: Vertical["id"],
  opts: { companyName?: string | null; currentYear?: number } = {},
): Readout {
  const vertical = VERTICALS[verticalId];
  const currentYear = opts.currentYear ?? new Date().getFullYear();

  const mosca = computeMosca({
    dataShelfLifeYears: vertical.dataShelfLifeYears,
    migrationYears: vertical.migrationYears,
    zLowYear: MOSCA_Z.lowYear,
    zHighYear: MOSCA_Z.highYear,
    currentYear,
  });

  return {
    vertical,
    companyName: opts.companyName?.trim() || null,
    mosca,
    prose: SAMPLE_PROSE[verticalId],
  };
}
