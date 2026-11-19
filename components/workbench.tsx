import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

/**
 * Workbench shell: the shared building blocks for single-purpose tools (styles in app/workbench.css).
 * Import only from client tool pages (no "use client" here, so props can be callbacks).
 * A tool page is: <Workbench> → <ToolIntro> → .wb-controls → .wb-panes (input + result .wb-pane) → .wb-actions.
 */

export function Workbench({ children }: { children: ReactNode }) {
  return <main id="main" tabIndex={-1} className="wb"><div className="wb-page">{children}</div></main>;
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

/**
 * Title, one plain sentence of what the tool does, and the "runs in your browser" note. A `warning` (for example
 * "not an engineering approval") gets its own line with an alert icon, so it never hides behind the privacy lock.
 */
export function ToolIntro({ title, summary, privacy = "Runs in your browser. Nothing you type is uploaded.", warning }: { title: string; summary: string; privacy?: string; warning?: string }) {
  return (
    <header className="wb-intro">
      <h1>{title}</h1>
      <p>{summary}</p>
      <span className="wb-private"><LockIcon />{privacy}</span>
      {warning ? <span className="wb-private wb-warning"><AlertIcon />{warning}</span> : null}
    </header>
  );
}

export type SegmentOption<T extends string> = { value: T; label: string; disabled?: boolean };

/** Apple-style segmented control for a small set of exclusive modes. */
export function Segmented<T extends string>({ label, options, value, onChange, disabled = false }: { label: string; options: readonly SegmentOption<T>[]; value: T; onChange: (next: T) => void; disabled?: boolean }) {
  // Four or more segments wrap to a 2×2 grid on phones (.wb-segmented-4).
  return (
    <div className={options.length >= 4 ? "wb-segmented wb-segmented-4" : "wb-segmented"} role="group" aria-label={label}>
      {options.map((option) => (
        <button key={option.value} type="button" aria-pressed={value === option.value} disabled={disabled || option.disabled} onClick={() => onChange(option.value)}>
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
 * `blocked` is true while `current` is the text the browser refused to copy: show <CopyBlocked> for it,
 * because the live region alone is invisible to sighted users.
 */
export function useCopy(current: string, onResult?: (copied: boolean) => void) {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [blockedText, setBlockedText] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = async (text: string) => {
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch { ok = false; }
    setCopiedText(ok ? text : null);
    setBlockedText(ok ? null : text);
    onResult?.(ok);
    window.clearTimeout(timer.current);
    if (ok) timer.current = window.setTimeout(() => setCopiedText(null), 1600);
  };
  return { copied: copiedText !== null && copiedText === current, blocked: blockedText !== null && blockedText === current, copy };
}

/** The visible "copy was blocked" note shown under a copy button (screen readers already hear it from the live region). */
export function CopyBlocked({ show, what = "the result" }: { show: boolean; what?: string }) {
  if (!show) return null;
  return <p className="wb-note wb-note-alert" aria-hidden="true"><AlertIcon />Copy was blocked by the browser. Select {what} and copy it by hand.</p>;
}

export type UndoState = {
  pending: { message: string; restore: () => void; id: number } | null;
  offer: (message: string, restore: () => void) => void;
  undo: () => void;
  dismiss: () => void;
  /** Stop the countdown while the toast has focus or the pointer; resume starts a fresh countdown. */
  pause: () => void;
  resume: () => void;
};

/**
 * Undo for destructive actions (delete, clear, reset): call `offer("Cleared.", restore)` after the change and
 * render <UndoToast state={…} /> once per page. The offer stays for `ms` milliseconds, paused while it has focus.
 */
export function useUndo(ms = 6000): UndoState {
  const [pending, setPending] = useState<UndoState["pending"]>(null);
  const timer = useRef<number | undefined>(undefined);
  const counter = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const start = () => { window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setPending(null), ms); };
  const dismiss = () => { window.clearTimeout(timer.current); setPending(null); };
  const offer = (message: string, restore: () => void) => { counter.current += 1; setPending({ message, restore, id: counter.current }); start(); };
  const undo = () => { pending?.restore(); dismiss(); };
  const pause = () => window.clearTimeout(timer.current);
  const resume = () => { if (pending) start(); };
  return { pending, offer, undo, dismiss, pause, resume };
}

/**
 * A small toast with an Undo button. The status container is always rendered so screen readers hear each offer.
 * When the control that triggered it is gone (a deleted item's button), focus moves to Undo, so keyboard users can
 * reach it at once; the countdown pauses while the toast has focus or the pointer.
 */
export function UndoToast({ state }: { state: UndoState }) {
  const button = useRef<HTMLButtonElement>(null);
  const id = state.pending?.id;
  useEffect(() => {
    if (id === undefined) return;
    const active = document.activeElement;
    if (!active || active === document.body || !active.isConnected) button.current?.focus();
  }, [id]);
  return (
    <div className="wb-toast" role="status" aria-live="polite">
      {state.pending ? (
        <div className="wb-toast-body" onFocus={state.pause} onBlur={state.resume} onMouseEnter={state.pause} onMouseLeave={state.resume}>
          <span>{state.pending.message}</span>
          <button ref={button} type="button" className="wb-toast-undo" onClick={state.undo}>Undo</button>
          <button type="button" className="wb-toast-close" onClick={state.dismiss} aria-label="Dismiss">×</button>
        </div>
      ) : null}
    </div>
  );
}

const noopSubscribe = () => () => {};
/**
 * False on the server and during hydration, true afterwards. Use it for values that depend on the
 * viewer's clock or time zone (today's date, next cron runs) so server HTML never disagrees with the
 * browser (React hydration error #418).
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
