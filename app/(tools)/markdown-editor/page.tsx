"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckIcon, CopyBlocked, CopyIcon, ToolIntro, UndoToast, useCopy, useUndo, Workbench } from "@/components/workbench";
import { renderMarkdown } from "@/lib/markdown-editor/render";

const DRAFT_KEY = "devtools-suite:markdown-editor:draft-v1";

const SAMPLE = `# Markdown Editor

Write on the left, preview on the right.

## Features
- **Bold** and *italic*
- \`inline code\`
- [Links](https://bookchaowalit.com)

1. Numbered lists
2. Tables

| Syntax | Result |
| --- | --- |
| \`**bold**\` | **bold** |

> Notes stay in your browser.

\`\`\`
console.log("hello");
\`\`\`
`;

export default function MarkdownEditorTool() {
  const [source, setSource] = useState(SAMPLE);
  const [announcement, setAnnouncement] = useState("");
  // "loading" until the saved draft is read after hydration; "saved" once this browser holds the text; "off" if storage is blocked.
  const [storage, setStorage] = useState<"loading" | "saved" | "off">("loading");
  const loaded = useRef(false);
  const undo = useUndo();
  const { copied, blocked, copy } = useCopy(source, (ok) => setAnnouncement(ok ? "Markdown copied to the clipboard." : "Copy was blocked. Select the text and copy it by hand."));
  // The draft is kept in this browser so a reload or closed tab does not lose it.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { const saved = localStorage.getItem(DRAFT_KEY); if (saved !== null) setSource(saved); setStorage("saved"); } catch { setStorage("off"); }
      loaded.current = true;
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  /** Every edit goes through here, so the draft is written as it changes (the sample itself is not stored). */
  const update = (next: string) => {
    setSource(next);
    if (!loaded.current) return;
    try { if (next === SAMPLE) localStorage.removeItem(DRAFT_KEY); else localStorage.setItem(DRAFT_KEY, next); } catch { setStorage("off"); }
  };
  const reset = () => { const before = source; update(SAMPLE); undo.offer("Replaced with the sample.", () => update(before)); };
  // renderMarkdown escapes HTML in the source before adding its own tags. Headings move down one level: the page owns the h1.
  const preview = useMemo(() => renderMarkdown(source, { headingOffset: 1 }), [source]);
  const lines = source ? source.split("\n").length : 0;
  const words = source.trim() ? source.trim().split(/\s+/).length : 0;

  return (
    <Workbench>
      <ToolIntro title="Markdown Editor" summary="Write Markdown on the left and see the formatted result on the right as you type." />

      <div className="wb-panes wb-panes-tall">
        <section className="wb-pane">
          <div className="wb-pane-head">
            <label htmlFor="md-source">Markdown</label>
            <div className="wb-pane-tools">
              <button type="button" className="wb-button-plain" onClick={reset} disabled={source === SAMPLE}>Reset to sample</button>
              <button type="button" className="wb-button" onClick={() => copy(source)} disabled={!source}>
                {copied ? <><CheckIcon />Copied</> : <><CopyIcon />Copy</>}
              </button>
            </div>
          </div>
          <textarea id="md-source" value={source} onChange={(event) => update(event.target.value)} placeholder="Start writing Markdown" aria-describedby="md-meta" spellCheck={false} />
          <CopyBlocked show={blocked} what="the text" />
          <p id="md-meta" className="wb-pane-meta">{lines} lines · {words} words · {source.length} characters{storage === "saved" && source !== SAMPLE ? <> · <span className="wb-saved"><CheckIcon />Saved in this browser</span></> : storage === "off" ? " · Not saved: this browser blocks storage" : ""}</p>
        </section>

        <section className="wb-pane" aria-labelledby="md-preview-label">
          <div className="wb-pane-head"><h2 id="md-preview-label">Preview</h2></div>
          {source.trim() ? (
            <article className="wb-prose" aria-label="Preview" dangerouslySetInnerHTML={{ __html: preview }} />
          ) : (
            <p className="wb-note wb-diff-empty">The formatted text appears here.</p>
          )}
        </section>
      </div>
      <p className="wb-sr" role="status" aria-live="polite">{announcement}</p>
      <UndoToast state={undo} />

      <p className="wb-hint">Covers headings, bold, italic, links, bullet and numbered lists (indent two spaces to nest), tables, quotes and code. Not a full CommonMark implementation. Your draft is saved only in this browser; clearing site data removes it.</p>
    </Workbench>
  );
}
