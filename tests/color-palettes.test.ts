import assert from "node:assert/strict";
import { test } from "vitest";
import { cssTokens, tailwindTokens, jsonTokens } from "@/lib/color-palettes/export";
const palette = { name: "Ocean", note: "study", colors: ["#023E8A", "#90E0EF"] };
test("exports numbered CSS custom properties in palette order", () => {
  assert.equal(cssTokens(palette), ":root {\n  --color-1: #023E8A;\n  --color-2: #90E0EF;\n}");
});
test("exports lowercased, quoted Tailwind color keys that parse as a JS object", () => {
  const output = tailwindTokens(palette);
  assert.equal(output, 'colors: {\n  "ocean-1": "#023E8A",\n  "ocean-2": "#90E0EF",\n}');
  assert.deepEqual(new Function(`return {${output}}`)(), { colors: { "ocean-1": "#023E8A", "ocean-2": "#90E0EF" } });
});
test("exports a JSON object without UI-only notes or changing the palette", () => {
  const before = structuredClone(palette);
  assert.deepEqual(JSON.parse(jsonTokens(palette)), { name: "Ocean", colors: palette.colors });
  assert.equal(jsonTokens(palette), JSON.stringify({ name: "Ocean", colors: palette.colors }, null, 2));
  assert.deepEqual(palette, before);
});
