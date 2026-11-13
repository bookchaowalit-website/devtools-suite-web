"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckIcon, CopyIcon, ToolIntro, useCopy, Workbench } from "@/components/workbench";
import { addSnippet, deleteSnippet, searchSnippets, togglePin, type Snippet } from "@/lib/clipboard-manager/store";
import { readSnippets, writeSnippets } from "@/lib/clipboard-manager/storage";

const KEY = "devtools-suite:clipboard-manager:items-v2";

export default function ClipboardManagerTool() {
  const [items, setItems] = useState<Snippet[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const hydrated = useRef(false);
  const copiedText = items.find((item) => item.id === copiedId)?.text ?? "";
  const { copied, copy } = useCopy(copiedText, (ok) => setAnnouncement(ok ? "Copied to the clipboard." : "Copy was blocked. Select the text and copy it by hand."));

  // Saved items live in this browser's localStorage; read them after hydration.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { setItems(readSnippets(localStorage, KEY)); } catch { try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ } }
      hydrated.current = true;
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { if (hydrated.current) { try { writeSnippets(localStorage, KEY, items); } catch { /* storage unavailable */ } } }, [items]);

  const filtered = useMemo(() => searchSnippets(items, query), [items, query]);

  const save = () => {
    if (!draft.trim()) return;
    setItems((current) => addSnippet(current, draft, crypto.randomUUID(), Date.now()));
    setDraft("");
    setAnnouncement("Saved.");
  };
  const paste = async () => {
    try { setDraft(await navigator.clipboard.readText()); setAnnouncement("Pasted from the clipboard. Press Save to keep it."); }
    catch { setAnnouncement("The browser blocked clipboard access. Paste into the box with the keyboard instead."); }
  };
  const remove = (item: Snippet) => { setItems((current) => deleteSnippet(current, item.id)); setAnnouncement("Deleted."); };

  return (
    <Workbench>
      <ToolIntro title="Clipboard Manager" summary="Save text you paste often, then find and copy it again in one tap." privacy="Saved only in this browser (localStorage). Nothing is uploaded or synced." />

      <section className="wb-pane" aria-labelledby="new-label">
        <div className="wb-pane-head">
          <label id="new-label" htmlFor="clip-draft">New item</label>
          <div className="wb-pane-tools">
            <button type="button" className="wb-button-plain" onClick={() => void paste()}>Paste</button>
            <button type="button" className="wb-button" onClick={save} disabled={!draft.trim()}>Save</button>
          </div>
        </div>
        <textarea id="clip-draft" className="wb-textarea-short" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Type or paste text to keep" spellCheck={false} />
      </section>
      <p className="wb-sr" role="status" aria-live="polite">{announcement}</p>

      <section className="wb-card wb-panes-gap" aria-labelledby="saved-title">
        <div className="wb-card-head">
          <h2 id="saved-title">Saved <span className="wb-muted">{items.length}</span></h2>
          <label className="wb-search">
            <span className="wb-sr">Search saved items</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" />
          </label>
        </div>
        {!loaded ? (
          <p className="wb-note">Loading saved items…</p>
        ) : items.length === 0 ? (
          <p className="wb-note">Nothing saved yet. Paste something above and press Save.</p>
        ) : filtered.length === 0 ? (
          <p className="wb-note">No saved item matches “{query}”.</p>
        ) : (
          <ul className="wb-items">
            {filtered.map((item) => (
              <li key={item.id} data-pinned={item.pinned ? "true" : undefined}>
                <pre>{item.text}</pre>
                <div className="wb-item-bar">
                  <span className="wb-muted">{item.pinned ? "Pinned · " : ""}{new Date(item.createdAt).toLocaleDateString()}</span>
                  <div className="wb-pane-tools">
                    <button type="button" className="wb-button-plain" aria-pressed={item.pinned} onClick={() => setItems((current) => togglePin(current, item.id))}>{item.pinned ? "Unpin" : "Pin"}</button>
                    <button type="button" className="wb-button-plain wb-danger" onClick={() => remove(item)}>Delete</button>
                    <button type="button" className="wb-button-plain" onClick={() => { setCopiedId(item.id); void copy(item.text); }}>
                      {copied && copiedId === item.id ? <><CheckIcon />Copied</> : <><CopyIcon />Copy</>}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="wb-hint">Browsers do not let a page watch your clipboard, so items are only saved when you press Save. Clearing site data removes them.</p>
    </Workbench>
  );
}
