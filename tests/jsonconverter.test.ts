import assert from "node:assert/strict";
import { test } from "node:test";
import { transformDocument, jsonToYaml, yamlToJson } from "../lib/jsonconverter/conversion.ts";

test("formats and minifies valid JSON without changing its values", () => {
  const source = '{ "name": "book", "active": true, "count": 2 }';
  assert.equal(transformDocument(source, "PRETTY"), '{\n  "name": "book",\n  "active": true,\n  "count": 2\n}');
  assert.equal(transformDocument(source, "MINIFY"), '{"name":"book","active":true,"count":2}');
});
test("JSON and YAML round trip the page's nested sample and scalar types", () => {
  for (const value of [
    { project: "book-dev", active: true, tools: ["json", "yaml"] },
    { empty: "", truth: "true", nil: "null", number: "123", note: "a: b # comment", nested: { items: [{ id: 1, tags: ["x", "y"] }] } },
    [], {}, null, ["true", true, "123", 123, null],
  ]) {
    assert.deepEqual(yamlToJson(jsonToYaml(value)), value);
    assert.deepEqual(JSON.parse(transformDocument(transformDocument(JSON.stringify(value), "JSON → YAML"), "YAML → JSON")), value);
  }
});
test("reads ordinary YAML comments and nested mappings", () => {
  assert.deepEqual(yamlToJson('# demo\nproject: book\ntools:\n  - json\n  - yaml\nactive: true'), { project: "book", tools: ["json", "yaml"], active: true });
});
test("invalid JSON and YAML produce errors instead of silently changing data", () => {
  for (const mode of ["PRETTY", "MINIFY", "JSON → YAML"] as const) assert.throws(() => transformDocument('{bad', mode));
  assert.throws(() => transformDocument('items: [unfinished', "YAML → JSON"));
  assert.throws(() => transformDocument('key: one\nkey: two', "YAML → JSON"));
});

test("rejects non-finite YAML numbers at every depth instead of turning them into null", () => {
  for (const scalar of [".nan", ".NaN", ".inf", ".Inf", "-.inf", "+.inf"]) {
    for (const input of [scalar, `score: ${scalar}`, `items:\n  - ${scalar}`, `items:\n  - nested:\n      score: ${scalar}`]) {
      assert.throws(() => transformDocument(input, "YAML → JSON"), /non-finite|finite number/i, input);
    }
  }
});

test("keeps JSON-compatible YAML scalars and quoted non-finite text intact", () => {
  assert.deepEqual(JSON.parse(transformDocument('score: 1.25\nzero: 0\nnegative: -2\nflag: false\nempty: null\ntext: ".nan"\nitems: [".inf", 3]\nlargeText: 1e999', "YAML → JSON")), {
    score: 1.25, zero: 0, negative: -2, flag: false, empty: null, text: ".nan", items: [".inf", 3], largeText: "1e999",
  });
});
