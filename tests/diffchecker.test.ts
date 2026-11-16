import assert from "node:assert/strict";
import { test } from "vitest";
import { lineDiff } from "@/lib/diffchecker/diff";

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
  assert.deepEqual(lineDiff("a\na\nb", "a\nb\nb").map(op => op.type), ["equal", "del", "equal", "add"]);
  assert.deepEqual(lineDiff("old", "new").map(op => op.type), ["del", "add"]);
  assert.deepEqual(lineDiff("", "new"), [{ type: "add", line: "new", left: null, right: 1 }]);
  assert.deepEqual(lineDiff("old", ""), [{ type: "del", line: "old", left: 1, right: null }]);
  assert.deepEqual(lineDiff("a\n", "a").map(op => op.type), ["equal", "del"]);
});
