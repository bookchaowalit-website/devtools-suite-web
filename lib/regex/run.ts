/** Run a JavaScript RegExp over a test string and list the matches. */

export type Match = { value: string; index: number; groups: string[] };
export type RegexResult = { matches: Match[]; error: string };

export const FLAGS = [
  { flag: "g", name: "global", hint: "All matches" },
  { flag: "i", name: "ignore case", hint: "A = a" },
  { flag: "m", name: "multiline", hint: "^ $ per line" },
  { flag: "s", name: "dotAll", hint: ". matches newline" },
  { flag: "u", name: "unicode", hint: "Full Unicode" },
  { flag: "y", name: "sticky", hint: "From lastIndex" },
] as const;

export const MAX_MATCHES = 1000;

export function runRegex(pattern: string, flags: string, text: string): RegexResult {
  let re: RegExp;
  try {
    re = new RegExp(pattern, flags);
  } catch (error) {
    return { matches: [], error: error instanceof Error ? error.message : "Invalid JavaScript pattern" };
  }
  const matches: Match[] = [];
  if (!re.global) {
    const match = re.exec(text);
    if (match) matches.push({ value: match[0], index: match.index, groups: match.slice(1) });
    return { matches, error: "" };
  }
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null && matches.length < MAX_MATCHES) {
    matches.push({ value: match[0], index: match.index, groups: match.slice(1) });
    // An empty match would loop forever; step past it (by code point with the u flag).
    if (match[0] === "") re.lastIndex += re.unicode && (text.codePointAt(re.lastIndex) ?? 0) > 0xffff ? 2 : 1;
  }
  return { matches, error: "" };
}

/** Split text into plain and matched segments for highlighting. Empty matches are skipped. */
export function segments(text: string, matches: Match[]): { text: string; match: boolean }[] {
  const out: { text: string; match: boolean }[] = [];
  let cursor = 0;
  for (const match of matches) {
    if (!match.value || match.index < cursor) continue;
    if (match.index > cursor) out.push({ text: text.slice(cursor, match.index), match: false });
    out.push({ text: match.value, match: true });
    cursor = match.index + match.value.length;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor), match: false });
  return out;
}

/**
 * The pattern as a JavaScript regex literal. RegExp#toString escapes "/" and line breaks in the
 * source, so a pattern like "a/b" copies as /a\/b/g instead of the broken /a/b/g.
 */
export function toLiteral(pattern: string, flags: string): string {
  try {
    return new RegExp(pattern, flags).toString();
  } catch {
    return `/${pattern}/${flags}`;
  }
}
