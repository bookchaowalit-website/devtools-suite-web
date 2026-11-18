export type Op = { type: "equal" | "add" | "del"; line: string; left: number | null; right: number | null };
/** Splits into lines; an empty text has no lines (not one empty line). */
export const toLines = (text: string): string[] => (text === "" ? [] : text.split("\n"));

/**
 * Largest LCS table built per comparison (changed-middle lines left × right). 4 million cells is about 16 MB as a
 * Uint32Array and well under a second; beyond it the changed middle is shown as removed then added, and the result
 * says it was approximate, instead of freezing the tab.
 */
export const MAX_DIFF_CELLS = 4_000_000;

export type DiffResult = { ops: Op[]; approximate: boolean };

export function lineDiff(left: string, right: string): Op[] {
  return diffLines(left, right).ops;
}

/** Line diff: common lines at the start and end are matched first, then an LCS over the changed middle only. */
export function diffLines(left: string, right: string): DiffResult {
  const a = toLines(left); const b = toLines(right);
  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) head++;
  let tail = 0;
  while (tail < a.length - head && tail < b.length - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail++;
  const midA = a.slice(head, a.length - tail); const midB = b.slice(head, b.length - tail);
  const ops: Op[] = [];
  for (let i = 0; i < head; i++) ops.push({ type: "equal", line: a[i], left: i + 1, right: i + 1 });
  let leftNo = head + 1; let rightNo = head + 1;
  const approximate = (midA.length + 1) * (midB.length + 1) > MAX_DIFF_CELLS;
  if (approximate) {
    for (const line of midA) ops.push({ type: "del", line, left: leftNo++, right: null });
    for (const line of midB) ops.push({ type: "add", line, left: null, right: rightNo++ });
  } else {
    const n = midA.length; const m = midB.length; const width = m + 1;
    const dp = new Uint32Array((n + 1) * width);
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i * width + j] = midA[i] === midB[j] ? dp[(i + 1) * width + j + 1] + 1 : Math.max(dp[(i + 1) * width + j], dp[i * width + j + 1]);
    let i = 0; let j = 0;
    while (i < n && j < m) {
      if (midA[i] === midB[j]) { ops.push({ type: "equal", line: midA[i], left: leftNo++, right: rightNo++ }); i++; j++; }
      else if (dp[(i + 1) * width + j] >= dp[i * width + j + 1]) ops.push({ type: "del", line: midA[i++], left: leftNo++, right: null });
      else ops.push({ type: "add", line: midB[j++], left: null, right: rightNo++ });
    }
    while (i < n) ops.push({ type: "del", line: midA[i++], left: leftNo++, right: null });
    while (j < m) ops.push({ type: "add", line: midB[j++], left: null, right: rightNo++ });
  }
  for (let k = 0; k < tail; k++) ops.push({ type: "equal", line: a[a.length - tail + k], left: leftNo++, right: rightNo++ });
  return { ops, approximate };
}

export type WordPart = { text: string; changed: boolean };

/** Word-level diff of one removed line against the added line that replaced it: the parts each side does not share. */
export function wordDiff(before: string, after: string): { before: WordPart[]; after: WordPart[] } {
  const a = before.split(/(\s+)/).filter(Boolean); const b = after.split(/(\s+)/).filter(Boolean);
  if (a.length * b.length > 40_000) return { before: [{ text: before, changed: true }], after: [{ text: after, changed: true }] };
  const width = b.length + 1;
  const dp = new Uint16Array((a.length + 1) * width);
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) dp[i * width + j] = a[i] === b[j] ? dp[(i + 1) * width + j + 1] + 1 : Math.max(dp[(i + 1) * width + j], dp[i * width + j + 1]);
  const left: WordPart[] = []; const right: WordPart[] = [];
  const push = (parts: WordPart[], text: string, changed: boolean) => {
    const last = parts[parts.length - 1];
    if (last && last.changed === changed) last.text += text; else parts.push({ text, changed });
  };
  let i = 0; let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { push(left, a[i], false); push(right, b[j], false); i++; j++; }
    else if (dp[(i + 1) * width + j] >= dp[i * width + j + 1]) push(left, a[i++], true);
    else push(right, b[j++], true);
  }
  while (i < a.length) push(left, a[i++], true);
  while (j < b.length) push(right, b[j++], true);
  return { before: left, after: right };
}

