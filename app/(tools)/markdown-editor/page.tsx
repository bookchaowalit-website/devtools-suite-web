"use client";

import { useEffect, useMemo, useState } from "react";
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
  // Saving is opt-in (PRODUCT.md: nothing is stored unless you ask). A saved draft from an earlier visit turns it on.
  const [keep, setKeep] = useState(false);
  const [storageBlocked, setStorageBlocked] = useState(false);
  const undo = useUndo();
  const { copied, blocked, copy } = useCopy(source, (ok) => setAnnouncement(ok ? "Markdown copied to the clipboard." : "Copy was blocked. Select the text and copy it by hand."));
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { const saved = localStorage.getItem(DRAFT_KEY); if (saved !== null) { setSource(saved); setKeep(true); } } catch { setStorageBlocked(true); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const write = (text: string, on = keep) => {
    try { if (on) localStorage.setItem(DRAFT_KEY, text); else localStorage.removeItem(DRAFT_KEY); } catch { setStorageBlocked(true); }
  };
  /** Typing goes through here: it saves when keeping is on, and ends any Undo offer so Undo never overwrites new text. */
  const edit = (next: string) => { setSource(next); undo.dismiss(); write(next); };
  const toggleKeep = (on: boolean) => { setKeep(on); write(source, on); setAnnouncement(on ? "Draft is kept in this browser." : "Draft removed from this browser."); };
  const reset = () => {
    const before = source;
    setSource(SAMPLE); write(SAMPLE);
    undo.offer("Replaced with the sample.", () => { setSource(before); write(before); });
  };
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
          <textarea id="md-source" value={source} onChange={(event) => edit(event.target.value)} placeholder="Start writing Markdown" aria-describedby="md-meta" spellCheck={false} />
          <CopyBlocked show={blocked} what="the text" />
          <p id="md-meta" className="wb-pane-meta">{lines} lines · {words} words · {source.length} characters</p>
          <label className="wb-switch wb-pane-switch">
            <input type="checkbox" role="switch" checked={keep} disabled={storageBlocked} onChange={(event) => toggleKeep(event.target.checked)} />
            <span>Keep draft in this browser<small>{storageBlocked ? "This browser blocks storage." : keep ? "Saved as you type. Turn off to remove it." : "Off: the text is gone when you close the tab."}</small></span>
          </label>
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

      <p className="wb-hint">Covers headings, bold, italic, links, bullet and numbered lists, nested by indenting two spaces, tables, quotes and code. Not a full CommonMark implementation. Nothing is saved unless you turn on “Keep draft in this browser”; that copy stays on this device only.</p>
    </Workbench>
  );
}
