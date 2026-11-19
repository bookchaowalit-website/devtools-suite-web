/**
 * Minifiers for the Code Minifier page. JavaScript uses terser, loaded with dynamic import() so only this page
 * downloads it. CSS is a safe tokenizer that removes comments and extra whitespace and never rewrites a value (csso
 * was removed on 2026-11-19 because it changed values). JSON is parsed and re-serialised; HTML is a simple comment and
 * whitespace stripper.
 */

export type Mode = "json" | "css" | "html" | "js";
export const MODES: readonly Mode[] = ["json", "css", "html", "js"];

export const SAMPLES: Record<Mode, string> = {
  json: '{\n  "project": "solo-empire",\n  "ships": ["tools", "stories"],\n  "active": true\n}',
  css: `/* A small component */\n.card {\n  color: #17211b;\n  padding: 16px 20px;\n  border: 1px solid #17211b;\n}`,
  html: `<!-- A small document -->\n<article class="note">\n  <h2>Ship the useful thing</h2>\n  <p>Small files travel faster.</p>\n</article>`,
  js: `// A small function\nfunction greet(name) {\n  const message = "Hello, " + name;\n  return message;\n}`,
};

/** A minify failure with a plain sentence and, when the parser knows it, the 1-based line and column. */
export class MinifyError extends Error {
  constructor(message: string, readonly line: number | null = null, readonly column: number | null = null) {
    super(line !== null ? `Line ${line}, column ${column ?? 1}: ${message}` : message);
    this.name = "MinifyError";
  }
}

const sentence = (text: string) => { const trimmed = text.trim(); return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`; };

/**
 * JavaScript through terser with compress and mangle off: comments and whitespace go, names and statements stay as
 * written, so the result reads like the input and behaves the same.
 */
async function minifyJs(input: string): Promise<string> {
  const { minify } = await import("terser");
  const options = { compress: false, mangle: false, format: { comments: false } } as const;
  try {
    return (await minify(input, options)).code ?? "";
  } catch (scriptError) {
    // Not a valid script: try it as a module (import/export, top-level await). If that fails too, report the
    // script error, which is the one people expect for plain code.
    try { return (await minify(input, { ...options, module: true })).code ?? ""; } catch { /* report the script error */ }
    const cause = scriptError;
    const error = cause as { message?: string; line?: number; col?: number };
    throw new MinifyError(sentence(error.message ?? "This JavaScript could not be parsed"), typeof error.line === "number" ? error.line : null, typeof error.col === "number" ? error.col + 1 : null);
  }
}

type CssPart = { kind: "code" | "literal" | "comment"; text: string };

/**
 * Splits CSS into literals kept byte for byte (quoted strings, unquoted url(…) and every backslash escape, inside
 * strings or not), comments, and the code between them. A hex escape (\\63 ) includes the one whitespace that ends
 * it, so collapsing spaces never eats or adds that space.
 */
export function cssParts(input: string): CssPart[] {
  const parts: CssPart[] = [];
  let code = "";
  const flush = () => { if (code) { parts.push({ kind: "code", text: code }); code = ""; } };
  const literal = (text: string) => { flush(); parts.push({ kind: "literal", text }); };
  /** Index just past the escape that starts at `i` (the backslash). */
  const escapeEnd = (i: number) => {
    const hex = /^[0-9a-fA-F]{1,6}(\r\n|[ \t\n\r\f])?/.exec(input.slice(i + 1, i + 9));
    return hex ? i + 1 + hex[0].length : Math.min(i + 2, input.length);
  };
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char === "\\") { const end = escapeEnd(i); literal(input.slice(i, end)); i = end - 1; }
    else if (char === '"' || char === "'") {
      let end = i + 1;
      while (end < input.length && input[end] !== char && input[end] !== "\n") end = input[end] === "\\" ? escapeEnd(end) : end + 1;
      literal(input.slice(i, end + 1)); i = end;
    } else if (char === "/" && input[i + 1] === "*") {
      const end = input.indexOf("*/", i + 2);
      const stop = end === -1 ? input.length : end + 2;
      flush(); parts.push({ kind: "comment", text: input.slice(i, stop) }); i = stop - 1;
    } else if (char === "(" && /url$/i.test(code) && !/[\w-]url$/i.test(code)) {
      // Unquoted url(…): everything to the closing ")" is the address. A quoted url("…") is read as a string.
      let start = i + 1;
      while (start < input.length && /\s/.test(input[start])) start += 1;
      if (input[start] === '"' || input[start] === "'") { code += char; continue; }
      let end = start;
      while (end < input.length && input[end] !== ")") end = input[end] === "\\" ? escapeEnd(end) : end + 1;
      code += "("; literal(input.slice(i + 1, end)); i = end - 1;
    } else code += char;
  }
  flush();
  return parts;
}

/**
 * CSS minify: removes comments and collapses whitespace, and nothing else; no value, unit, selector or at-rule is
 * rewritten. Literals (strings, url(…), escapes) are copied exactly. In the code between them, runs of whitespace
 * become one space, and spaces next to { } and ; are dropped; a ";" right before "}" goes. A comment between two
 * tokens stays as an empty comment, so .a, a comment, .b keeps its meaning.
 */
export function minifyCss(input: string): string {
  const parts = cssParts(input);
  const out: string[] = [];
  let lastWasCode = false;
  const lastChar = () => { const piece = out[out.length - 1]; return piece ? piece[piece.length - 1] : ""; };
  const dropLastChar = () => { out[out.length - 1] = out[out.length - 1].slice(0, -1); if (!out[out.length - 1]) out.pop(); };
  parts.forEach((part, index) => {
    if (part.kind === "literal") { out.push(part.text); lastWasCode = false; return; }
    if (part.kind === "comment") {
      const before = lastChar();
      const after = parts[index + 1]?.text[0] ?? "";
      if (before && after && /[^\s{};,:>]/.test(before) && /[^\s{};,:>]/.test(after)) { out.push("/**/"); lastWasCode = false; }
      return;
    }
    let text = part.text.replace(/\s+/g, " ").replace(/\s*([{};])\s*/g, "$1").replace(/;}/g, "}");
    // Code pieces split by a removed comment join as if the comment were never there (only code ends are touched).
    if (lastWasCode) {
      if (lastChar() === ";" && text.startsWith("}")) dropLastChar();
      if (lastChar() === " " && (/^[{};]/.test(text) || text.startsWith(" "))) dropLastChar();
      if (/[{};]/.test(lastChar())) text = text.replace(/^ /, "");
    }
    if (text) { out.push(text); lastWasCode = true; }
  });
  return out.join("").trim();
}

/** True for the modes minified without a library (JSON, CSS, HTML), which can run during render and on the server. */
export const isInstant = (mode: Mode) => mode !== "js";

/** JSON, CSS and HTML, synchronously. JSON is parsed, so invalid JSON throws. */
export function minifyInstant(mode: "json" | "css" | "html", input: string): string {
  if (mode === "json") return JSON.stringify(JSON.parse(input));
  if (mode === "css") return minifyCss(input);
  return input
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Minify one snippet. JavaScript errors carry their line and column. */
export async function minify(mode: Mode, input: string): Promise<string> {
  if (mode === "js") return minifyJs(input);
  return minifyInstant(mode, input);
}
