import assert from "node:assert/strict";
import { test } from "vitest";
import { runRegex, segments } from "@/lib/regex/run";

test("global flag lists every match with index and groups", () => {
  const { matches, error } = runRegex(String.raw`(\w)(\w*)`, "g", "ab cd");
  assert.equal(error, "");
  assert.deepEqual(matches, [
    { value: "ab", index: 0, groups: ["a", "b"], ranges: [[0, 1], [1, 2]] },
    { value: "cd", index: 3, groups: ["c", "d"], ranges: [[3, 4], [4, 5]] },
  ]);
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
    { text: "a", match: false }, { text: "12", match: true, index: 0 }, { text: "b", match: false }, { text: "3", match: true, index: 1 },
  ]);
});

test("toLiteral escapes slashes and line breaks so the copied literal is valid JavaScript", async () => {
  const { toLiteral } = await import("@/lib/regex/run");
  assert.equal(toLiteral("a/b", "g"), String.raw`/a\/b/g`);
  assert.equal(toLiteral(String.raw`\b\w+\b`, "gi"), String.raw`/\b\w+\b/gi`);
  const literal = toLiteral("x\ny/z", "");
  assert.equal(new Function(`return ${literal}`)().source, new RegExp("x\ny/z").source);
});

test("capture groups get their own pieces for colouring, nested groups keep the outer one", async () => {
  const { matchPieces } = await import("@/lib/regex/run");
  const { matches } = runRegex(String.raw`(\d{4})-((\d{2}))`, "g", "on 2026-11 ok");
  assert.deepEqual(matchPieces(matches[0]), [{ text: "2026", group: 1 }, { text: "-", group: null }, { text: "11", group: 2 }]);
});

test("group names come from (?<name>) and replace supports $1 and $<name>", async () => {
  const { groupNames, replaceAll } = await import("@/lib/regex/run");
  assert.deepEqual(groupNames(String.raw`(?<year>\d+)-(\d+)(?:x)[(]`), ["year", undefined]);
  assert.equal(runRegex(String.raw`(?<y>\d+)`, "g", "1").names?.[0], "y");
  assert.deepEqual(replaceAll(String.raw`(?<y>\d{4})-(\d{2})`, "g", "2026-11", "$2/$<y>"), { value: "11/2026", error: "", truncated: false });
  assert.match(replaceAll("(", "g", "x", "y").error, /Invalid regular expression|Unterminated group/);
});

// Codex review, 2026-11-19 (second round).
test("Unicode and lookbehind do not shift group names", async () => {
  const { groupNames } = await import("@/lib/regex/run");
  assert.deepEqual(groupNames("(?<é>a)(?<ascii>b)"), ["é", "ascii"]);
  assert.deepEqual(groupNames("(?<=x)(?<!y)(?<n>z)"), ["n"]);
  const result = runRegex("(?<é>a)(?<ascii>b)", "g", "ab");
  assert.deepEqual(result.names, ["é", "ascii"]);
  assert.deepEqual(result.matches[0].groups, ["a", "b"]);
});

test("replace expands templates exactly like String#replace", async () => {
  const { replaceAll } = await import("@/lib/regex/run");
  const cases: [string, string, string, string][] = [
    [String.raw`\d`, "g", "a1b2", ""],
    [String.raw`(\w)(\w)`, "g", "abcd", "$2$1"],
    ["b", "", "abc", "[$`|$&|$']"],
    ["(a)", "g", "aa", "$$1 $12 $0 $9"],
    ["(?<x>a)", "g", "ab", "<$<x>|$<nope>>"],
    ["", "g", "ab", "-"],
  ];
  for (const [pattern, flags, text, template] of cases) {
    assert.equal(replaceAll(pattern, flags, text, template).value, text.replace(new RegExp(pattern, flags), template), `${pattern} ${template}`);
  }
});

test("replace stops at the match and size caps", async () => {
  const { MAX_MATCHES, MAX_REPLACE_OUTPUT, replaceAll } = await import("@/lib/regex/run");
  const many = replaceAll("a", "g", "a".repeat(MAX_MATCHES + 50), "b");
  assert.equal(many.truncated, true);
  assert.equal(many.value.startsWith("b".repeat(MAX_MATCHES)), true);
  const big = replaceAll("a", "g", "a".repeat(500), "x".repeat(1000));
  assert.equal(big.truncated, true);
  assert.equal(big.value.length <= MAX_REPLACE_OUTPUT, true);
});

test("the size cap applies while a template expands ($` and $' of a long text)", async () => {
  const { expandReplacement, MAX_REPLACE_OUTPUT, replaceAll } = await import("@/lib/regex/run");
  const text = "x".repeat(150_000) + "a" + "y".repeat(150_000);
  const piece = expandReplacement("$`$'$`", "a", [], 150_000, text, undefined, 1000);
  assert.equal(piece.complete, false);
  assert.equal(piece.value.length, 1000);
  const result = replaceAll("a", "g", text, "$`$'");
  assert.equal(result.truncated, true);
  assert.equal(result.value.length <= MAX_REPLACE_OUTPUT, true);
  assert.equal(expandReplacement("[$&]", "a", [], 0, "a").value, "[a]");
});