/** Index of each removed line → the added line paired with it, for runs of removals followed directly by additions. */
export function pairChanges(ops: Op[]): Map<number, number> {
  const pairs = new Map<number, number>();
  for (let k = 0; k < ops.length;) {
    if (ops[k].type !== "del") { k++; continue; }
    const delStart = k; while (k < ops.length && ops[k].type === "del") k++;
    const addStart = k; while (k < ops.length && ops[k].type === "add") k++;
    for (let p = 0; p < Math.min(addStart - delStart, k - addStart); p++) { pairs.set(delStart + p, addStart + p); pairs.set(addStart + p, delStart + p); }
  }
  return pairs;
}

/**
 * Two texts as one unified-diff hunk that `git apply` and `patch` accept: every line ends with a newline, the final
 * newline of each text is not counted as an extra empty line, and a side whose text does not end with a newline gets
 * "\ No newline at end of file" after its last line (the last shared line is split into - and + when only one side
 * ends with a newline).
 */
export function unifiedDiff(left: string, right: string, { from = "original", to = "changed" }: { from?: string; to?: string } = {}): string {
  const leftEol = left.endsWith("\n"); const rightEol = right.endsWith("\n");
  const ops = diffLines(leftEol ? left.slice(0, -1) : left, rightEol ? right.slice(0, -1) : right).ops;
  const last = ops[ops.length - 1];
  if (last && last.type === "equal" && leftEol !== rightEol) {
    ops.splice(ops.length - 1, 1, { type: "del", line: last.line, left: last.left, right: null }, { type: "add", line: last.line, left: null, right: last.right });
  }
  const leftCount = ops.filter((op) => op.type !== "add").length;
  const rightCount = ops.filter((op) => op.type !== "del").length;
  const lastLeft = ops.reduce((at, op, index) => (op.type !== "add" ? index : at), -1);
  const lastRight = ops.reduce((at, op, index) => (op.type !== "del" ? index : at), -1);
  const NO_EOL = "\\ No newline at end of file\n";
  let body = "";
  ops.forEach((op, index) => {
    body += `${op.type === "add" ? "+" : op.type === "del" ? "-" : " "}${op.line}\n`;
    const endsLeft = index === lastLeft && !leftEol && left !== "";
    const endsRight = index === lastRight && !rightEol && right !== "";
    if ((op.type === "del" && endsLeft) || (op.type === "add" && endsRight) || (op.type === "equal" && endsLeft && endsRight)) body += NO_EOL;
  });
  const range = (count: number) => `${count ? 1 : 0},${count}`;
  return `--- ${from}\n+++ ${to}\n@@ -${range(leftCount)} +${range(rightCount)} @@\n${body}`;
}

/** Pairs of removed and added lines worth a word diff, within a total budget of word-table cells for the whole page. */
export const MAX_WORD_CELLS = 400_000;
export function wordDiffs(ops: Op[], approximate: boolean): Map<number, WordPart[]> {
  const result = new Map<number, WordPart[]>();
  if (approximate) return result;
  let budget = MAX_WORD_CELLS;
  const pairs = pairChanges(ops);
  for (const [index, partner] of pairs) {
    if (ops[index].type !== "del") continue;
    const cost = ops[index].line.split(/\s+/).length * ops[partner].line.split(/\s+/).length * 4;
    if (cost > budget) break;
    budget -= cost;
    const { before, after } = wordDiff(ops[index].line, ops[partner].line);
    result.set(index, before);
    result.set(partner, after);
  }
  return result;
}
