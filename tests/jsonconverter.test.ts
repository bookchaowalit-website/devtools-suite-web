import assert from "node:assert/strict";
import { test } from "vitest";
import { describeProblem, offsetOf, transformDocument, jsonToYaml, yamlToJson } from "@/lib/jsonconverter/conversion";

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

test("indent option: 2 spaces, 4 spaces or a tab", () => {
  const source = '{"a":[1]}';
  assert.equal(transformDocument(source, "PRETTY", "4"), '{\n    "a": [\n        1\n    ]\n}');
  assert.equal(transformDocument(source, "PRETTY", "tab"), '{\n\t"a": [\n\t\t1\n\t]\n}');
  assert.equal(transformDocument("a:\n  - 1", "YAML → JSON", "4"), '{\n    "a": [\n        1\n    ]\n}');
  assert.equal(transformDocument('{"a":{"b":1}}', "JSON → YAML", "4"), "a:\n    b: 1");
});

test("errors say the line and column and give the offset to jump to", () => {
  const input = '{\n  "a": 1\n  "b": 2\n}';
  let problem;
  try { JSON.parse(input); } catch (cause) { problem = describeProblem(input, cause); }
  assert.ok(problem);
  assert.match(problem.message, /^Line 3, column 3: Expected ',' or '}' after property value\.$/);
  assert.equal(problem.line, 3);
  assert.equal(input.slice(problem.offset ?? 0, (problem.offset ?? 0) + 3), '"b"');
  try { JSON.parse("[1, 2"); } catch (cause) { assert.match(describeProblem("[1, 2", cause).message, /^Line 1, column 6: /); }
  assert.match(describeProblem("{", new SyntaxError("Unexpected end of JSON input")).message, /^Line 1, column 2: the JSON ends too early/);
  try { yamlToJson("a: [1, 2"); } catch (cause) { const yaml = describeProblem("a: [1, 2", cause); assert.match(yaml.message, /^Line \d+, column \d+: /); assert.notEqual(yaml.line, null); }
  assert.equal(offsetOf("ab\ncd", 2, 2), 4);
  // Older engines only say "at position N".
  assert.deepEqual(describeProblem("[1,]", new SyntaxError("Unexpected token ] in JSON at position 3")).line, 1);
});
