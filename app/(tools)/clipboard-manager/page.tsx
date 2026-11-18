"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertIcon, CheckIcon, CopyBlocked, CopyIcon, ToolIntro, UndoToast, useCopy, useUndo, Workbench } from "@/components/workbench";
import { addSnippet, deleteSnippet, restoreSnippet, savedWhen, searchSnippets, togglePin, type Snippet } from "@/lib/clipboard-manager/store";
import { readSnippets, writeSnippets } from "@/lib/clipboard-manager/storage";

const KEY = "devtools-suite:clipboard-manager:items-v2";

export default function ClipboardManagerTool() {
  const [items, setItems] = useState<Snippet[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [pasteBlocked, setPasteBlocked] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const undo = useUndo();
  const hydrated = useRef(false);
  const copiedText = items.find((item) => item.id === copiedId)?.text ?? "";
  const { copied, blocked, copy } = useCopy(copiedText, (ok) => setAnnouncement(ok ? "Copied to the clipboard." : "Copy was blocked. Select the text and copy it by hand."));

  // Saved items live in this browser's localStorage; read them after hydration.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { setItems(readSnippets(localStorage, KEY)); } catch { try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ } }
      hydrated.current = true;
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  // "2 hours ago" stays true while the page is open.
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30_000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { if (hydrated.current) { try { writeSnippets(localStorage, KEY, items); } catch { /* storage unavailable */ } } }, [items]);

  const filtered = useMemo(() => searchSnippets(items, query), [items, query]);

  const save = () => {
    if (!draft.trim()) return;
    setItems((current) => addSnippet(current, draft, crypto.randomUUID(), Date.now()));
    setDraft("");
    setAnnouncement("Saved.");
  };
  const paste = async () => {
    try { setDraft(await navigator.clipboard.readText()); setPasteBlocked(false); setAnnouncement("Pasted from the clipboard. Press Save to keep it."); }
    catch { setPasteBlocked(true); setAnnouncement("The browser blocked clipboard access. Paste into the box with the keyboard instead."); }
  };
  // Delete is immediate but can be undone for a few seconds from the toast.
  // Undo puts back only the deleted item, into the list as it is now (items saved or pinned since are kept).
  const remove = (item: Snippet) => {
    setItems((current) => deleteSnippet(current, item.id));
    undo.offer("Item deleted.", () => setItems((current) => restoreSnippet(current, item)));
  };

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
        <textarea id="clip-draft" className="wb-textarea-short" value={draft} onChange={(event) => { setDraft(event.target.value); setPasteBlocked(false); }} placeholder="Type or paste text to keep" spellCheck={false} />
        {pasteBlocked ? <p className="wb-note wb-note-alert" aria-hidden="true"><AlertIcon />The browser blocked clipboard access. Click the box and press Ctrl+V (⌘V on a Mac) instead.</p> : null}
      </section>
      <p className="wb-sr" role="status" aria-live="polite">{announcement}</p>

      <section className="wb-card wb-panes-gap" aria-labelledby="saved-title">
        <div className="wb-card-head">
          <h2 id="saved-title">Saved <span className="wb-muted">{items.length}</span></h2>
          {/* Search only helps once there is something to search through; it stays while a query is set, so it can be cleared. */}
          {items.length >= 2 || query ? (
            <label className="wb-search wb-search-labelled">Search saved items
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Words in the text" />
            </label>
          ) : null}
        </div>
        {!loaded ? (
          <p className="wb-note">Loading saved items…</p>
        ) : items.length === 0 ? (
          <p className="wb-note">Nothing saved yet. Paste something above and press Save.</p>
        ) : filtered.length === 0 ? (
          <div className="wb-empty-actions">
            <p className="wb-note">No saved item matches “{query}”.</p>
            <button type="button" className="wb-button-plain" onClick={() => setQuery("")}>Clear search</button>
          </div>
        ) : (
          <ul className="wb-items">
            {filtered.map((item) => (
              <li key={item.id} data-pinned={item.pinned ? "true" : undefined}>
                <pre>{item.text}</pre>
                <div className="wb-item-bar">
                  <span className="wb-muted">{item.pinned ? "Pinned · " : ""}<time dateTime={new Date(item.createdAt).toISOString()} title={new Date(item.createdAt).toLocaleString()}>{savedWhen(item.createdAt, now)}</time></span>
                  {/* Copy first, Delete last and set apart, so a slip of the thumb on Copy never deletes. */}
                  <div className="wb-pane-tools wb-item-tools">
                    <button type="button" className="wb-button-plain" onClick={() => { setCopiedId(item.id); void copy(item.text); }}>
                      {copied && copiedId === item.id ? <><CheckIcon />Copied</> : <><CopyIcon />Copy</>}
                    </button>
                    <button type="button" className="wb-button-plain" aria-pressed={item.pinned} onClick={() => setItems((current) => togglePin(current, item.id))}>{item.pinned ? "Unpin" : "Pin"}</button>
                    <button type="button" className="wb-button-plain wb-danger wb-item-delete" onClick={() => remove(item)}>Delete</button>
                  </div>
                </div>
                <CopyBlocked show={blocked && copiedId === item.id} what="the text above" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <UndoToast state={undo} />

      <p className="wb-hint">Browsers do not let a page watch your clipboard, so items are only saved when you press Save. Clearing site data removes them.</p>
    </Workbench>
  );
}
