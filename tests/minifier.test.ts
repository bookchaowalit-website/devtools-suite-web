import assert from "node:assert/strict";
import { test } from "vitest";
import { MODES, SAMPLES, minify } from "@/lib/minifier/minify";

test("every sample minifies to something shorter", () => {
  for (const mode of MODES) {
    const output = minify(mode, SAMPLES[mode]);
    assert.ok(output.length > 0 && output.length < SAMPLES[mode].length, mode);
  }
});

test("JSON is re-serialised and invalid JSON throws", () => {
  assert.equal(minify("json", '{ "a": [1, 2] }'), '{"a":[1,2]}');
  assert.throws(() => minify("json", "{ a: 1 }"));
});

test("CSS, HTML and JS drop comments and the space around punctuation", () => {
  assert.equal(minify("css", "/* c */ .a {\n  color: red;\n}"), ".a{color:red;}");
  assert.equal(minify("html", "<!-- c -->\n<p>\n  <b>x</b>\n</p>"), "<p><b>x</b></p>");
  assert.equal(minify("js", "// c\nconst a = 1;\nreturn a + 2;"), "const a=1;return a+2;");
});
