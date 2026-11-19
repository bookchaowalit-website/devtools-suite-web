import assert from "node:assert/strict";
import { test } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { diffLines, lineDiff, MAX_DIFF_CELLS, pairChanges, unifiedDiff, wordDiff, wordDiffs } from "@/lib/diffchecker/diff";

// Lines are counted as git counts them (2026-11-19): a final newline ends the last line, and a last line without one
// is marked noEol, so the page and the copied patch always agree.
test("identical and empty texts retain their shared lines", () => {
  assert.deepEqual(lineDiff("a\nb\n", "a\nb\n"), [
    { type: "equal", line: "a", left: 1, right: 1 },
    { type: "equal", line: "b", left: 2, right: 2 },
  ]);
  assert.deepEqual(lineDiff("a\nb", "a\nb"), [
    { type: "equal", line: "a", left: 1, right: 1 },
    { type: "equal", line: "b", left: 2, right: 2, noEol: true },
  ]);
  assert.deepEqual(lineDiff("", ""), []);
});
test("insertions and deletions keep each side's original line numbers", () => {
  assert.deepEqual(lineDiff("a\nc\n", "a\nb\nc\n"), [
    { type: "equal", line: "a", left: 1, right: 1 },
    { type: "add", line: "b", left: null, right: 2 },
    { type: "equal", line: "c", left: 2, right: 3 },
  ]);
  assert.deepEqual(lineDiff("a\nb\n", "a\n"), [
    { type: "equal", line: "a", left: 1, right: 1 },
    { type: "del", line: "b", left: 2, right: null },
  ]);
});
test("replacements, repeated lines, empty lines and the final newline", () => {
  assert.deepEqual(lineDiff("a\na\nb\n", "a\nb\nb\n").map(op => op.type), ["equal", "del", "add", "equal"]);
  assert.deepEqual(lineDiff("old\n", "new\n").map(op => op.type), ["del", "add"]);
  assert.deepEqual(lineDiff("", "new\n"), [{ type: "add", line: "new", left: null, right: 1 }]);
  assert.deepEqual(lineDiff("old\n", ""), [{ type: "del", line: "old", left: 1, right: null }]);
  // "\n" is one empty line, the same count the patch uses (the page used to show two).
  assert.deepEqual(lineDiff("", "\n"), [{ type: "add", line: "", left: null, right: 1 }]);
  // Only the final newline differs: the last line shows as changed, as in the patch.
  assert.deepEqual(lineDiff("a\n", "a").map(op => [op.type, op.noEol ?? false]), [["del", false], ["add", true]]);
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
  const ops = lineDiff("a\nb\nc\n", "a\nB\nc\n");
  assert.deepEqual([...pairChanges(ops).entries()], [[1, 2], [2, 1]]);
});

test("unified diff has headers, one hunk, +/- / space prefixes and a newline after every line", () => {
  assert.equal(unifiedDiff("a\nb\n", "a\nc\n"), "--- a/file.txt\n+++ b/file.txt\n@@ -1,2 +1,2 @@\n a\n-b\n+c\n");
  assert.equal(unifiedDiff("", "x\n"), "--- a/file.txt\n+++ b/file.txt\n@@ -0,0 +1,1 @@\n+x\n");
  assert.equal(unifiedDiff("a", "b"), "--- a/file.txt\n+++ b/file.txt\n@@ -1,1 +1,1 @@\n-a\n\\ No newline at end of file\n+b\n\\ No newline at end of file\n");
  assert.equal(unifiedDiff("a\n", "a"), "--- a/file.txt\n+++ b/file.txt\n@@ -1,1 +1,1 @@\n-a\n+a\n\\ No newline at end of file\n");
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
      writeFileSync(join(dir, "p.diff"), unifiedDiff(left, right, { file: "f.txt" }));
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

test("the patch names a real file path, spaces kept, .. and control characters removed", async () => {
  const { patchPath } = await import("@/lib/diffchecker/diff");
  assert.match(unifiedDiff("a\n", "b\n", { file: "src/app.ts" }), /^--- a\/src\/app\.ts\n\+\+\+ b\/src\/app\.ts\n/);
  assert.match(unifiedDiff("a\n", "b\n", { file: "src/my notes.txt" }), /^--- a\/src\/my notes\.txt\t\n\+\+\+ b\/src\/my notes\.txt\t\n/);
  assert.equal(patchPath(" ../my notes.txt "), "my notes.txt");
  assert.equal(patchPath("/etc/../x\u0007y"), "etc/xy");
  assert.equal(patchPath(""), "file.txt");
});

test("git apply finds a file whose name has spaces", () => {
  const dir = mkdtempSync(join(tmpdir(), "diffcheck-"));
  try {
    execFileSync("git", ["init", "-q"], { cwd: dir });
    writeFileSync(join(dir, "my notes.txt"), "a\n");
    writeFileSync(join(dir, "p.diff"), unifiedDiff("a\n", "b\n", { file: "my notes.txt" }));
    execFileSync("git", ["apply", "p.diff"], { cwd: dir });
    assert.equal(readFileSync(join(dir, "my notes.txt"), "utf8"), "b\n");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
