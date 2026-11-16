"use client";

import Link from "next/link";
import { useState } from "react";
import { filterTools } from "@/lib/tools";

export type CatalogEntry = { slug: string; name: string; description: string; path: string };

/** The home page's tool grid with a search field. The full list renders on the server; the filter runs in the browser. */
export function ToolCatalog({ tools, initialQuery = "" }: { tools: readonly CatalogEntry[]; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const visible = filterTools(tools, query);
  const trimmed = query.trim();

  return (
    <>
      <div className="catalog-search" role="search">
        <label htmlFor="tool-search">Search tools</label>
        <input id="tool-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or task, e.g. JSON" autoComplete="off" spellCheck={false} aria-describedby="tool-search-count" />
        <p id="tool-search-count" className="catalog-count" role="status" aria-live="polite">
          {trimmed ? `${visible.length} of ${tools.length} tools` : `${tools.length} tools`}
        </p>
      </div>
      {visible.length ? (
        <ul className="catalog-grid" aria-label="Tools">
          {visible.map((tool) => (
            <li key={tool.slug}>
              <Link href={tool.path} className="catalog-card">
                <h2>{tool.name}</h2>
                <p>{tool.description}</p>
                <code>{tool.path}</code>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="catalog-empty">
          <p>No tool matches “{trimmed}”. Try another word, such as JSON, color or date.</p>
          <button type="button" className="catalog-clear" onClick={() => { setQuery(""); document.getElementById("tool-search")?.focus(); }}>Clear search</button>
        </div>
      )}
    </>
  );
}
