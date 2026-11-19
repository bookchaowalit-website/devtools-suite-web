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
    // Shown decoded: (?<\u{e9}>…) is the group "é".
    if (named) names.push(named[1].replace(/\\u\{([0-9a-fA-F]+)\}|\\u([0-9a-fA-F]{4})/g, (_, braced: string, four: string) => String.fromCodePoint(parseInt(braced ?? four, 16))));
  }
  return names;
}

/** Longest replace result built; the rest of the text is left as it was and the result says it stopped. */
export const MAX_REPLACE_OUTPUT = 200_000;
/** Most template pieces expanded per replace (template pieces × matches), so a long template on many matches stays quick. */
export const MAX_REPLACE_WORK = 1_000_000;

/** One piece of a parsed replacement template. */
export type TemplatePart = { literal: string } | { match: true } | { before: true } | { after: true } | { group: number } | { name: string };

/**
 * Parses a replacement template once, in one left-to-right pass (linear in its length), following
 * GetSubstitution in the ECMAScript spec: $$, $&, $`, $', $n and $nn (two digits win when that group exists),
 * and $<name> only when the pattern has named groups; otherwise "$<" is plain text and scanning goes on after it.
 */
export function parseTemplate(template: string, groupCount: number, hasNamedGroups: boolean): TemplatePart[] {
  const parts: TemplatePart[] = [];
  let text = "";
  // A "$<" after the last ">" can never close: known up front, so a template of many "$<" stays linear.
  const lastClose = template.lastIndexOf(">");
  const push = (part: TemplatePart) => { if (text) { parts.push({ literal: text }); text = ""; } parts.push(part); };
  for (let i = 0; i < template.length; i += 1) {
    const char = template[i];
    if (char !== "$" || i + 1 >= template.length) { text += char; continue; }
    const next = template[i + 1];
    if (next === "$") { text += "$"; i += 1; }
    else if (next === "&") { push({ match: true }); i += 1; }
    else if (next === "`") { push({ before: true }); i += 1; }
    else if (next === "'") { push({ after: true }); i += 1; }
    else if (next >= "0" && next <= "9") {
      const two = template[i + 2] >= "0" && template[i + 2] <= "9" ? Number(next + template[i + 2]) : -1;
      if (two >= 1 && two <= groupCount) { push({ group: two }); i += 2; }
      else if (Number(next) >= 1 && Number(next) <= groupCount) { push({ group: Number(next) }); i += 1; }
      else text += "$";
    } else if (next === "<" && hasNamedGroups) {
      // When a ">" follows, it is found once and the scan resumes after it, so every character is read at most twice.
      const close = i + 2 <= lastClose ? template.indexOf(">", i + 2) : -1;
      if (close === -1) { text += "$<"; i += 1; }
      else { push({ name: template.slice(i + 2, close) }); i = close; }
    } else text += "$";
  }
  if (text) parts.push({ literal: text });
  return parts;
}

/**
 * A parsed template expanded for one match. With `limit`, expansion stops once the piece reaches that many characters
 * ($` and $' can each be the whole text) and `complete` is false.
 */
export function expandParts(parts: TemplatePart[], match: string, groups: (string | undefined)[], offset: number, text: string, named?: Record<string, string | undefined>, limit = Infinity): { value: string; complete: boolean } {
  let out = "";
  for (const part of parts) {
    const room = limit - out.length;
    // Slice at most one character past the budget, so a long $` or $' is never copied whole just to be cut.
    const piece = "literal" in part ? part.literal
      : "match" in part ? match
        : "before" in part ? text.slice(0, Math.min(offset, room + 1))
          : "after" in part ? text.slice(offset + match.length, offset + match.length + Math.min(text.length, room + 1))
            : "group" in part ? groups[part.group - 1] ?? ""
              : named?.[part.name] ?? "";
    if (piece.length > room) return { value: out + piece.slice(0, Math.max(0, room)), complete: false };
    out += piece;
  }
  return { value: out, complete: true };
}

/** One template expanded for one match, as String#replace does (parse + expand, for single use and tests). */
export function expandReplacement(template: string, match: string, groups: (string | undefined)[], offset: number, text: string, named?: Record<string, string | undefined>, limit = Infinity): { value: string; complete: boolean } {
  return expandParts(parseTemplate(template, groups.length, named !== undefined), match, groups, offset, text, named, limit);
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
  // Parsed once for every match; the group count and named groups come from the pattern itself.
  const shape = new RegExp(`${re.source}|`, re.flags.replace(/[gy]/g, "")).exec("");
  const parts = parseTemplate(replacement, shape ? shape.length - 1 : 0, Boolean(shape?.groups));
  let work = 0;
  /** Appends one match's replacement within the output and work budgets; false once either is used up. */
  const step = (match: RegExpExecArray): boolean => {
    const gap = text.slice(cursor, match.index);
    if (out.length + gap.length > MAX_REPLACE_OUTPUT) { out += gap.slice(0, MAX_REPLACE_OUTPUT - out.length); return false; }
    work += Math.max(1, parts.length);
    if (work > MAX_REPLACE_WORK) return false;
    out += gap;
    const piece = expandParts(parts, match[0], match.slice(1), match.index, text, match.groups, MAX_REPLACE_OUTPUT - out.length);
    out += piece.value;
    cursor = match.index + match[0].length;
    count += 1;
    return piece.complete;
  };
  const stopped = () => ({ value: (out + text.slice(cursor, cursor + Math.max(0, MAX_REPLACE_OUTPUT - out.length))).slice(0, MAX_REPLACE_OUTPUT), error: "", truncated: true });
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
