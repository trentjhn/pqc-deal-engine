import Framing from "@/components/Framing";
import ReadoutComposer from "@/components/readout/ReadoutComposer";
import { sampleReadout } from "@/lib/sample-readout";

/**
 * The framing band gives a cold viewer the thesis + the engineering story before
 * the tool. The defense archetype is server-rendered as the initial readout, so
 * the first paint is complete with no LLM call. The composer
 * then lets the user switch verticals (instant, zero-network) or generate a
 * tailored readout (live, with graceful fallback).
 */
export default function Home() {
  return (
    <main className="flex-1">
      <Framing />
      <ReadoutComposer initialReadout={sampleReadout("defense")} />
    </main>
  );
}
