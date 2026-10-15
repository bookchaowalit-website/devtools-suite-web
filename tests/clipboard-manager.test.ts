import assert from "node:assert/strict";
import { test } from "node:test";
import { addSnippet, togglePin, deleteSnippet, searchSnippets, serializeSnippets, deserializeSnippets, type Snippet } from "../lib/clipboard-manager/store.ts";
const old: Snippet = { id: "old", text: "old text", createdAt: 1, pinned: false };
test("add trims text, prepends records, and ignores blank drafts", () => {
  const items = [old];
  assert.deepEqual(addSnippet(items, "  new text  ", "new", 2), [{ id: "new", text: "new text", createdAt: 2, pinned: false }, old]);
  assert.deepEqual(addSnippet(items, "  ", "new", 2), items);
  assert.deepEqual(items, [old]);
});
test("pin toggles only the requested record and delete removes it immutably", () => {
  const items = addSnippet([old], "new", "new", 2);
  const pinned = togglePin(items, "old");
  assert.equal(pinned.find(item => item.id === "old")?.pinned, true);
  assert.equal(togglePin(pinned, "old")[1].pinned, false);
  assert.deepEqual(deleteSnippet(items, "new"), [old]);
  assert.equal(items.length, 2);
  assert.equal(old.pinned, false);
});
test("search is case insensitive and sorts pins before most recent items", () => {
  const items = [old, { id: "new", text: "TEXT new", createdAt: 3, pinned: false }, { id: "pin", text: "text pin", createdAt: 2, pinned: true }];
  assert.deepEqual(searchSnippets(items, "tExT").map(item => item.id), ["pin", "new", "old"]);
  assert.deepEqual(searchSnippets(items, "missing"), []);
  assert.deepEqual(items.map(item => item.id), ["old", "new", "pin"]);
});
test("stored JSON serialization round trips through the codec", () => {
  const items = togglePin(addSnippet([old], "สวัสดี 🚀", "new", 2), "new");
  const storage = new Map<string, string>();
  storage.set("items", serializeSnippets(items));
  assert.deepEqual(deserializeSnippets(storage.get("items") ?? null), items);
  assert.deepEqual(deserializeSnippets(null), []);
  assert.deepEqual(deserializeSnippets("null"), []);
  assert.throws(() => deserializeSnippets("broken"), SyntaxError);
});
test("discarding malformed saved records keeps valid records renderable", () => {
  const stored = JSON.stringify([old, null, { text: "missing metadata" }, { ...old, id: 5 }, { ...old, createdAt: "bad" }, { ...old, pinned: "yes" }]);
  assert.deepEqual(deserializeSnippets(stored), [old]);
});
