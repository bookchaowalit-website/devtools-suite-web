import { dump, load, JSON_SCHEMA } from "js-yaml";

export type ConversionMode = "PRETTY" | "MINIFY" | "JSON → YAML" | "YAML → JSON";

export function jsonToYaml(value: unknown): string {
  return dump(value, { schema: JSON_SCHEMA, indent: 2, lineWidth: -1, noRefs: true }).trimEnd();
}

function assertFiniteNumbers(value: unknown, seen = new WeakSet<object>()): void {
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new Error("YAML contains a non-finite number that JSON cannot represent.");
  }
  if (value !== null && typeof value === "object" && !seen.has(value)) {
    seen.add(value);
    for (const item of Object.values(value)) assertFiniteNumbers(item, seen);
  }
}

export function yamlToJson(text: string): unknown {
  const value = load(text, { schema: JSON_SCHEMA });
  assertFiniteNumbers(value);
  return value;
}

export type Indent = "2" | "4" | "tab";
const INDENT: Record<Indent, string | number> = { "2": 2, "4": 4, tab: "\t" };

/** `indent` sets formatted JSON (Format and To JSON); To YAML uses 2 or 4 spaces (YAML forbids tabs, so tab means 2). */
export function transformDocument(input: string, mode: ConversionMode, indent: Indent = "2"): string {
  if (mode === "PRETTY") return JSON.stringify(JSON.parse(input), null, INDENT[indent]);
  if (mode === "MINIFY") return JSON.stringify(JSON.parse(input));
  if (mode === "JSON → YAML") return dump(JSON.parse(input), { schema: JSON_SCHEMA, indent: indent === "4" ? 4 : 2, lineWidth: -1, noRefs: true }).trimEnd();
  const result = JSON.stringify(yamlToJson(input), null, INDENT[indent]);
  if (result === undefined) throw new Error("Enter a JSON or YAML document.");
  return result;
}

export type ParseProblem = { message: string; line: number | null; column: number | null; offset: number | null };

/** Line (1-based) and column (1-based) of a character offset. */
export function lineColumn(text: string, offset: number): { line: number; column: number } {
  const before = text.slice(0, Math.max(0, Math.min(offset, text.length)));
  const lines = before.split("\n");
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}

/** Offset of a 1-based line and column, clamped to the text. */
export function offsetOf(text: string, line: number, column: number): number {
  const lines = text.split("\n");
  let offset = 0;
  for (let index = 0; index < Math.min(line - 1, lines.length - 1); index += 1) offset += lines[index].length + 1;
  return Math.min(text.length, offset + Math.max(0, column - 1));
}

/**
 * A JSON.parse or js-yaml error as a short sentence plus where it is: "Line 4, column 3: Expected ',' or '}' after
 * property value." Engines word the position differently, so both "position N" and "line L column C" are read.
 */
export function describeProblem(input: string, cause: unknown): ParseProblem {
  const mark = (cause as { mark?: { line?: number; column?: number; position?: number } } | null)?.mark;
  const reason = (cause as { reason?: string } | null)?.reason;
  if (mark && typeof mark.line === "number" && typeof mark.column === "number") {
    const line = mark.line + 1; const column = mark.column + 1;
    return { message: `Line ${line}, column ${column}: ${sentence(reason ?? "this YAML is not valid")}`, line, column, offset: typeof mark.position === "number" ? mark.position : offsetOf(input, line, column) };
  }
  const text = cause instanceof Error ? cause.message : String(cause ?? "");
  const lineMatch = /\(line (\d+) column (\d+)\)/.exec(text);
  const position = /at position (\d+)/.exec(text);
  const core = text.replace(/\s*\(line \d+ column \d+\)/, "").replace(/ in JSON at position \d+/, "").replace(/^JSON\.parse: /, "").trim();
  if (/Unexpected end of JSON input/i.test(core)) {
    const where = lineColumn(input, input.length);
    return { message: `Line ${where.line}, column ${where.column}: the JSON ends too early. A closing } or ] or a quote may be missing.`, ...where, offset: input.length };
  }
  if (lineMatch || position) {
    const where = lineMatch ? { line: Number(lineMatch[1]), column: Number(lineMatch[2]) } : lineColumn(input, Number(position?.[1]));
    const offset = position ? Number(position[1]) : offsetOf(input, where.line, where.column);
    return { message: `Line ${where.line}, column ${where.column}: ${sentence(core)}`, ...where, offset };
  }
  return { message: sentence(core || "Could not convert this document."), line: null, column: null, offset: null };
}

const sentence = (text: string) => {
  const trimmed = text.trim().replace(/\s+/g, " ");
  const capital = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return /[.!?]$/.test(capital) ? capital : `${capital}.`;
};
