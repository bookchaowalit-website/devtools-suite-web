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

export function transformDocument(input: string, mode: ConversionMode): string {
  if (mode === "PRETTY") return JSON.stringify(JSON.parse(input), null, 2);
  if (mode === "MINIFY") return JSON.stringify(JSON.parse(input));
  if (mode === "JSON → YAML") return jsonToYaml(JSON.parse(input));
  const result = JSON.stringify(yamlToJson(input), null, 2);
  if (result === undefined) throw new Error("Enter a JSON or YAML document.");
  return result;
}
