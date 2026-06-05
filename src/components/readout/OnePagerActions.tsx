"use client";

/**
 * OnePagerActions — makes the CISO one-pager an actual leave-behind, not just a
 * claim. "Copy brief" puts the brief on the clipboard ready to paste into an
 * email; "Save as PDF" prints the readout as a clean document (the print
 * stylesheet hides the controls and framing). Client island inside the otherwise
 * server-rendered readout.
 */

import { useState } from "react";

export default function OnePagerActions({ brief }: { brief: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(brief);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (insecure context / permissions); no-op.
    }
  }

  return (
    <div className="no-print mt-7 flex flex-wrap gap-2.5 border-t border-line pt-5">
      <button
        type="button"
        onClick={copy}
        className="inline-flex h-9 items-center whitespace-nowrap rounded-lg bg-accent px-4 text-sm font-medium text-paper transition-colors hover:bg-accent/90 active:scale-[0.98]"
      >
        {copied ? "Brief copied" : "Copy brief"}
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex h-9 items-center whitespace-nowrap rounded-lg border border-line bg-surface px-4 text-sm font-medium text-ink-soft transition-colors hover:border-line-strong hover:text-ink active:scale-[0.98]"
      >
        Save as PDF
      </button>
    </div>
  );
}
