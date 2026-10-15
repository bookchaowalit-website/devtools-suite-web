import assert from "node:assert/strict";
import { test } from "node:test";
import { clamp, hexToRgb, rgbToHex, rgbToHsl, hslToRgb, hslToHex } from "../lib/colorpicker/conversion.ts";
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
test("HSL forward conversion reflects primary colors, greys, and lightness", () => {
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

test("HSL converts black, white and all six hue sectors to RGB and HEX", () => {
  for (const [h, s, l, hex] of [
    [0, 0, 0, "#000000"], [0, 0, 100, "#ffffff"],
    [0, 100, 50, "#ff0000"], [60, 100, 50, "#ffff00"], [120, 100, 50, "#00ff00"],
    [180, 100, 50, "#00ffff"], [240, 100, 50, "#0000ff"], [300, 100, 50, "#ff00ff"],
    [210, 50, 40, "#336699"],
  ] as const) {
    assert.deepEqual(hslToRgb(h, s, l), hexToRgb(hex));
    assert.equal(hslToHex(h, s, l), hex);
  }
});

test("HSL hue wraps and saturation/lightness clamp to their supported range", () => {
  assert.deepEqual(hslToRgb(-120, 100, 50), { r: 0, g: 0, b: 255 });
  assert.equal(hslToHex(720, 100, 50), "#ff0000");
  assert.equal(hslToHex(360, 100, 50), "#ff0000");
  assert.equal(hslToHex(120, 120, 150), "#ffffff");
  assert.equal(hslToHex(120, -20, -10), "#000000");
  assert.equal(hslToHex(270, 0, 50), "#808080");
  for (const values of [[NaN, 50, 50], [30, Infinity, 50], [30, 50, -Infinity]]) {
    assert.throws(() => hslToRgb(values[0], values[1], values[2]), /finite/i);
  }
});

test("HEX/RGB to rounded HSL and back retain colors within four 8-bit channel levels", () => {
  for (const hex of ["#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#808080", "#123456", "#4f46e5", "#c69d41", "#2f8e77", "#c080ad"]) {
    const original = hexToRgb(hex)!;
    const hsl = rgbToHsl(original.r, original.g, original.b);
    const result = hexToRgb(hslToHex(hsl.h, hsl.s, hsl.l))!;
    for (const channel of ["r", "g", "b"] as const) {
      assert.ok(Math.abs(result[channel] - original[channel]) <= 4, hex + " channel " + channel);
    }
  }
});

test("chromatic midrange HSL round trips through RGB and HEX within one displayed unit", () => {
  for (const [h, s, l] of [[210, 50, 40], [27, 42, 63], [151, 71, 38], [283, 53, 61]]) {
    const rgb = hexToRgb(hslToHex(h, s, l))!;
    assert.deepEqual(rgb, hslToRgb(h, s, l));
    const result = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const hueDifference = Math.abs(result.h - h);
    assert.ok(Math.min(hueDifference, 360 - hueDifference) <= 1);
    assert.ok(Math.abs(result.s - s) <= 1);
    assert.ok(Math.abs(result.l - l) <= 1);
  }
});

test("a representative RGB cube stays within rounded-HSL quantization tolerance", () => {
  // Existing UI HSL rounds degrees and percentages to integers, losing precision.
  for (let r = 0; r <= 255; r += 17) for (let g = 0; g <= 255; g += 17) for (let b = 0; b <= 255; b += 17) {
    const hsl = rgbToHsl(r, g, b);
    const result = hslToRgb(hsl.h, hsl.s, hsl.l);
    assert.ok(Math.abs(result.r - r) <= 4 && Math.abs(result.g - g) <= 4 && Math.abs(result.b - b) <= 4);
  }
});
