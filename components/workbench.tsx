import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Workbench shell: the shared building blocks for single-purpose tools (styles in app/workbench.css).
 * Import only from client tool pages (no "use client" here, so props can be callbacks).
 * A tool page is: <Workbench> → <ToolIntro> → .wb-controls → .wb-panes (input + result .wb-pane) → .wb-actions.
 */

export function Workbench({ children }: { children: ReactNode }) {
  return <main className="wb"><div className="wb-page">{children}</div></main>;
}

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

export const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.01" />
  </svg>
);

export const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" />
  </svg>
);

export const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const SwapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" />
  </svg>
);

/** Title, one plain sentence of what the tool does, and the "runs in your browser" note. */
export function ToolIntro({ title, summary, privacy = "Runs in your browser. Nothing you type is uploaded." }: { title: string; summary: string; privacy?: string }) {
  return (
    <header className="wb-intro">
      <h1>{title}</h1>
      <p>{summary}</p>
      <span className="wb-private"><LockIcon />{privacy}</span>
    </header>
  );
}

export type SegmentOption<T extends string> = { value: T; label: string };

/** Apple-style segmented control for a small set of exclusive modes. */
export function Segmented<T extends string>({ label, options, value, onChange }: { label: string; options: readonly SegmentOption<T>[]; value: T; onChange: (next: T) => void }) {
  // Four or more segments wrap to a 2×2 grid on phones (.wb-segmented-4).
  return (
    <div className={options.length >= 4 ? "wb-segmented wb-segmented-4" : "wb-segmented"} role="group" aria-label={label}>
      {options.map((option) => (
        <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Copies text and shows "Copied" for a moment; the parent announces the result through its live region.
 * `copied` is true only while `current` is still the text that was copied, so editing the input right
 * after copying never leaves a "Copied" label on a result that is not in the clipboard.
 */
export function useCopy(current: string, onResult?: (copied: boolean) => void) {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = async (text: string) => {
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch { ok = false; }
    setCopiedText(ok ? text : null);
    onResult?.(ok);
    window.clearTimeout(timer.current);
    if (ok) timer.current = window.setTimeout(() => setCopiedText(null), 1600);
  };
  return { copied: copiedText !== null && copiedText === current, copy };
}
