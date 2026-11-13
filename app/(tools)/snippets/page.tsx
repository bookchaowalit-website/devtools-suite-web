"use client";

import { useMemo, useState } from "react";
import { CheckIcon, CopyIcon, Segmented, ToolIntro, useCopy, Workbench } from "@/components/workbench";
import { filterSnippets, SNIPPETS } from "@/lib/snippets/catalog";

const CATEGORIES = ["All", "React", "Python", "TypeScript"].map((value) => ({ value, label: value }));

export default function SnippetsTool() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedId, setSelectedId] = useState(SNIPPETS[0].id);
  const [announcement, setAnnouncement] = useState("");
  const visible = useMemo(() => filterSnippets(SNIPPETS, query, category), [category, query]);
  // Only show a snippet that is still in the filtered list; fall back to the first match.
  const selected = visible.find((snippet) => snippet.id === selectedId) ?? visible[0] ?? null;
  const { copied, copy } = useCopy(selected?.code ?? "", (ok) => setAnnouncement(ok ? "Code copied to the clipboard." : "Copy was blocked. Select the code and copy it by hand."));

  return (
    <Workbench>
      <ToolIntro title="Snippets" summary="A small library of reusable code snippets. Filter, read the whole snippet and copy it." privacy="Sample snippets bundled with the page. Nothing is uploaded or saved." />

      <div className="wb-controls">
        <Segmented label="Language" options={CATEGORIES} value={category} onChange={setCategory} />
        <label className="wb-search">
          <span className="wb-sr">Search snippets</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, language or tag" />
        </label>
      </div>
      <p className="wb-sr" role="status" aria-live="polite">{announcement}</p>

      <div className="wb-library">
        <nav className="wb-card wb-library-list" aria-label="Snippets">
          {visible.length ? (
            <ul>
              {visible.map((snippet) => (
                <li key={snippet.id}>
                  <button type="button" aria-current={selected?.id === snippet.id ? "true" : undefined} onClick={() => setSelectedId(snippet.id)}>
                    <strong>{snippet.title}</strong>
                    <span>{snippet.language}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="wb-note">No snippet matches. Try another word or choose All.</p>
          )}
        </nav>

        {selected ? (
          <section className="wb-pane" aria-labelledby="snippet-title">
            <div className="wb-pane-head">
              <h2 id="snippet-title">{selected.title} <span className="wb-muted">{selected.language}</span></h2>
              <button type="button" className="wb-button" onClick={() => copy(selected.code)}>
                {copied ? <><CheckIcon />Copied</> : <><CopyIcon />Copy</>}
              </button>
            </div>
            <pre className="wb-code wb-code-lines"><code>{selected.code.split("\n").map((line, index) => <span key={index}>{line || " "}</span>)}</code></pre>
            <p className="wb-pane-meta">{selected.tags.map((tag) => `#${tag}`).join("  ")}</p>
          </section>
        ) : null}
      </div>

      <p className="wb-hint">These are sample snippets for demos; read the code before you reuse it.</p>
    </Workbench>
  );
}
