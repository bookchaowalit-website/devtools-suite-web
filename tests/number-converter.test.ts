import assert from "node:assert/strict";
import { expect, test } from "vitest";
import { parseInteger } from "@/lib/number-converter/conversion";
import { copyValue, editField, groupDigits, initialFields, shownValue } from "@/lib/number-converter/fields";

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


test("only the field being edited keeps invalid text; the others show the last valid number", () => {
  let state = initialFields(BigInt(10));
  state = editField(state, "dec", "x");
  assert.equal(shownValue(state, "dec"), "x");
  assert.equal(state.draft?.base, "dec");
  assert.equal(shownValue(state, "hex"), "a");
  // Moving on to another field with invalid text: the first one goes back to the valid number, unmarked
  // text never lingers there.
  state = editField(state, "hex", "z");
  assert.equal(state.draft?.base, "hex");
  assert.equal(shownValue(state, "hex"), "z");
  assert.equal(shownValue(state, "dec"), "10");
  assert.equal(shownValue(state, "bin"), "1010");
  assert.match(state.draft?.message ?? "", /digits allowed/);
});

test("a valid edit clears the draft and syncs all four; clearing a field empties them all", () => {
  let state = editField(initialFields(BigInt(10)), "bin", "102");
  state = editField(state, "hex", "ff");
  assert.equal(state.draft, null);
  assert.deepEqual(state.valid, { bin: "11111111", oct: "377", dec: "255", hex: "ff" });
  state = editField(state, "oct", "  ");
  assert.equal(state.draft, null);
  assert.deepEqual(state.valid, { bin: "", oct: "", dec: "", hex: "" });
});

test("binary and hex read in nibbles; separators and prefixes are accepted back", () => {
  expect(groupDigits("11111111", "bin")).toBe("1111 1111");
  expect(groupDigits("-ffffffffffffffff", "hex")).toBe("-ffff ffff ffff ffff");
  expect(groupDigits("101", "bin")).toBe("101");
  expect(groupDigits("1234567", "dec")).toBe("1234567");
  expect(parseInteger("1111 1111", 2)).toBe(BigInt(255));
  expect(parseInteger("0b1010", 2)).toBe(BigInt(10));
  expect(parseInteger("0o17", 8)).toBe(BigInt(15));
  expect(parseInteger("-0xff_ff", 16)).toBe(BigInt(-65535));
  expect(copyValue("ff", "hex", true)).toBe("0xff");
  expect(copyValue("-1010", "bin", true)).toBe("-0b1010");
  expect(copyValue("12", "dec", true)).toBe("12");
  expect(copyValue("ff", "hex", false)).toBe("ff");
});
