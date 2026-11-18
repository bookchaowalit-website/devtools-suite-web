import assert from "node:assert/strict";
import { test } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { diffLines, lineDiff, MAX_DIFF_CELLS, pairChanges, unifiedDiff, wordDiff, wordDiffs } from "@/lib/diffchecker/diff";

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

test("unified diff has headers, one hunk, +/- / space prefixes and a newline after every line", () => {
  assert.equal(unifiedDiff("a\nb\n", "a\nc\n"), "--- original\n+++ changed\n@@ -1,2 +1,2 @@\n a\n-b\n+c\n");
  assert.equal(unifiedDiff("", "x\n"), "--- original\n+++ changed\n@@ -0,0 +1,1 @@\n+x\n");
  assert.equal(unifiedDiff("a", "b"), "--- original\n+++ changed\n@@ -1,1 +1,1 @@\n-a\n\\ No newline at end of file\n+b\n\\ No newline at end of file\n");
  assert.equal(unifiedDiff("a\n", "a"), "--- original\n+++ changed\n@@ -1,1 +1,1 @@\n-a\n+a\n\\ No newline at end of file\n");
});

// Codex review, 2026-11-19 (post-push round): the copied patch must apply.
test("git apply accepts the copied diff and it reproduces the changed text", () => {
  const dir = mkdtempSync(join(tmpdir(), "diffcheck-"));
  const cases: [string, string][] = [["a\n", "b\n"], ["a\nb\nc\n", "a\nB\nc\nd\n"], ["x\ny", "x\nz"], ["same\n", "same"], ["one", "one\n"], ["", "new\n"],
    ["\n", "x\n"], ["same", "same\nextra\n"], ["a\n\nb\n", "a\nb\n"], ["x\n", ""], ["\n\n", "\n"], ["a\nb", "a\nb\nc"]];
  try {
    execFileSync("git", ["init", "-q"], { cwd: dir });
    for (const [left, right] of cases) {
      writeFileSync(join(dir, "f.txt"), left);
      writeFileSync(join(dir, "p.diff"), unifiedDiff(left, right, { from: "a/f.txt", to: "b/f.txt" }));
      execFileSync("git", ["apply", "p.diff"], { cwd: dir });
      assert.equal(readFileSync(join(dir, "f.txt"), "utf8"), right, JSON.stringify([left, right]));
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("word diffs stop at a total budget and are skipped for an approximate diff", () => {
  const long = Array.from({ length: 300 }, (_, i) => `word${i}`).join(" ");
  const left = Array.from({ length: 50 }, () => long).join("\n");
  const right = Array.from({ length: 50 }, () => `${long} x`).join("\n");
  const result = diffLines(left, right);
  const words = wordDiffs(result.ops, result.approximate);
  assert.ok(words.size > 0 && words.size < 100);
  assert.equal(wordDiffs(result.ops, true).size, 0);
});
