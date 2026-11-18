"use client";

import Link from "next/link";
import { useState } from "react";
import { filterTools, TOOL_GROUPS, type ToolGroup } from "@/lib/tools";

export type CatalogEntry = { slug: string; name: string; description: string; keywords?: string; path: string; group?: ToolGroup };

/**
 * The home page's tool grid with a search field. The full list renders on the server; the filter runs in the browser.
 * Cards sit under job headings (Encode and convert, Text and code, …); a search shows only the sections with matches.
 */
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
        <div className="catalog-groups">
          {sections(visible).map((section) => (
            <section key={section.id} className="catalog-group" aria-labelledby={`group-${section.id}`}>
              <h2 id={`group-${section.id}`} className="catalog-group-title">{section.name} <span>{section.tools.length}</span></h2>
              <ul className="catalog-grid">
                {section.tools.map((tool) => (
                  <li key={tool.slug}>
                    <Link href={tool.path} className="catalog-card">
                      <h3>{tool.name}</h3>
                      <p>{tool.description}</p>
                      <code>{tool.path}</code>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="catalog-empty">
          <p>No tool matches “{trimmed}”. Try another word, such as JSON, color or date.</p>
          <button type="button" className="catalog-clear" onClick={() => { setQuery(""); document.getElementById("tool-search")?.focus(); }}>Clear search</button>
        </div>
      )}
    </>
  );
}

/** Visible tools split into the home page sections, in TOOL_GROUPS order; tools without a group go last. */
function sections(tools: readonly CatalogEntry[]) {
  const known = TOOL_GROUPS.map((group) => ({ id: group.id as string, name: group.name as string, tools: tools.filter((tool) => tool.group === group.id) }));
  const other = tools.filter((tool) => !tool.group || !TOOL_GROUPS.some((group) => group.id === tool.group));
  return [...known, { id: "other", name: "More tools", tools: other }].filter((section) => section.tools.length);
}
