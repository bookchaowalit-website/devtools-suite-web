/**
 * Minifiers for the Code Minifier page. JavaScript uses terser and CSS uses csso, the same libraries real build tools
 * use; both are loaded with dynamic import() so only this page downloads them. JSON is parsed and re-serialised;
 * HTML is a simple comment and whitespace stripper.
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

/** Number of "{" outside strings and comments: one per rule or at-rule block. */
export function countBlocks(css: string): number {
  let count = 0;
  for (let i = 0; i < css.length; i += 1) {
    const char = css[i];
    if (char === "/" && css[i + 1] === "*") { const end = css.indexOf("*/", i + 2); i = end === -1 ? css.length : end + 1; }
    else if (char === '"' || char === "'") { let end = i + 1; while (end < css.length && css[end] !== char) end += css[end] === "\\" ? 2 : 1; i = end; }
    else if (char === "\\") i += 1;
    else if (char === "{") count += 1;
  }
  return count;
}

/** Math functions (any case) whose zero arguments must keep their unit: csso turns 0px into 0 inside them. */
const CSS_MATH = /(^|[^\w-])(calc|calc-size|min|max|clamp|round|mod|rem|sin|cos|tan|asin|acos|atan|atan2|pow|sqrt|hypot|log|exp|abs|sign)\s*\(/i;

type CssPart = { kind: "code" | "string" | "url" | "comment"; text: string };

/**
 * Splits CSS into strings ('…', "…"), unquoted url(…) and comments, kept byte for byte, and the code between them.
 * Escapes inside strings and url() are honoured, so a quote, ";", "}" or "/*" there never ends the piece early.
 */
export function cssParts(input: string): CssPart[] {
  const parts: CssPart[] = [];
  let code = "";
  const flush = () => { if (code) { parts.push({ kind: "code", text: code }); code = ""; } };
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char === "\\") { code += input.slice(i, i + 2); i += 1; }
    else if (char === '"' || char === "'") {
      let end = i + 1;
      while (end < input.length && input[end] !== char && input[end] !== "\n") end += input[end] === "\\" ? 2 : 1;
      flush(); parts.push({ kind: "string", text: input.slice(i, end + 1) }); i = end;
    } else if (char === "/" && input[i + 1] === "*") {
      const end = input.indexOf("*/", i + 2);
      const stop = end === -1 ? input.length : end + 2;
      flush(); parts.push({ kind: "comment", text: input.slice(i, stop) }); i = stop - 1;
    } else if ((char === "(") && /url$/i.test(code) && !/[\w-]url$/i.test(code)) {
      // Unquoted url(…): everything to the closing ")" is the address. A quoted url("…") is read as a string.
      let start = i + 1;
      while (start < input.length && /\s/.test(input[start])) start += 1;
      if (input[start] === '"' || input[start] === "'") { code += char; continue; }
      let end = start;
      while (end < input.length && input[end] !== ")") end += input[end] === "\\" ? 2 : 1;
      code += "("; flush(); parts.push({ kind: "url", text: input.slice(i + 1, end) }); i = end - 1;
    } else code += char;
  }
  flush();
  return parts;
}

/**
 * Why a CSS input gets the light minify instead of csso, or "" when csso is safe. csso 5 drops a valid @import that
 * follows an @layer statement and strips units from zero inside calc(), calc-size() and the other math functions.
 * Only code is checked (not strings, url() or comments); any escape (\\63 alc() also takes the light path, since an
 * escaped function name cannot be checked by name.
 */
export function cssLightReason(input: string): string {
  const code = cssParts(input).filter((part) => part.kind === "code").map((part) => part.text).join(" ");
  if (/@import\b/i.test(code) || /@layer\b/i.test(code)) return "This CSS uses @import or @layer, so only comments and extra whitespace were removed (the full minifier can drop an @import that follows @layer).";
  if (CSS_MATH.test(code) || code.includes("\\")) return "This CSS uses calc() or another math function, so only comments and extra whitespace were removed (the full minifier can turn 0px into 0 there, which breaks the value).";
  return "";
}
const cssNeedsLightMode = (input: string) => cssLightReason(input) !== "";

