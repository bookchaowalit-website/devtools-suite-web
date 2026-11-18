import assert from "node:assert/strict";
import { test } from "vitest";
import { diffLines, lineDiff, MAX_DIFF_CELLS, pairChanges, unifiedDiff, wordDiff } from "@/lib/diffchecker/diff";

test("identical and empty texts retain their shared lines", () => {
  assert.deepEqual(lineDiff("a\nb", "a\nb"), [
    { type: "equal", line: "a", left: 1, right: 1 },
    { type: "equal", line: "b", left: 2, right: 2 },
  ]);
  assert.deepEqual(lineDiff("", ""), []);
});
test("insertions and deletions keep each side's original line numbers", () => {
  assert.deepEqual(lineDiff("a\nc", "a\nb\nc"), [
    { type: "equal", line: "a", left: 1, right: 1 },
    { type: "add", line: "b", left: null, right: 2 },
    { type: "equal", line: "c", left: 2, right: 3 },
  ]);
  assert.deepEqual(lineDiff("a\nb", "a"), [
    { type: "equal", line: "a", left: 1, right: 1 },
    { type: "del", line: "b", left: 2, right: null },
  ]);
});
test("replacements and repeated lines follow the longest common subsequence", () => {
  // Shared first and last lines are matched before the LCS, so the change sits in the middle (equally short diff).
  assert.deepEqual(lineDiff("a\na\nb", "a\nb\nb").map(op => op.type), ["equal", "del", "add", "equal"]);
  assert.deepEqual(lineDiff("old", "new").map(op => op.type), ["del", "add"]);
  assert.deepEqual(lineDiff("", "new"), [{ type: "add", line: "new", left: null, right: 1 }]);
  assert.deepEqual(lineDiff("old", ""), [{ type: "del", line: "old", left: 1, right: null }]);
  assert.deepEqual(lineDiff("a\n", "a").map(op => op.type), ["equal", "del"]);
});

test("large texts never build a table past the cap: shared ends are matched, the middle is approximate", () => {
  const side = Array.from({ length: 2500 }, (_, i) => `line ${i}`);
  const big = diffLines(side.join("\n"), side.map((line) => `${line}!`).join("\n"));
  assert.ok(2501 * 2501 > MAX_DIFF_CELLS);
  assert.equal(big.approximate, true);
  assert.equal(big.ops.length, 5000);
  const shared = Array.from({ length: 5000 }, (_, i) => `same ${i}`).join("\n");
  const small = diffLines(`${shared}\nold\n${shared}`, `${shared}\nnew\n${shared}`);
  assert.equal(small.approximate, false);
  assert.deepEqual(small.ops.filter((op) => op.type !== "equal").map((op) => op.line), ["old", "new"]);
});

test("word diff marks only the words that changed, and changes pair up removed with added lines", () => {
  const { before, after } = wordDiff("This is the first text.", "This is the second text.");
  assert.deepEqual(before.filter((part) => part.changed).map((part) => part.text), ["first"]);
  assert.deepEqual(after.filter((part) => part.changed).map((part) => part.text), ["second"]);
  const ops = lineDiff("a\nb\nc", "a\nB\nc");
  assert.deepEqual([...pairChanges(ops).entries()], [[1, 2], [2, 1]]);
});

test("unified diff has headers, one hunk and +/- / space prefixes", () => {
  assert.equal(unifiedDiff(lineDiff("a\nb", "a\nc")), "--- original\n+++ changed\n@@ -1,2 +1,2 @@\n a\n-b\n+c");
  assert.equal(unifiedDiff(lineDiff("", "x")), "--- original\n+++ changed\n@@ -0,0 +1,1 @@\n+x");
});
