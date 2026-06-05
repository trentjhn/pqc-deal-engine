/**
 * Framing — a plain, truthful statement of what this tool is and the problem it
 * addresses, so a cold viewer understands the point before the tool itself.
 *
 * Deliberately no self-promotion and no "built in X" framing: it describes the
 * work, not the author, and lets the working tool below speak for itself.
 */

export default function Framing() {
  return (
    <section className="no-print border-b border-line">
      <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
        <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ink-faint">
          Post-quantum deal readouts
        </span>

        <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
          Finding the vulnerable cryptography is the easy part.
          <span className="mt-2 block text-accent">Getting a CISO to act on it is the job.</span>
        </h1>

        <div className="mt-7 max-w-[62ch] space-y-5 text-[17px] leading-8 text-ink-soft">
          <p>
            Post-quantum cryptography is a commercial problem before it is a technical one. The
            standards are settled and the tools that scan a codebase for vulnerable encryption are a
            crowded category. What actually moves a buyer is different: a specific regulatory
            deadline, the harvest-now-decrypt-later exposure made concrete, and a board-ready case
            that gets none of its facts wrong.
          </p>
          <p>
            This tool builds that case. Choose a vertical and it generates a readout: the exposure
            quantified with the Mosca inequality, the regulatory deadlines that apply, and a CISO
            leave-behind. Every date and algorithm name is drawn from a versioned facts file rather
            than the model&rsquo;s memory, so the readout cannot invent a deadline or a standard.
          </p>
        </div>
      </div>
    </section>
  );
}
