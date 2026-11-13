"use client";

import { useMemo, useState } from "react";
import { CheckIcon, CopyIcon, ToolIntro, useCopy, Workbench } from "@/components/workbench";
import { renderMarkdown } from "@/lib/markdown-editor/render";

const SAMPLE = `# Markdown Editor

Write on the left, preview on the right.

## Features
- **Bold** and *italic*
- \`inline code\`
- [Links](https://bookchaowalit.com)

> Notes stay in your browser.

\`\`\`
console.log("hello");
\`\`\`
`;

export default function MarkdownEditorTool() {
  const [source, setSource] = useState(SAMPLE);
  const [announcement, setAnnouncement] = useState("");
  const { copied, copy } = useCopy(source, (ok) => setAnnouncement(ok ? "Markdown copied to the clipboard." : "Copy was blocked. Select the text and copy it by hand."));
  // renderMarkdown escapes HTML in the source before adding its own tags.
  const preview = useMemo(() => renderMarkdown(source), [source]);
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
              <button type="button" className="wb-button-plain" onClick={() => setSource(SAMPLE)} disabled={source === SAMPLE}>Reset</button>
              <button type="button" className="wb-button" onClick={() => copy(source)} disabled={!source}>
                {copied ? <><CheckIcon />Copied</> : <><CopyIcon />Copy</>}
              </button>
            </div>
          </div>
          <textarea id="md-source" value={source} onChange={(event) => setSource(event.target.value)} placeholder="Start writing Markdown" aria-describedby="md-meta" spellCheck={false} />
          <p id="md-meta" className="wb-pane-meta">{lines} lines · {words} words · {source.length} characters</p>
        </section>

        <section className="wb-pane" aria-labelledby="md-preview-label">
          <div className="wb-pane-head"><h2 id="md-preview-label">Preview</h2></div>
          {source.trim() ? (
            <article className="wb-prose" dangerouslySetInnerHTML={{ __html: preview }} />
          ) : (
            <p className="wb-note wb-diff-empty">The formatted text appears here.</p>
          )}
        </section>
      </div>
      <p className="wb-sr" role="status" aria-live="polite">{announcement}</p>

      <p className="wb-hint">Covers headings, bold, italic, links, lists, quotes and code. Not a full CommonMark implementation; nothing is saved.</p>
    </Workbench>
  );
}
