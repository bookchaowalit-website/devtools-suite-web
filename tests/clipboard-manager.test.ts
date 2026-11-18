import assert from "node:assert/strict";
import { describe as group, it as check, expect as want, test } from "vitest";
import { addSnippet, restoreSnippet, savedWhen, togglePin, deleteSnippet, searchSnippets, serializeSnippets, deserializeSnippets, type Snippet } from "@/lib/clipboard-manager/store";
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

// Items saved on the same day must be told apart: relative time, then date and time (UX review 2026-11-18).
group("savedWhen", () => {
  const now = new Date(2026, 10, 19, 15, 0).getTime();
  check("says how long ago, then the day and time", () => {
    want(savedWhen(now - 20_000, now)).toBe("just now");
    want(savedWhen(now - 60_000, now)).toBe("1 minute ago");
    want(savedWhen(now - 5 * 60_000, now)).toBe("5 minutes ago");
    want(savedWhen(now - 2 * 3_600_000, now)).toBe("2 hours ago");
    want(savedWhen(new Date(2026, 10, 18, 9, 30).getTime(), now)).toMatch(/^Yesterday /);
    want(savedWhen(new Date(2026, 9, 2, 9, 30).getTime(), now)).toMatch(/2.*,/);
  });
});

check("undo of a delete restores only that item and keeps later changes", () => {
  const a: Snippet = { id: "a", text: "a", createdAt: 1, pinned: false };
  const b: Snippet = { id: "b", text: "b", createdAt: 2, pinned: false };
  const c: Snippet = { id: "c", text: "c", createdAt: 3, pinned: true };
  // Deleted a, then saved c: undo brings a back and keeps c.
  want(restoreSnippet([c, b], a).map((item) => item.id).sort()).toEqual(["a", "b", "c"]);
  want(restoreSnippet([a, b], a)).toEqual([a, b]);
});
