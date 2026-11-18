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

// The page's own sample lost the space inside "Hello, " (UX review 2026-11-18): strings are never touched.
test("spaces, // and /* inside strings and template literals survive", async () => {
  const { mayHaveRegexLiteral } = await import("@/lib/minifier/minify");
  assert.equal(minify("js", SAMPLES.js), 'function greet(name){const message="Hello, "+name;return message;}');
  assert.equal(minify("js", "const url = 'https://a.b/c'; // note\nconst t = `a  ${ b }  c`;"), "const url='https://a.b/c';const t=`a  ${ b }  c`;");
  assert.equal(minify("js", 'const s = "a \\" /* not */ b";'), 'const s="a \\" /* not */ b";');
  assert.equal(minify("css", '.a::before { content: ", "; font-family: "Open  Sans"; }'), '.a::before{content:", ";font-family:"Open  Sans";}');
  assert.equal(mayHaveRegexLiteral("const re = /a b/g;"), true);
  assert.equal(mayHaveRegexLiteral("const half = a / 2; // c"), false);
});
