// Minimal vitest-style `expect` on top of node:assert, so the tools' original
// unit tests run under `node --test` without a test framework dependency.
import assert from "node:assert/strict";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function matchesSubset(actual: unknown, expected: unknown): boolean {
  if (Array.isArray(expected)) {
    return Array.isArray(actual) && actual.length === expected.length && expected.every((item, i) => matchesSubset(actual[i], item));
  }
  if (isObject(expected)) {
    return isObject(actual) && Object.entries(expected).every(([key, value]) => matchesSubset(actual[key], value));
  }
  return Object.is(actual, expected);
}

export function expect(actual: unknown) {
  return {
    toBe(expected: unknown) { assert.strictEqual(actual, expected); },
    toEqual(expected: unknown) { assert.deepStrictEqual(actual, expected); },
    toBeNaN() { assert.ok(Number.isNaN(actual), `expected ${String(actual)} to be NaN`); },
    toBeCloseTo(expected: number, digits = 2) {
      const diff = Math.abs((actual as number) - expected);
      assert.ok(diff < Math.pow(10, -digits) / 2, `expected ${String(actual)} to be close to ${expected} (${digits} digits)`);
    },
    toHaveLength(length: number) { assert.strictEqual((actual as { length: number }).length, length); },
    toHaveProperty(key: string, value?: unknown) {
      assert.ok(isObject(actual) && key in actual, `expected object to have property ${key}`);
      if (arguments.length > 1) assert.deepStrictEqual((actual as Record<string, unknown>)[key], value);
    },
    toMatch(pattern: RegExp | string) {
      assert.ok(typeof pattern === "string" ? String(actual).includes(pattern) : pattern.test(String(actual)), `expected ${String(actual)} to match ${String(pattern)}`);
    },
    toMatchObject(expected: unknown) {
      assert.ok(matchesSubset(actual, expected), `expected ${JSON.stringify(actual)} to match object ${JSON.stringify(expected)}`);
    },
  };
}
