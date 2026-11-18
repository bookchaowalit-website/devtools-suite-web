import assert from "node:assert/strict";
import { test } from "vitest";
import { createHash } from "node:crypto";
import { algorithms, compareDigest, digestBytes, formatDigest, makeDigest } from "@/lib/hashgen/digest";

const vectors = {
  "SHA-1": "a9993e364706816aba3e25717850c26c9cd0d89d",
  "SHA-256": "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  "SHA-384": "cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7",
  "SHA-512": "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f",
};
for (const algorithm of algorithms) {
  test(`${algorithm} matches the published abc vector`, async () => {
    assert.equal(await makeDigest(algorithm, "abc"), vectors[algorithm]);
  });
  test(`${algorithm} hashes empty and UTF-8 text without changing bytes`, async () => {
    for (const value of ["", "สวัสดี 🚀", "line\nline"]) {
      assert.equal(await makeDigest(algorithm, value), createHash(algorithm.replace("-", "").toLowerCase()).update(value).digest("hex"));
    }
  });
}

test("formats a digest as lowercase hex, uppercase hex or Base64, for text and bytes alike", async () => {
  const bytes = await digestBytes("SHA-256", "hello world");
  assert.equal(formatDigest(bytes), "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9");
  assert.equal(formatDigest(bytes, "HEX"), "B94D27B9934D3E08A52E52D7DA7DABFAC484EFE37A5380EE9088F7ACE2EFCDE9");
  assert.equal(formatDigest(bytes, "base64"), "uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek=");
  assert.deepEqual(await digestBytes("SHA-256", new TextEncoder().encode("hello world")), bytes);
});

test("compares an expected checksum in any case or format", async () => {
  const bytes = await digestBytes("SHA-256", "hello world");
  assert.equal(compareDigest("", bytes), "empty");
  assert.equal(compareDigest(" B94D27B9934D3E08A52E52D7DA7DABFAC484EFE37A5380EE9088F7ACE2EFCDE9 ", bytes), "match");
  assert.equal(compareDigest("sha256:b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9", bytes), "match");
  assert.equal(compareDigest("uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek=", bytes), "match");
  assert.equal(compareDigest("b94d27", bytes), "mismatch");
});
