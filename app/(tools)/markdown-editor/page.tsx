"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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


export default function Home() {
  const [source, setSource] = useState(SAMPLE);
  const [copied, setCopied] = useState(false);
  const preview = useMemo(() => renderMarkdown(source), [source]);
  const lines = source ? source.split("\n").length : 0;

  async function copySource() {
    try { await navigator.clipboard.writeText(source); setCopied(true); window.setTimeout(() => setCopied(false), 1400); } catch { setCopied(false); }
  }

  return (
    <main className="press-shell">
      <header className="press-topbar"><Link href="/" className="press-mark">TYPE / CHECK</Link><span>client-side writing bench</span><span>{lines} lines · {source.length} chars</span></header>
      <section className="press-hero"><h1>Write it.<br /><em>See it.</em></h1><p>Draft a note, README, or idea with the source and its rendered shape held open at the same time.</p><div className="press-stamp">LOCAL<br />PROOF</div></section>
      <section className="press-toolbar"><span>Two plates / one draft</span><div><button onClick={() => setSource(SAMPLE)}>Reset sample</button><button className="ink-button" onClick={() => void copySource()}>{copied ? "Copied source" : "Copy source"} ↗</button></div></section>
      <section className="writing-bench"><div className="paper-panel source-panel"><div className="panel-head"><span>01 / source</span><span>markdown</span></div><textarea aria-label="Markdown source" value={source} onChange={(event) => setSource(event.target.value)} spellCheck={false} /></div><div className="paper-panel preview-panel"><div className="panel-head"><span>02 / proof</span><span>live preview</span></div><article className="markdown-preview" dangerouslySetInnerHTML={{ __html: preview }} /></div></section>
      <footer className="press-footer"><span>BOOKCHAOWALIT / MARKDOWN EDITOR</span><span>NOT COMMONMARK-COMPLETE · NO CLOUD SAVE</span></footer>
    </main>
  );
}
