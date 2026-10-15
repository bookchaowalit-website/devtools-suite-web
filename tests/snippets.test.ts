import assert from "node:assert/strict";
import { test } from "node:test";
import { SNIPPETS, filterSnippets } from "../lib/snippets/catalog.ts";

test("searches title, language, category and tags case insensitively", () => {
  for (const [query, id] of [["HOOK", "1"], ["javascript", "1"], ["Decorator", "2"], ["result", "3"], ["types", "3"]]) {
    assert.deepEqual(filterSnippets(SNIPPETS, query, "All").map(snippet => snippet.id), [id]);
  }
});
test("combines category and text filters including empty results", () => {
  assert.deepEqual(filterSnippets(SNIPPETS, "", "Python").map(snippet => snippet.id), ["2"]);
  assert.deepEqual(filterSnippets(SNIPPETS, "hook", "Python"), []);
  assert.deepEqual(filterSnippets(SNIPPETS, "missing", "All"), []);
  assert.deepEqual(filterSnippets([], "", "All"), []);
});
test("empty search preserves catalog order without mutating the source", () => {
  const before = structuredClone(SNIPPETS);
  assert.deepEqual(filterSnippets(SNIPPETS, "", "All"), SNIPPETS);
  assert.deepEqual(SNIPPETS, before);
});