/**
 * Light CSS minify. Strings, url(…) and their contents are never touched. Comments are removed (an empty comment is
 * kept where removing it would join two tokens, as in .a, a comment, .b); in the code between, whitespace collapses to
 * one space and is dropped only next to { } and ;, and a ";" right before "}" goes. None of this changes meaning.
 */
export function lightCss(input: string): string {
  const parts = cssParts(input);
  const out: string[] = [];
  let lastWasCode = false;
  const lastChar = () => { const piece = out[out.length - 1]; return piece ? piece[piece.length - 1] : ""; };
  const dropLastChar = () => { out[out.length - 1] = out[out.length - 1].slice(0, -1); if (!out[out.length - 1]) out.pop(); };
  parts.forEach((part, index) => {
    if (part.kind === "string" || part.kind === "url") { out.push(part.text); lastWasCode = false; return; }
    if (part.kind === "comment") {
      const before = lastChar();
      const after = parts[index + 1]?.text[0] ?? "";
      if (before && after && /[^\s{};,:>]/.test(before) && /[^\s{};,:>]/.test(after)) { out.push("/**/"); lastWasCode = false; }
      return;
    }
    let text = part.text.replace(/\s+/g, " ").replace(/\s*([{};])\s*/g, "$1").replace(/;}/g, "}");
    // Pieces split by a removed comment join as if the comment were never there (only code ends are touched).
    if (lastWasCode) {
      if (lastChar() === ";" && text.startsWith("}")) dropLastChar();
      if (lastChar() === " " && (/^[{};]/.test(text) || text.startsWith(" "))) dropLastChar();
      if (/[{};]/.test(lastChar())) text = text.replace(/^ /, "");
    }
    if (text) { out.push(text); lastWasCode = true; }
  });
  return out.join("").trim();
}

/**
 * CSS through csso with restructuring off, so rules keep their order and selectors their meaning. csso drops some
 * valid CSS without an error (nested rules, empty blocks such as "@layer base {}", which still set layer order), so
 * a result with fewer blocks than the input is refused with an error instead of being shown.
 */
async function minifyCss(input: string): Promise<string> {
  if (cssNeedsLightMode(input)) return lightCss(input);
  const { minify } = await import("csso");
  let css: string;
  try {
    css = minify(input, { restructure: false, comments: false }).css;
  } catch (cause) {
    const error = cause as { message?: string; line?: number; column?: number };
    throw new MinifyError(sentence(error.message ?? "This CSS could not be parsed"), typeof error.line === "number" ? error.line : null, typeof error.column === "number" ? error.column : null);
  }
  const lost = countBlocks(input) - countBlocks(css);
  if (lost > 0) {
    throw new MinifyError(`The CSS minifier would drop ${lost} ${lost === 1 ? "block" : "blocks"}, so nothing was minified. It does not keep nested rules (& .child { … }) or empty blocks such as @layer base {}; flatten or remove them, then try again.`);
  }
  return css;
}

/** True for the modes minified without a library (JSON, HTML), which can run during render and on the server. */
export const isInstant = (mode: Mode) => mode === "json" || mode === "html";

/** JSON and HTML, synchronously. JSON is parsed, so invalid JSON throws. */
export function minifyInstant(mode: "json" | "html", input: string): string {
  if (mode === "json") return JSON.stringify(JSON.parse(input));
  return input
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Minify one snippet. JavaScript and CSS errors carry their line and column. */
export async function minify(mode: Mode, input: string): Promise<string> {
  if (mode === "css") return minifyCss(input);
  if (mode === "js") return minifyJs(input);
  return minifyInstant(mode, input);
}
