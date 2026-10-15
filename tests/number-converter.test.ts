import assert from "node:assert/strict";
import { test } from "node:test";
import { parseInteger } from "../lib/number-converter/conversion.ts";

test("parses all four supported bases and optional hexadecimal prefixes", () => {
  for (const [raw, radix] of [["1010", 2], ["12", 8], ["10", 10], ["a", 16], ["0xA", 16]] as const) assert.equal(parseInteger(raw, radix), BigInt(10));
});
test("preserves arbitrary precision and negative integers", () => {
  const value = BigInt("1234567890123456789012345678901234567890");
  for (const radix of [2, 8, 10, 16]) {
    assert.equal(parseInteger(value.toString(radix), radix), value);
    assert.equal(parseInteger(` -${value.toString(radix)} `, radix), -value);
  }
  assert.equal(parseInteger("-0xFF", 16), BigInt(-255));
  assert.equal(parseInteger("0", 10), BigInt(0));
});
test("rejects invalid digits instead of accepting a valid prefix", () => {
  for (const [raw, radix] of [["102", 2], ["8", 8], ["1e3", 10], ["ffg", 16], ["1.5", 10], ["", 10], ["-", 10], ["0x", 16]] as const) assert.throws(() => parseInteger(raw, radix), /digits allowed/);
});
