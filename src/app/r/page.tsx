"use client";

/**
 * /r — render a shared readout from the URL fragment.
 *
 * The payload lives in the fragment (after #), which never reaches the server,
 * so this is a client component: read location.hash, decode, render. Facts are
 * rebuilt from the data file inside decodeShare(); only grounded prose survives.
 * A malformed or empty link shows a clean recovery state, never a blank screen.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import ReadoutView from "@/components/readout/ReadoutView";
import { decodeShare } from "@/lib/share";
import type { Readout } from "@/lib/readout";

type State = { status: "loading" } | { status: "ok"; readout: Readout } | { status: "invalid" };

export default function SharedReadoutPage() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    // The payload lives in the URL fragment, which is only available in the
    // browser. We must render "loading" on the server + first client paint to
    // keep hydration stable, then resolve here. setState in the effect is the
    // intended pattern for this deferred, client-only external read.
    const fragment = window.location.hash.replace(/^#/, "");
    const readout = fragment ? decodeShare(fragment) : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deferred client-only fragment read; see comment above
    setState(readout ? { status: "ok", readout } : { status: "invalid" });
  }, []);

  if (state.status === "loading") {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <p className="text-sm text-ink-faint">Opening shared readout…</p>
      </main>
    );
  }

  if (state.status === "invalid") {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <div className="max-w-md text-center">
          <p className="text-[11px] uppercase tracking-[0.22em] text-ink-faint">Shared readout</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
            This link could not be opened
          </h1>
          <p className="mt-3 text-[15px] leading-7 text-ink-soft">
            The share link is empty or malformed. You can generate a fresh readout instead.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex h-9 items-center rounded-lg bg-accent px-4 text-sm font-medium text-paper transition-colors hover:bg-accent/90 active:scale-[0.98]"
          >
            Create a readout
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <div className="no-print border-b border-line bg-paper/85">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3 sm:px-8">
          <span className="text-[11px] uppercase tracking-wider text-ink-faint">
            Shared post-quantum deal readout
          </span>
          <Link
            href="/"
            className="text-sm font-medium text-accent underline decoration-line-strong underline-offset-2 hover:decoration-accent"
          >
            What is this?
          </Link>
        </div>
      </div>
      <ReadoutView readout={state.readout} />
    </main>
  );
}
