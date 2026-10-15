import assert from "node:assert/strict";
import { test } from "node:test";
import { readSnippets, writeSnippets } from "../lib/clipboard-manager/storage.ts";
import { addSnippet, togglePin, type Snippet } from "../lib/clipboard-manager/store.ts";

function storageStub() {
  const values: Record<string, string> = Object.create(null);
  return {
    getItem(key: string) { return values[key] ?? null; },
    setItem(key: string, value: string) { values[key] = value; },
    removeItem(key: string) { delete values[key]; },
  };
}
const key = "devtools-suite:clipboard-manager:items-v2";
const saved: Snippet[] = [{ id: "saved", text: "Existing 🚀", createdAt: 1, pinned: true }];

test("hydrates saved snippets through getItem using the actual storage key", () => {
  const storage = storageStub();
  storage.setItem(key, JSON.stringify(saved));
  assert.deepEqual(readSnippets(storage, key), saved);
  assert.deepEqual(readSnippets(storage, "missing"), []);
  assert.equal(storage.getItem(key), JSON.stringify(saved));
});

test("writes updates through setItem and restores them during fresh hydration", () => {
  const storage = storageStub();
  const updated = togglePin(addSnippet(readSnippets(storage, key), "สวัสดี", "new", 2), "new");
  assert.equal(writeSnippets(storage, key, updated), true);
  assert.equal(storage.getItem(key), JSON.stringify(updated));
  const hydrated = readSnippets(storage, key);
  assert.deepEqual(hydrated, updated);
  assert.notEqual(hydrated, updated);
  assert.equal(writeSnippets(storage, key, []), true);
  assert.deepEqual(readSnippets(storage, key), []);
});

test("recovers from corrupt stored JSON and removes the unusable value", () => {
  const storage = storageStub();
  storage.setItem(key, "broken");
  assert.deepEqual(readSnippets(storage, key), []);
  assert.equal(storage.getItem(key), null);
});

test("unavailable storage and failed corrupt-value cleanup keep an empty archive usable", () => {
  const blocked = {
    getItem() { throw new Error("Storage denied"); },
    removeItem() { throw new Error("Storage denied"); },
  };
  assert.deepEqual(readSnippets(blocked, key), []);
  const corrupt = {
    getItem() { return "broken"; },
    removeItem() { throw new Error("Storage denied"); },
  };
  assert.deepEqual(readSnippets(corrupt, key), []);
});

test("quota failures leave stored and in-memory snippets intact", () => {
  const storage = storageStub();
  storage.setItem(key, JSON.stringify(saved));
  const updated = addSnippet(saved, "New", "new", 2);
  const before = structuredClone(updated);
  const full = { setItem() { throw new Error("Quota exceeded"); } };
  assert.equal(writeSnippets(full, key, updated), false);
  assert.equal(storage.getItem(key), JSON.stringify(saved));
  assert.deepEqual(updated, before);
});
