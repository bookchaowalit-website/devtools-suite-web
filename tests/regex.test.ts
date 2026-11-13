import assert from "node:assert/strict";
import { test } from "vitest";
import { runRegex, segments } from "@/lib/regex/run";

test("global flag lists every match with index and groups", () => {
  const { matches, error } = runRegex(String.raw`(\w)(\w*)`, "g", "ab cd");
  assert.equal(error, "");
  assert.deepEqual(matches, [{ value: "ab", index: 0, groups: ["a", "b"] }, { value: "cd", index: 3, groups: ["c", "d"] }]);
});

test("without g only the first match is returned", () => {
  assert.equal(runRegex(String.raw`\d`, "", "a1b2").matches.length, 1);
});

test("empty matches do not loop forever, including across astral characters with u", () => {
  assert.equal(runRegex("", "g", "abc").matches.length, 4);
  assert.equal(runRegex("", "gu", "😀a").matches.length, 3);
});

test("an invalid pattern reports the engine's error", () => {
  const result = runRegex("(", "g", "x");
  assert.equal(result.matches.length, 0);
  assert.match(result.error, /Invalid regular expression|Unterminated group/);
});

test("segments mark matched text and skip empty matches", () => {
  const { matches } = runRegex(String.raw`\d+`, "g", "a12b3");
  assert.deepEqual(segments("a12b3", matches), [
    { text: "a", match: false }, { text: "12", match: true }, { text: "b", match: false }, { text: "3", match: true },
  ]);
});

test("toLiteral escapes slashes and line breaks so the copied literal is valid JavaScript", async () => {
  const { toLiteral } = await import("@/lib/regex/run");
  assert.equal(toLiteral("a/b", "g"), String.raw`/a\/b/g`);
  assert.equal(toLiteral(String.raw`\b\w+\b`, "gi"), String.raw`/\b\w+\b/gi`);
  const literal = toLiteral("x\ny/z", "");
  assert.equal(new Function(`return ${literal}`)().source, new RegExp("x\ny/z").source);
});
