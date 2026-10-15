import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { algorithms, makeDigest } from "../lib/hashgen/digest.ts";

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
