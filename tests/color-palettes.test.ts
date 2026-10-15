import assert from "node:assert/strict";
import { test } from "node:test";
import { cssTokens, tailwindTokens, jsonTokens } from "../lib/color-palettes/export.ts";
const palette = { name: "Ocean", note: "study", colors: ["#023E8A", "#90E0EF"] };
test("exports numbered CSS custom properties in palette order", () => {
  assert.equal(cssTokens(palette), ":root {\n  --color-1: #023E8A;\n  --color-2: #90E0EF;\n}");
});
test("exports lowercased Tailwind color keys", () => {
  assert.equal(tailwindTokens(palette), 'colors: {\n  ocean-1: "#023E8A",\n  ocean-2: "#90E0EF",\n}');
});
test("exports a JSON object without UI-only notes or changing the palette", () => {
  const before = structuredClone(palette);
  assert.deepEqual(JSON.parse(jsonTokens(palette)), { name: "Ocean", colors: palette.colors });
  assert.equal(jsonTokens(palette), JSON.stringify({ name: "Ocean", colors: palette.colors }, null, 2));
  assert.deepEqual(palette, before);
});
