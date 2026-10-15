import { deserializeSnippets, serializeSnippets, type Snippet } from "./store.ts";

export type SnippetStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

/** Load browser storage, recovering from unavailable storage or invalid JSON. */
export function readSnippets(storage: Pick<SnippetStorage, "getItem" | "removeItem">, key: string): Snippet[] {
  try {
    return deserializeSnippets(storage.getItem(key));
  } catch {
    try { storage.removeItem(key); } catch { /* Storage can also deny cleanup. */ }
    return [];
  }
}

/** Persist the archive without interrupting in-memory work when storage is full. */
export function writeSnippets(storage: Pick<SnippetStorage, "setItem">, key: string, items: Snippet[]): boolean {
  try {
    storage.setItem(key, serializeSnippets(items));
    return true;
  } catch {
    return false;
  }
}
