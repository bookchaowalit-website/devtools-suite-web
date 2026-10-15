"use client";

import { useMemo, useState } from "react";
import { SNIPPETS, filterSnippets } from "@/lib/snippets/catalog";


export default function Home() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedId, setSelectedId] = useState(SNIPPETS[0].id);
  const [copied, setCopied] = useState(false);
  const visible = useMemo(() => filterSnippets(SNIPPETS, query, category), [category, query]);
  const selected = SNIPPETS.find((snippet) => snippet.id === selectedId) || visible[0] || SNIPPETS[0];

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(selected.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch { setCopied(false); }
  }

  return (
    <main className="snippet-shell">
      <header className="snippet-header">
        <div className="snippet-brand"><span className="snippet-cursor" aria-hidden="true" /><span>SPECIMEN / INDEX</span></div>
      </header>

      <section className="snippet-intro">
        <div>
          <h1>Small code, kept sharp.</h1>
          <p>A local shelf of reusable specimens. Pick a language, read the whole shape, copy the part worth keeping.</p>
        </div>
        <span className="snippet-count">{String(SNIPPETS.length).padStart(2, "0")} specimens / local data</span>
      </section>

      <section className="snippet-controls" aria-label="Snippet filters">
        <label><span>FIND</span><input aria-label="Search snippets" placeholder="Search title, language, tag" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="snippet-categories"><span>GROUP</span>{["All", "React", "Python", "TypeScript"].map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>
      </section>

      <section className="snippet-stage">
        <aside className="snippet-list" aria-label="Snippet list">
          <div className="snippet-list-head"><span>LIBRARY</span><span>{visible.length} / {SNIPPETS.length}</span></div>
          {visible.length > 0 ? visible.map((snippet, index) => <button key={snippet.id} type="button" className={`snippet-entry ${selected.id === snippet.id ? "is-selected" : ""}`} onClick={() => setSelectedId(snippet.id)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{snippet.title}</strong><small>{snippet.language}</small></button>) : <p className="snippet-empty">No specimen found.</p>}
        </aside>

        <article className="snippet-sheet" aria-live="polite">
          <div className="snippet-sheet-top"><span>{selected.category} / {selected.language}</span><span>#{selected.id.padStart(2, "0")}</span></div>
          <h2>{selected.title}</h2>
          <div className="snippet-code" aria-label={`${selected.title} code`}>
            <div className="snippet-code-bar"><span>source specimen</span><button type="button" onClick={copyCode}>{copied ? "COPIED" : "COPY CODE"}</button></div>
            <pre><code>{selected.code.split("\n").map((line, index) => <span className="snippet-line" key={`${line}-${index}`}><i>{String(index + 1).padStart(2, "0")}</i>{line || " "}</span>)}</code></pre>
          </div>
          <div className="snippet-tags">{selected.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
          <p className="snippet-sheet-note">Authored demo data · copy stays in your browser clipboard · no save account.</p>
        </article>
      </section>

      <footer className="snippet-footer"><span>BOOKCHAOWALIT / DEV TOOLS</span><span>READ THE SHAPE BEFORE YOU REUSE IT</span></footer>
    </main>
  );
}
