import assert from "node:assert/strict";
import { test } from "node:test";
import { clamp, hexToRgb, rgbToHex, rgbToHsl } from "../lib/colorpicker/conversion.ts";
test("HEX to RGB round trips normalize shorthand and case", () => {
  for (const [hex, expected] of [["#F00", "#ff0000"], ["0aB", "#00aabb"], ["#123456", "#123456"], ["000000", "#000000"], ["#FFFFFF", "#ffffff"]]) {
    const rgb = hexToRgb(hex)!;
    assert.equal(rgbToHex(rgb.r, rgb.g, rgb.b), expected);
  }
});
test("invalid HEX remains invalid", () => {
  for (const value of ["", "#", "#12", "#12345", "#1234567", "#gggggg", "#fff;"]) assert.equal(hexToRgb(value), null);
});
test("RGB clamps and rounds channels before formatting HEX", () => {
  assert.equal(rgbToHex(-5, 127.6, 300), "#0080ff");
  assert.equal(clamp(5, 0, 4), 4);
  assert.equal(clamp(-1, 0, 4), 0);
});
test("HSL reflects primary colors, greys, and lightness after HEX round trips", () => {
  for (const [hex, expected] of [
    ["#ff0000", { h: 0, s: 100, l: 50 }], ["#00ff00", { h: 120, s: 100, l: 50 }],
    ["#0000ff", { h: 240, s: 100, l: 50 }], ["#000000", { h: 0, s: 0, l: 0 }],
    ["#ffffff", { h: 0, s: 0, l: 100 }], ["#808080", { h: 0, s: 0, l: 50 }],
    ["#ff0080", { h: 330, s: 100, l: 50 }], ["#ff8080", { h: 0, s: 100, l: 75 }],
  ] as const) {
    const rgb = hexToRgb(hex)!;
    const roundTrip = hexToRgb(rgbToHex(rgb.r, rgb.g, rgb.b))!;
    assert.deepEqual(rgbToHsl(roundTrip.r, roundTrip.g, roundTrip.b), expected);
  }
});
