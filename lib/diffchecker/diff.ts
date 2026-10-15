export type Op = { type: "equal" | "add" | "del"; line: string; left: number | null; right: number | null };
export function lineDiff(left: string, right: string): Op[] {
  const a = left.split("\n"); const b = right.split("\n");
  const dp = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ops: Op[] = []; let i = 0; let j = 0; let leftNo = 1; let rightNo = 1;
  while (i < a.length && j < b.length) { if (a[i] === b[j]) { ops.push({ type: "equal", line: a[i], left: leftNo++, right: rightNo++ }); i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push({ type: "del", line: a[i++], left: leftNo++, right: null }); } else { ops.push({ type: "add", line: b[j++], left: null, right: rightNo++ }); } }
  while (i < a.length) ops.push({ type: "del", line: a[i++], left: leftNo++, right: null });
  while (j < b.length) ops.push({ type: "add", line: b[j++], left: null, right: rightNo++ });
  return ops;
}
