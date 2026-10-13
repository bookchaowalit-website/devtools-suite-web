import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Base64Error, decodeBase64, encodeBase64, normalizeBase64, plural, textStats } from "../lib/base64/base64.ts";

describe("encodeBase64", () => {
  it("encodes ASCII and multi-byte UTF-8 text", () => {
    assert.equal(encodeBase64("Hello, portfolio!"), "SGVsbG8sIHBvcnRmb2xpbyE=");
    assert.equal(encodeBase64("สวัสดี"), "4Liq4Lin4Lix4Liq4LiU4Li1");
    assert.equal(encodeBase64("🚀"), "8J+agA==");
  });

  it("supports the URL-safe alphabet without padding", () => {
    assert.equal(encodeBase64("??>", { urlSafe: true }), "Pz8-");
    assert.equal(encodeBase64("🚀", { urlSafe: true }), "8J-agA");
  });
});

describe("decodeBase64", () => {
  it("round-trips UTF-8 text", () => {
    for (const text of ["", "a", "ab", "abc", "สวัสดี 🚀", "line1\nline2"]) {
      assert.equal(decodeBase64(encodeBase64(text)), text);
      assert.equal(decodeBase64(encodeBase64(text, { urlSafe: true })), text);
    }
  });

  it("ignores whitespace and wrapped lines", () => {
    assert.equal(decodeBase64("  SGVsbG8s\n IHBvcnRmb2xpbyE=\n"), "Hello, portfolio!");
  });

  it("rejects invalid characters, length, and padding", () => {
    assert.throws(() => decodeBase64("not base64!"), Base64Error);
    assert.throws(() => decodeBase64("abcde"), Base64Error);
    assert.throws(() => normalizeBase64("ab=c"), Base64Error);
    assert.throws(() => normalizeBase64("abc=="), Base64Error);
  });

  it("rejects bytes that are not valid UTF-8", () => {
    assert.throws(() => decodeBase64("/w=="), /not valid UTF-8/);
  });
});

describe("edge cases", () => {
  it("ignores zero-width characters and BOM pasted from web pages", () => {
    assert.equal(decodeBase64("﻿SGVs​bG8=‍"), "Hello");
  });

  it("refuses to encode text with an unpaired surrogate instead of silently changing it", () => {
    assert.throws(() => encodeBase64("a\uD83D"), Base64Error);
    assert.throws(() => encodeBase64("\uDE00b"), Base64Error);
    assert.equal(decodeBase64(encodeBase64("ok 😀")), "ok 😀");
  });

  it("counts user-perceived characters and UTF-8 bytes, not UTF-16 code units", () => {
    assert.deepEqual(textStats("😀"), { characters: 1, bytes: 4 });
    assert.deepEqual(textStats("👨‍👩‍👧"), { characters: 1, bytes: 18 });
    assert.deepEqual(textStats("ที่"), { characters: 1, bytes: 9 });
    assert.deepEqual(textStats(""), { characters: 0, bytes: 0 });
  });

  it("pluralizes counter labels", () => {
    assert.equal(plural(1, "byte"), "1 byte");
    assert.equal(plural(0, "byte"), "0 bytes");
  });
});
