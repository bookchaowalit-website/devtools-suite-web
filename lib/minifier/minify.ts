/** Simple client-side minifiers for snippets and demos; not a production compiler or security boundary. */

export type Mode = "json" | "css" | "html" | "js";
export const MODES: readonly Mode[] = ["json", "css", "html", "js"];

export const SAMPLES: Record<Mode, string> = {
  json: '{\n  "project": "solo-empire",\n  "ships": ["tools", "stories"],\n  "active": true\n}',
  css: `/* A small component */\n.card {\n  color: #17211b;\n  padding: 16px 20px;\n  border: 1px solid #17211b;\n}`,
  html: `<!-- A small document -->\n<article class="note">\n  <h2>Ship the useful thing</h2>\n  <p>Small files travel faster.</p>\n</article>`,
  js: `// A small function\nfunction greet(name) {\n  const message = "Hello, " + name;\n  return message;\n}`,
};

const LINE_END = /[\n\r\u2028\u2029]/;
/** Words after which a "/" starts a regular expression literal, not a division. */
const REGEX_AFTER_WORD = new Set(["return", "typeof", "case", "do", "else", "in", "of", "new", "delete", "void", "throw", "yield", "await", "instanceof"]);

/** Index just past a quoted string that opens at `i`. */
function skipString(input: string, i: number): number {
  const quote = input[i];
  let end = i + 1;
  while (end < input.length && input[end] !== quote && !(quote !== "`" && LINE_END.test(input[end]))) end += input[end] === "\\" ? 2 : 1;
  return Math.min(end + 1, input.length);
}

/** Index just past a template literal that opens at `i`, including ${…} expressions that hold strings or templates. */
function skipTemplate(input: string, i: number): number {
  let at = i + 1;
  while (at < input.length) {
    const char = input[at];
    if (char === "\\") { at += 2; continue; }
    if (char === "`") return at + 1;
    if (char === "$" && input[at + 1] === "{") {
      let depth = 1;
      at += 2;
      while (at < input.length && depth > 0) {
        const inner = input[at];
        if (inner === '"' || inner === "'") at = skipString(input, at);
        else if (inner === "`") at = skipTemplate(input, at);
        else { if (inner === "{") depth += 1; else if (inner === "}") depth -= 1; at += 1; }
      }
      continue;
    }
    at += 1;
  }
  return input.length;
}

/** Index just past a regular expression literal that opens at `i` (character classes may hold "/"), or -1 if none. */
function skipRegex(input: string, i: number): number {
  let at = i + 1;
  let inClass = false;
  while (at < input.length && !LINE_END.test(input[at])) {
    const char = input[at];
    if (char === "\\") { at += 2; continue; }
    if (inClass) { if (char === "]") inClass = false; }
    else if (char === "[") inClass = true;
    else if (char === "/") { at += 1; while (at < input.length && /[a-z]/i.test(input[at])) at += 1; return at; }
    at += 1;
  }
  return -1;
}

/** True when a "/" at this point of the code starts a regular expression: after an operator, a bracket, or a keyword. */
function regexCanStart(code: string): boolean {
  const before = code.replace(/\s+$/, "");
  if (!before) return true;
  if (/[(,=:[!&|?{};+\-*%<>~^]$/.test(before)) return true;
  const word = /([A-Za-z_$][\w$]*)$/.exec(before);
  return Boolean(word && REGEX_AFTER_WORD.has(word[1]));
}

/**
 * Splits code into literals (kept byte for byte) and the code between them, with comments removed from the code.
 * Strings are literals in both languages; JavaScript also keeps template literals (nested ones included) and regular
 * expression literals. A block comment becomes a space in JavaScript but nothing in CSS, where ".a", a comment, ".b"
 * is the compound selector .a.b (a space would make it a descendant selector).
 */
export function splitCode(input: string, { js = false }: { js?: boolean } = {}): { code: boolean; text: string }[] {
  const parts: { code: boolean; text: string }[] = [];
  let code = "";
  const flush = () => { if (code) { parts.push({ code: true, text: code }); code = ""; } };
  const literal = (from: number, to: number) => { flush(); parts.push({ code: false, text: input.slice(from, to) }); };
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char === '"' || char === "'") { const end = skipString(input, i); literal(i, end); i = end - 1; }
    else if (js && char === "`") { const end = skipTemplate(input, i); literal(i, end); i = end - 1; }
    else if (char === "/" && input[i + 1] === "*") {
      const end = input.indexOf("*/", i + 2);
      if (js) code += " ";
      i = end === -1 ? input.length : end + 1;
    } else if (js && char === "/" && input[i + 1] === "/") {
      let end = i + 2;
      while (end < input.length && !LINE_END.test(input[end])) end += 1;
      code += "\n";
      i = end;
    } else if (js && char === "/" && regexCanStart((parts.length && !code ? parts[parts.length - 1].text : "") + code)) {
      const end = skipRegex(input, i);
      if (end === -1) code += char; else { literal(i, end); i = end - 1; }
    } else {
      code += char;
    }
  }
  flush();
  return parts;
}

/** Collapse whitespace in the code parts only, then trim spaces around punctuation; literals pass through unchanged. */
function squeeze(parts: { code: boolean; text: string }[], punctuation: RegExp): string {
  return parts.map((part) => (part.code ? part.text.replace(/\s+/g, " ").replace(punctuation, "$1") : part.text)).join("").trim();
}

/** Strip comments and collapse whitespace. JSON is parsed, so invalid JSON throws. Strings are never changed. */
export function minify(mode: Mode, input: string): string {
  if (mode === "json") return JSON.stringify(JSON.parse(input));
  if (mode === "css") return squeeze(splitCode(input), /\s*([{}:;,>])\s*/g);
  if (mode === "html") {
    return input
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/>\s+</g, "><")
      .replace(/\s{2,}/g, " ")
      .trim();
  }
  return squeeze(splitCode(input, { js: true }), /\s*([{};,=+\-*/%<>!&|?:()[\]])\s*/g);
}
