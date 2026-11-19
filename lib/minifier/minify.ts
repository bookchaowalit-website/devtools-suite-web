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
  try {
    const result = await minify(input, { compress: false, mangle: false, format: { comments: false } });
    return result.code ?? "";
  } catch (cause) {
    const error = cause as { message?: string; line?: number; col?: number };
    throw new MinifyError(sentence(error.message ?? "This JavaScript could not be parsed"), typeof error.line === "number" ? error.line : null, typeof error.col === "number" ? error.col + 1 : null);
  }
}

/** CSS through csso with restructuring off, so rules keep their order and selectors their meaning. */
async function minifyCss(input: string): Promise<string> {
  const { minify } = await import("csso");
  try {
    return minify(input, { restructure: false, comments: false }).css;
  } catch (cause) {
    const error = cause as { message?: string; line?: number; column?: number };
    throw new MinifyError(sentence(error.message ?? "This CSS could not be parsed"), typeof error.line === "number" ? error.line : null, typeof error.column === "number" ? error.column : null);
  }
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
