/** Simple client-side minifiers for snippets and demos; not a production compiler or security boundary. */

export type Mode = "json" | "css" | "html" | "js";
export const MODES: readonly Mode[] = ["json", "css", "html", "js"];

export const SAMPLES: Record<Mode, string> = {
  json: '{\n  "project": "solo-empire",\n  "ships": ["tools", "stories"],\n  "active": true\n}',
  css: `/* A small component */\n.card {\n  color: #17211b;\n  padding: 16px 20px;\n  border: 1px solid #17211b;\n}`,
  html: `<!-- A small document -->\n<article class="note">\n  <h2>Ship the useful thing</h2>\n  <p>Small files travel faster.</p>\n</article>`,
  js: `// A small function\nfunction greet(name) {\n  const message = "Hello, " + name;\n  return message;\n}`,
};

/**
 * Splits code into string literals (kept byte for byte) and the code between them, with comments removed from the
 * code only. JavaScript also keeps `template literals` whole. Regular-expression literals are not recognised.
 */
export function splitCode(input: string, { templates = false, lineComments = false }: { templates?: boolean; lineComments?: boolean } = {}): { code: boolean; text: string }[] {
  const parts: { code: boolean; text: string }[] = [];
  let code = "";
  const flush = () => { if (code) { parts.push({ code: true, text: code }); code = ""; } };
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const quote = char === '"' || char === "'" || (templates && char === "`");
    if (quote) {
      let end = i + 1;
      while (end < input.length && input[end] !== char) end += input[end] === "\\" ? 2 : 1;
      flush();
      parts.push({ code: false, text: input.slice(i, Math.min(end + 1, input.length)) });
      i = end;
    } else if (char === "/" && input[i + 1] === "*") {
      const end = input.indexOf("*/", i + 2);
      code += " ";
      i = end === -1 ? input.length : end + 1;
    } else if (lineComments && char === "/" && input[i + 1] === "/") {
      const end = input.indexOf("\n", i + 2);
      code += "\n";
      i = end === -1 ? input.length : end;
    } else {
      code += char;
    }
  }
  flush();
  return parts;
}

/** Collapse whitespace in the code parts only, then trim spaces around punctuation; strings pass through unchanged. */
function squeeze(parts: { code: boolean; text: string }[], punctuation: RegExp): string {
  return parts.map((part) => (part.code ? part.text.replace(/\s+/g, " ").replace(punctuation, "$1") : part.text)).join("").trim();
}

/** True when JavaScript input has a "/" that may start a regular expression literal, which this minifier does not parse. */
export function mayHaveRegexLiteral(input: string): boolean {
  return splitCode(input, { templates: true, lineComments: true }).some((part) => part.code && /(^|[=(,:!&|?{};\[]\s*)\/(?![/*])/.test(part.text));
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
  return squeeze(splitCode(input, { templates: true, lineComments: true }), /\s*([{};,=+\-*/%<>!&|?:()[\]])\s*/g);
}
