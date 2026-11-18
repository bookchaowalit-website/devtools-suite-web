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
  assert.equal(minify("js", SAMPLES.js), 'function greet(name){const message="Hello, "+name;return message;}');
  assert.equal(minify("js", "const url = 'https://a.b/c'; // note\nconst t = `a  ${ b }  c`;"), "const url='https://a.b/c';const t=`a  ${ b }  c`;");
  assert.equal(minify("js", 'const s = "a \\" /* not */ b";'), 'const s="a \\" /* not */ b";');
  assert.equal(minify("css", '.a::before { content: ", "; font-family: "Open  Sans"; }'), '.a::before{content:", ";font-family:"Open  Sans";}');
});

// Codex review, 2026-11-19 (post-push round).
test("regular expression literals are kept, divisions are still minified", () => {
  assert.equal(minify("js", "function f() { return /foo (bar)/.test(x); }"), "function f(){return /foo (bar)/.test(x);}");
  assert.equal(minify("js", "const re = /a [/] b/g; const half = a / 2;"), "const re=/a [/] b/g;const half=a/2;");
  assert.equal(minify("js", "if (ok) x = y.split( /, +/ );"), "if(ok)x=y.split(/, +/);");
});

test("CSS comments never join or split selectors", () => {
  assert.equal(minify("css", ".a/**/.b { color: red; }"), ".a.b{color:red;}");
  assert.equal(minify("css", ".a /* c */ .b { color: red; }"), ".a .b{color:red;}");
});

test("a // comment ends at every JavaScript line terminator", () => {
  for (const end of ["\n", "\r", "\r\n", "\u2028", "\u2029"]) assert.equal(minify("js", `// Header${end}const x = 1;`), "const x=1;", JSON.stringify(end));
});

test("text inside nested template literals is kept", () => {
  const source = "const s = `outer ${ list.map((y) => `x ( ${ y } ) z`).join(\", \") } end`;";
  assert.equal(minify("js", source), source.replace("const s = ", "const s=").replace(/;$/, ";"));
});

// Codex review, 2026-11-19 (third round): division vs regex from the previous token, in linear time.
test("a division after a string, name or ) is never read as a regex", () => {
  assert.equal(minify("js", 'const q = "8" / 2; // note\nconst r = 1;'), 'const q="8"/2;const r=1;');
  assert.equal(minify("js", "const a = (b) / 2 / c; x = y[0] / 3;"), "const a=(b)/2/c;x=y[0]/3;");
  assert.equal(minify("js", "if (ok) /a (b)/.test(s);"), "if(ok)/a (b)/.test(s);");
  assert.equal(minify("js", "const n = 1.5 / x; return /x y/;"), "const n=1.5/x;return /x y/;");
});

test("many divisions minify in linear time", () => {
  const code = "x = x / 2;\n".repeat(20_000);
  const started = performance.now();
  assert.equal(minify("js", code), "x=x/2;".repeat(20_000));
  assert.ok(performance.now() - started < 1000, `${performance.now() - started} ms`);
});
