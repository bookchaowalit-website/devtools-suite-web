import assert from "node:assert/strict";
import { test } from "vitest";
import { SNIPPETS, filterSnippets } from "@/lib/snippets/catalog";

test("searches title, language, category and tags case insensitively", () => {
  for (const [query, id] of [["JSX", "1"], ["Decorator", "2"], ["Typed Result", "3"], ["exhaustive", "12"], ["backoff", "8"]]) {
    assert.deepEqual(filterSnippets(SNIPPETS, query, "All").map(snippet => snippet.id), [id]);
  }
});
test("combines category and text filters including empty results", () => {
  assert.deepEqual(filterSnippets(SNIPPETS, "", "Python").map(snippet => snippet.id), ["2", "8", "9", "10", "11"]);
  assert.deepEqual(filterSnippets(SNIPPETS, "hook", "Python"), []);
  assert.deepEqual(filterSnippets(SNIPPETS, "hook", "React").length, 5);
  assert.deepEqual(filterSnippets(SNIPPETS, "missing", "All"), []);
  assert.deepEqual(filterSnippets([], "", "All"), []);
});
test("empty search preserves catalog order without mutating the source", () => {
  const before = structuredClone(SNIPPETS);
  assert.deepEqual(filterSnippets(SNIPPETS, "", "All"), SNIPPETS);
  assert.deepEqual(SNIPPETS, before);
});

test("each category has at least five snippets and every language has a title-case label", async () => {
  const { languageLabel } = await import("@/lib/snippets/catalog");
  for (const category of ["React", "Python", "TypeScript"]) {
    assert.ok(SNIPPETS.filter((snippet) => snippet.category === category).length >= 5, category);
  }
  assert.equal(new Set(SNIPPETS.map((snippet) => snippet.id)).size, SNIPPETS.length);
  for (const snippet of SNIPPETS) assert.match(languageLabel(snippet.language), /^[A-Z]/, snippet.id);
  assert.equal(languageLabel("jsx"), "React · JSX");
});

// Codex review, 2026-11-19 (post-push round): the sample code itself must be safe to reuse.
test("groupBy works for keys such as constructor, and useLocalStorage never writes one key's value into another", async () => {
  const groupBy = SNIPPETS.find((snippet) => snippet.title === "groupBy");
  assert.ok(groupBy);
  const js = groupBy.code.replace(/export /, "").replace(/<T, K extends PropertyKey>|: readonly T\[\]|: \(item: T\) => K|: Map<K, T\[\]>|<K, T\[\]>/g, "");
  const run = new Function(`${js}; return groupBy;`)() as (items: string[], key: (item: string) => string) => Map<string, string[]>;
  assert.deepEqual([...run(["a", "b"], (item) => (item === "a" ? "constructor" : "toString")).entries()], [["constructor", ["a"]], ["toString", ["b"]]]);
  const storage = SNIPPETS.find((snippet) => snippet.title === "useLocalStorage");
  assert.match(storage?.code ?? "", /if \(state\.key !== key\) return;/);
});
