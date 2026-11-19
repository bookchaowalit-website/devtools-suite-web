import assert from "node:assert/strict";
import { test } from "vitest";
import { MinifyError, MODES, SAMPLES, minify } from "@/lib/minifier/minify";

test("every sample minifies to something shorter", async () => {
  for (const mode of MODES) {
    const output = await minify(mode, SAMPLES[mode]);
    assert.ok(output.length > 0 && output.length < SAMPLES[mode].length, mode);
  }
});

test("JSON is re-serialised and invalid JSON throws", async () => {
  assert.equal(await minify("json", '{ "a": [1, 2] }'), '{"a":[1,2]}');
  await assert.rejects(() => minify("json", "{ a: 1 }"));
});

test("HTML drops comments and the space between tags", async () => {
  assert.equal(await minify("html", "<!-- c -->\n<p>\n  <b>x</b>\n</p>"), "<p><b>x</b></p>");
});

// terser (2026-11-19) replaces the hand-written JS tokenizer; these check the cases it kept getting wrong.
test("JavaScript keeps strings, templates and regular expressions, and tells division from a regex", async () => {
  assert.equal(await minify("js", SAMPLES.js), 'function greet(name){const message="Hello, "+name;return message}');
  const bodies = [
    'var q = "8" / 2; // note\nvar r = 1; return [q, r];',
    "var s = ' ', ok = true, m = 0; if (ok) /[ ]/.test(s) && (m = 1); return m;",
    "var i = 4; var d = i++ / 2; return [d, i];",
    "var x = '}'; var t = `a ${ /}/.test(x) ? `inner ( x )` : \"\" } b`; return t;",
    "// Header\u2028var y = 1; return y;",
  ];
  for (const body of bodies) {
    const source = `function f() { ${body} }`;
    const output = await minify("js", source);
    // The minified function returns exactly what the original returns.
    const run = (code: string) => new Function(`${code}; return f();`)();
    assert.deepEqual(run(output), run(source), `${source} -> ${output}`);
  }
});

test("a JavaScript parse error says the line and column", async () => {
  await assert.rejects(() => minify("js", "const a = 1;\nconst = 2;"), (error: unknown) => error instanceof MinifyError && error.line === 2 && /^Line 2, column \d+: /.test(error.message));
});


// Codex review, 2026-11-19 (last round).

test("JavaScript modules with import, export and top-level await minify", async () => {
  assert.equal(await minify("js", "export const response = await fetch('/api');"), 'export const response=await fetch("/api");');
  assert.equal(await minify("js", "import { a } from './a.js';\nexport default a;"), 'import{a}from"./a.js";export default a;');
});






// CSS (2026-11-19, final): comments and whitespace only, so no value, unit, selector or at-rule is ever rewritten.
test("CSS values and units are never rewritten", async () => {
  assert.equal(await minify("css", ".a {\n  flex-basis: 0%;\n  width: calc(100% - 0px);\n  height: hypot(0px, 20px);\n  padding: 0px;\n}"), ".a{flex-basis: 0%;width: calc(100% - 0px);height: hypot(0px, 20px);padding: 0px}");
  assert.equal(await minify("css", "@property --size {\n  syntax: '<length>';\n  inherits: false;\n  initial-value: 0px;\n}"), "@property --size{syntax: '<length>';inherits: false;initial-value: 0px}");
  assert.equal(await minify("css", '@layer reset, base;\n@import url("base.css") layer(base);'), '@layer reset, base;@import url("base.css") layer(base);');
  assert.equal(await minify("css", ".card { color: red; & .title { color: blue; } }"), ".card{color: red;& .title{color: blue}}");
});

test("backslash escapes are kept whole, inside strings or not", async () => {
  assert.equal(await minify("css", ".a\\;b {}"), ".a\\;b{}");
  assert.equal(await minify("css", ".a\\; b { }"), ".a\\; b{}");
  assert.equal(await minify("css", ".a\\:hover { color: red; }"), ".a\\:hover{color: red}");
  assert.equal(await minify("css", '.a::before { content: "\\""; }'), '.a::before{content: "\\""}');
  // A hex escape keeps the one space that ends it, and a real space after it survives too.
  assert.equal(await minify("css", ".\\31 0  .b { color: red }"), ".\\31 0 .b{color: red}");
  assert.equal(await minify("css", ".a\\}b { color: red; }"), ".a\\}b{color: red}");
});

test("strings, url() and comments", async () => {
  assert.equal(await minify("css", '@import url("/styles/a;}.css");'), '@import url("/styles/a;}.css");');
  assert.equal(await minify("css", '.a { content: "a  b /* x */"; background: url("x y.png"); }'), '.a{content: "a  b /* x */";background: url("x y.png")}');
  assert.equal(await minify("css", ".a { background: url( x;}y.png ); }"), ".a{background: url( x;}y.png )}");
  assert.equal(await minify("css", ".a/**/.b { margin: 1px/**/2px; }"), ".a/**/.b{margin: 1px/**/2px}");
  assert.equal(await minify("css", "a { color: red } /* x */ b { color: blue }"), "a{color: red}b{color: blue}");
});
