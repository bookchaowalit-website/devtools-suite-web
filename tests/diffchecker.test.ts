import assert from "node:assert/strict";
import { test } from "node:test";
import { lineDiff } from "../lib/diffchecker/diff.ts";

test("identical and empty texts retain their shared lines", () => {
  assert.deepEqual(lineDiff("a\nb", "a\nb"), [
    { type: "equal", line: "a", left: 1, right: 1 },
    { type: "equal", line: "b", left: 2, right: 2 },
  ]);
  assert.deepEqual(lineDiff("", ""), [{ type: "equal", line: "", left: 1, right: 1 }]);
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
  assert.deepEqual(lineDiff("", "new").map(op => op.type), ["del", "add"]);
  assert.deepEqual(lineDiff("old", "").map(op => op.type), ["del", "add"]);
});
