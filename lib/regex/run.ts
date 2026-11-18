/** Run a JavaScript RegExp over a test string and list the matches. */

/** `ranges[i]` is where group i + 1 sits in the text ([start, end)), undefined when it did not take part. */
export type Match = { value: string; index: number; groups: string[]; ranges?: ([number, number] | undefined)[] };
/** `names[i]` is the name of group i + 1 for (?<name>…) groups, otherwise undefined. */
export type RegexResult = { matches: Match[]; error: string; names?: (string | undefined)[] };

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
  // The d flag (match indices) only adds positions, so it never changes what matches.
  if (!flags.includes("d")) re = new RegExp(pattern, flags + "d");
  const names = groupNames(pattern);
  const toMatch = (match: RegExpExecArray): Match => ({
    value: match[0],
    index: match.index,
    groups: match.slice(1),
    ranges: match.indices ? match.indices.slice(1).map((range) => (range ? [range[0], range[1]] as [number, number] : undefined)) : undefined,
  });
  const matches: Match[] = [];
  if (!re.global) {
    const match = re.exec(text);
    if (match) matches.push(toMatch(match));
    return { matches, error: "", names };
  }
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null && matches.length < MAX_MATCHES) {
    matches.push(toMatch(match));
    // An empty match would loop forever; step past it (by code point with the u flag).
    if (match[0] === "") re.lastIndex += re.unicode && (text.codePointAt(re.lastIndex) ?? 0) > 0xffff ? 2 : 1;
  }
  return { matches, error: "", names };
}

/** Group names by position, from the source: the nth capturing "(" is group n; "(?<name>" names it. */
export function groupNames(pattern: string): (string | undefined)[] {
  const names: (string | undefined)[] = [];
  let inClass = false;
  for (let i = 0; i < pattern.length; i += 1) {
    const char = pattern[i];
    if (char === "\\") { i += 1; continue; }
    if (inClass) { if (char === "]") inClass = false; continue; }
    if (char === "[") { inClass = true; continue; }
    if (char !== "(") continue;
    if (pattern[i + 1] !== "?") { names.push(undefined); continue; }
    // (?<name>…) captures under any name JavaScript accepts (Unicode or \u escapes); (?<= and (?<! are lookbehinds.
    const named = /^\?<(?![=!])([^>]+)>/.exec(pattern.slice(i + 1));
    if (named) names.push(named[1]);
  }
  return names;
}

/** Longest replace result built; the rest of the text is left as it was and the result says it stopped. */
export const MAX_REPLACE_OUTPUT = 200_000;

/**
 * A replacement template expanded for one match, as String#replace does: $$, $&, $`, $', $1–$99 and $<name>.
 * With `limit`, expansion stops once the piece reaches that many characters ($` and $' can each be the whole text),
 * and `complete` is false.
 */
export function expandReplacement(template: string, match: string, groups: (string | undefined)[], offset: number, text: string, named?: Record<string, string | undefined>, limit = Infinity): { value: string; complete: boolean } {
  let out = "";
  let last = 0;
  const add = (piece: string) => {
    if (out.length + piece.length > limit) { out += piece.slice(0, Math.max(0, limit - out.length)); return false; }
    out += piece;
    return true;
  };
  const token = /\$(\$|&|`|'|\d{1,2}|<([^>]*)>)/g;
  for (let found = token.exec(template); found; found = token.exec(template)) {
    if (!add(template.slice(last, found.index))) return { value: out, complete: false };
    last = found.index + found[0].length;
    const [whole, what, name] = found;
    let piece: string;
    if (what === "$") piece = "$";
    else if (what === "&") piece = match;
    // Slice at most one character past the budget, so a long $` or $' is never copied whole just to be cut.
    else if (what === "`") piece = text.slice(0, Math.min(offset, limit - out.length + 1));
    else if (what === "'") piece = text.slice(offset + match.length, offset + match.length + Math.min(text.length, limit - out.length + 1));
    else if (name !== undefined) piece = named ? named[name] ?? "" : whole;
    else {
      // $12 means group 12 when it exists, otherwise group 1 followed by "2"; $0 and missing groups stay literal.
      const two = Number(what);
      const one = Number(what[0]);
      piece = what.length === 2 && two >= 1 && two <= groups.length ? groups[two - 1] ?? ""
        : one >= 1 && one <= groups.length ? (groups[one - 1] ?? "") + what.slice(1) : whole;
    }
    if (!add(piece)) return { value: out, complete: false };
  }
  return add(template.slice(last)) ? { value: out, complete: true } : { value: out, complete: false };
}

