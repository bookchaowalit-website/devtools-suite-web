"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { addSnippet, togglePin, deleteSnippet, searchSnippets, serializeSnippets, deserializeSnippets, type Snippet } from "@/lib/clipboard-manager/store";
const KEY = "devtools-suite:clipboard-manager:items-v2";

async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

export default function Home() {
  const [items, setItems] = useState<Snippet[]>([]);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ARCHIVE READY / LOCAL ONLY");
  const [copied, setCopied] = useState<string | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setItems(deserializeSnippets(localStorage.getItem(KEY)));
      } catch { try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ } }
      hydrated.current = true;
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { if (hydrated.current) { try { localStorage.setItem(KEY, serializeSnippets(items)); } catch { /* storage unavailable or full */ } } }, [items]);

  const filtered = useMemo(() => searchSnippets(items, query), [items, query]);
  const pinned = items.filter((item) => item.pinned).length;

  const save = () => {
    if (!draft.trim()) { setStatus("HOLD / WRITE A SNIPPET FIRST"); return; }
    setItems((current) => addSnippet(current, draft, crypto.randomUUID(), Date.now()));
    setDraft(""); setStatus("FILED / SNIPPET IN ARCHIVE");
  };

  const readClipboard = async () => {
    try { setDraft(await navigator.clipboard.readText()); setStatus("LOADED / READY TO FILE"); }
    catch { setStatus("CLIPBOARD CLOSED / PASTE MANUALLY"); }
  };

  const copy = async (item: Snippet) => {
    const ok = await copyText(item.text);
    setStatus(ok ? "COPIED / READY TO DELIVER" : "COPY BLOCKED / SELECT THE TEXT");
    if (ok) { setCopied(item.id); window.setTimeout(() => setCopied(null), 1400); }
  };

  return (
    <main className="archive-page">
      <div className="archive-shell">
        <header className="archive-header">
          <div className="archive-brand"><span>LOCAL DISPATCH</span><strong>CLIP / BOARD</strong></div>
          <p aria-live="polite">{status}</p>
          <div className="archive-count"><b>{items.length.toString().padStart(2, "0")}</b><span>FILES / {pinned} PINNED</span></div>
        </header>

        <section className="archive-intro" aria-labelledby="page-title">
          <h1 id="page-title">Keep the useful line.</h1>
          <p>A private browser archive for text you reuse. Save it once, find it again, and send it on its way.</p>
        </section>

        <section className="archive-layout" aria-label="Snippet archive">
          <div className="archive-composer">
            <div className="archive-section-head"><span>DROP SLOT / NEW FILE</span><span>01</span></div>
            <label className="archive-label">Snippet<textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Paste or type a useful line…" aria-label="New snippet" /></label>
            <div className="archive-actions"><button type="button" className="archive-primary" onClick={save}>File snippet</button><button type="button" className="archive-secondary" onClick={readClipboard}>Read clipboard</button><button type="button" className="archive-quiet" onClick={() => { setDraft(""); setStatus("DROP SLOT CLEARED"); }}>Clear</button></div>
            <p className="archive-hint">Browser security prevents passive clipboard listening. Nothing is synced.</p>
          </div>

          <div className="archive-list">
            <div className="archive-section-head"><span>ARCHIVE / SEARCHABLE</span><span>02</span></div>
            <label className="archive-search">Find in archive<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search saved text" aria-label="Search snippets" /></label>
            {filtered.length === 0 ? <p className="archive-empty">No filed snippets match this search.</p> : <ul>{filtered.map((item, index) => <li key={item.id} className={item.pinned ? "snippet is-pinned" : "snippet"}>
              <div className="snippet-meta"><span>{String(index + 1).padStart(2, "0")}</span><time dateTime={new Date(item.createdAt).toISOString()}>{new Date(item.createdAt).toLocaleDateString()}</time>{item.pinned ? <b>PINNED</b> : null}</div>
              <pre>{item.text}</pre>
              <div className="snippet-actions"><button type="button" onClick={() => void copy(item)}>{copied === item.id ? "Copied" : "Copy"}</button><button type="button" onClick={() => setItems((current) => togglePin(current, item.id))}>{item.pinned ? "Unpin" : "Pin"}</button><button type="button" onClick={() => setItems((current) => deleteSnippet(current, item.id))}>Delete</button></div>
            </li>)}</ul>}
          </div>
        </section>
        <footer className="archive-footer">LOCAL STORAGE / BROWSER ONLY / BOOKCHAOWALIT DEVELOPER TOOLS</footer>
      </div>
    </main>
  );
}
