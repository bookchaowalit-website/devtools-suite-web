"use client";

import { useMemo, useState } from "react";
import { CheckIcon, CopyBlocked, CopyIcon, Segmented, ToolIntro, useCopy, Workbench } from "@/components/workbench";
import { filterSnippets, languageLabel, SNIPPETS } from "@/lib/snippets/catalog";

const CATEGORIES = ["All", "React", "Python", "TypeScript"].map((value) => ({ value, label: value }));

export default function SnippetsTool() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedId, setSelectedId] = useState(SNIPPETS[0].id);
  const [announcement, setAnnouncement] = useState("");
  const visible = useMemo(() => filterSnippets(SNIPPETS, query, category), [category, query]);
  // Only show a snippet that is still in the filtered list; fall back to the first match.
  const selected = visible.find((snippet) => snippet.id === selectedId) ?? visible[0] ?? null;
  const reset = () => { setQuery(""); setCategory("All"); setAnnouncement(`Search cleared. Showing all ${SNIPPETS.length} snippets.`); };
  const { copied, blocked, copy } = useCopy(selected?.code ?? "", (ok) => setAnnouncement(ok ? "Code copied to the clipboard." : "Copy was blocked. Select the code and copy it by hand."));

  return (
    <Workbench>
      <ToolIntro title="Snippets" summary="A small library of reusable code snippets. Filter, read the whole snippet and copy it." privacy="Sample snippets bundled with the page. Nothing is uploaded or saved." />

      <div className="wb-controls">
        <Segmented label="Language" options={CATEGORIES} value={category} onChange={setCategory} />
        <div className="wb-search-row">
          <label className="wb-search wb-search-labelled">Search snippets
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Title, language or tag" aria-describedby="snippet-count" />
          </label>
          <p id="snippet-count" className="wb-count">{visible.length === SNIPPETS.length ? `${SNIPPETS.length} snippets` : `${visible.length} of ${SNIPPETS.length} snippets`}</p>
        </div>
      </div>
      <p className="wb-sr" role="status" aria-live="polite">{announcement}</p>

      <div className="wb-library">
        {/* Choosing a snippet shows it beside the list; it is not navigation, so this is a group of toggle buttons. */}
        <div className="wb-card wb-library-list" role="group" aria-label="Snippets">
          {visible.length ? (
            <ul>
              {visible.map((snippet) => (
                <li key={snippet.id}>
                  <button type="button" aria-pressed={selected?.id === snippet.id} aria-controls="snippet-panel" onClick={() => setSelectedId(snippet.id)}>
                    <strong>{snippet.title}</strong>
                    <span>{languageLabel(snippet.language)}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="wb-empty-actions">
              <p className="wb-note">No snippet matches{query.trim() ? ` “${query.trim()}”` : ""}{category !== "All" ? ` in ${category}` : ""}.</p>
              <button type="button" className="wb-button-plain" onClick={reset}>Clear search</button>
            </div>
          )}
        </div>

        {selected ? (
          <section id="snippet-panel" className="wb-pane" aria-labelledby="snippet-title">
            <div className="wb-pane-head">
              <h2 id="snippet-title">{selected.title} <span className="wb-muted">{languageLabel(selected.language)}</span></h2>
              <button type="button" className="wb-button" onClick={() => copy(selected.code)}>
                {copied ? <><CheckIcon />Copied</> : <><CopyIcon />Copy</>}
              </button>
            </div>
            <pre className="wb-code wb-code-lines"><code>{selected.code.split("\n").map((line, index) => <span key={index}>{line || " "}</span>)}</code></pre>
            <CopyBlocked show={blocked} what="the code" />
            <p className="wb-pane-meta">{selected.tags.map((tag) => `#${tag}`).join("  ")}</p>
          </section>
        ) : null}
      </div>

      <p className="wb-hint">Fifteen sample snippets, five per language; read the code before you reuse it.</p>
    </Workbench>
  );
}