/**
 * Text with matches replaced, as String#replace does. Bounded for the live preview: at most MAX_MATCHES matches are
 * replaced and the result stops growing at MAX_REPLACE_OUTPUT characters; `truncated` says when either cap was hit.
 */
export function replaceAll(pattern: string, flags: string, text: string, replacement: string): { value: string; error: string; truncated: boolean } {
  let re: RegExp;
  try {
    re = new RegExp(pattern, flags);
  } catch (error) {
    return { value: "", error: error instanceof Error ? error.message : "Invalid JavaScript pattern", truncated: false };
  }
  let out = "";
  let cursor = 0;
  let count = 0;
  /** Appends one match's replacement within the output budget; false once the budget is used up. */
  const step = (match: RegExpExecArray): boolean => {
    out += text.slice(cursor, match.index).slice(0, Math.max(0, MAX_REPLACE_OUTPUT - out.length));
    if (out.length >= MAX_REPLACE_OUTPUT) return false;
    const piece = expandReplacement(replacement, match[0], match.slice(1), match.index, text, match.groups, MAX_REPLACE_OUTPUT - out.length);
    out += piece.value;
    cursor = match.index + match[0].length;
    count += 1;
    return piece.complete;
  };
  const stopped = () => ({ value: out.slice(0, MAX_REPLACE_OUTPUT), error: "", truncated: true });
  if (!re.global) {
    const match = re.exec(text);
    if (match && !step(match)) return stopped();
  } else {
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      if (count >= MAX_MATCHES) return { value: (out + text.slice(cursor, cursor + Math.max(0, MAX_REPLACE_OUTPUT - out.length))), error: "", truncated: true };
      if (!step(match)) return stopped();
      if (match[0] === "") re.lastIndex += re.unicode && (text.codePointAt(re.lastIndex) ?? 0) > 0xffff ? 2 : 1;
    }
  }
  const value = out + text.slice(cursor);
  return value.length > MAX_REPLACE_OUTPUT ? { value: value.slice(0, MAX_REPLACE_OUTPUT), error: "", truncated: true } : { value, error: "", truncated: false };
}

export type Piece = { text: string; group: number | null };
export type Segment = { text: string; match: boolean; index?: number; pieces?: Piece[] };

/**
 * A match split into its capture groups, for colouring in the preview. Nested or overlapping groups keep only the
 * outermost one that starts first; text outside every group has group null.
 */
export function matchPieces(match: Match): Piece[] {
  const start = match.index;
  const end = start + match.value.length;
  const ranges = (match.ranges ?? [])
    .map((range, group) => (range && range[1] > range[0] ? { from: range[0], to: range[1], group: group + 1 } : null))
    .filter((range): range is { from: number; to: number; group: number } => range !== null && range.from >= start && range.to <= end)
    .sort((a, b) => a.from - b.from || b.to - a.to);
  const pieces: Piece[] = [];
  let cursor = start;
  for (const range of ranges) {
    if (range.from < cursor) continue;
    if (range.from > cursor) pieces.push({ text: match.value.slice(cursor - start, range.from - start), group: null });
    pieces.push({ text: match.value.slice(range.from - start, range.to - start), group: range.group });
    cursor = range.to;
  }
  if (cursor < end) pieces.push({ text: match.value.slice(cursor - start), group: null });
  return pieces;
}

/** Split text into plain and matched segments for highlighting. Empty matches are skipped. */
export function segments(text: string, matches: Match[]): Segment[] {
  const out: Segment[] = [];
  let cursor = 0;
  for (const [index, match] of matches.entries()) {
    if (!match.value || match.index < cursor) continue;
    if (match.index > cursor) out.push({ text: text.slice(cursor, match.index), match: false });
    const pieces = matchPieces(match);
    out.push(pieces.some((piece) => piece.group !== null) ? { text: match.value, match: true, index, pieces } : { text: match.value, match: true, index });
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
