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

// terser and csso (2026-11-19) replace the hand-written tokenizer; these check the cases it kept getting wrong.
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

test("CSS keeps selector meaning and escaped characters", async () => {
  assert.equal(await minify("css", ".a/**/.b { color: red; }"), ".a.b{color:red}");
  assert.equal(await minify("css", ".a .b > .c { content: \", \"; }"), '.a .b>.c{content:", "}');
  // Any escape takes the light path, which keeps the escaped character and the space after it.
  assert.equal(await minify("css", ".a\\> .b { color: red }"), ".a\\> .b{color: red}");
});

// Codex review, 2026-11-19 (last round).
test("CSS that csso would cut is refused with an error, never returned short", async () => {
  for (const css of [".card { color: red; & .title { color: blue; } }", "body { color: red; & > a { color: green } }"]) {
    await assert.rejects(() => minify("css", css), (error: unknown) => error instanceof MinifyError && /would drop \d+ block/.test(error.message), css);
  }
  assert.equal(await minify("css", "@media (min-width: 1px) { .a { color: red } }"), "@media (min-width:1px){.a{color:red}}");
  // An empty @layer block takes the light path and is kept.
  assert.equal(await minify("css", "@layer base {}\n.a { color: red }"), "@layer base{}.a{color: red}");
});

test("JavaScript modules with import, export and top-level await minify", async () => {
  assert.equal(await minify("js", "export const response = await fetch('/api');"), 'export const response=await fetch("/api");');
  assert.equal(await minify("js", "import { a } from './a.js';\nexport default a;"), 'import{a}from"./a.js";export default a;');
});

// Codex review, 2026-11-19 (P1): csso drops @import after @layer and strips units from zero in math functions.
test("@import after @layer is kept (light minify, with a reason)", async () => {
  const { cssLightReason } = await import("@/lib/minifier/minify");
  const css = '@layer reset, base;\n@import url("base.css") layer(base);\n/* c */\n.a {\n  color: red;\n}';
  assert.equal(await minify("css", css), '@layer reset, base;@import url("base.css") layer(base);.a{color: red}');
  assert.match(cssLightReason(css), /@import or @layer/);
});

test("zero keeps its unit inside calc, min, max, clamp and hypot, in any case", async () => {
  const { cssLightReason } = await import("@/lib/minifier/minify");
  const css = ".a {\n  width: CALC(100% - 0px);\n  margin: max(0px, 1em);\n  top: min(0%, 2px);\n  left: clamp(0px, 1vw, 3px);\n  height: hypot(0px, 20px);\n}";
  const out = await minify("css", css);
  for (const kept of ["CALC(100% - 0px)", "max(0px, 1em)", "min(0%, 2px)", "clamp(0px, 1vw, 3px)", "hypot(0px, 20px)"]) assert.ok(out.includes(kept), `${kept} in ${out}`);
  assert.match(cssLightReason(css), /calc\(\)/);
  // Without @import, @layer or math functions csso still does the full job.
  assert.equal(cssLightReason(".a { padding: 0px }"), "");
  assert.equal(await minify("css", ".a { padding: 0px }"), ".a{padding:0}");
});

test("the light minify never joins or splits tokens around comments and keeps strings", async () => {
  const { lightCss } = await import("@/lib/minifier/minify");
  assert.equal(lightCss(".a/**/.b { margin: 1px/**/2px; content: \"a  /* b */\"; }"), '.a/**/.b{margin: 1px/**/2px;content: "a  /* b */"}');
  assert.equal(lightCss("a { color: red } /* x */ b { color: blue }"), "a{color: red}b{color: blue}");
});

// Codex review, 2026-11-19: the light CSS minify must never change string or url() contents.
test("strings and url() keep every character, including ;}, double spaces and /*", async () => {
  const { lightCss } = await import("@/lib/minifier/minify");
  assert.equal(lightCss('@import url("/styles/a;}.css");'), '@import url("/styles/a;}.css");');
  assert.equal(lightCss('.a { content: "a  b"; }'), '.a{content: "a  b"}');
  assert.equal(lightCss(".a { background: url(\"x y.png\"); }"), '.a{background: url("x y.png")}');
  assert.equal(lightCss(".a { background: url( x;}y.png ); }"), ".a{background: url( x;}y.png )}");
  assert.equal(lightCss('.a { content: "/* not a comment */"; } /* real */ .b { color: red; }'), '.a{content: "/* not a comment */"}.b{color: red}');
  assert.equal(lightCss(".a { content: 'it\\'s ;} here'; }"), ".a{content: 'it\\'s ;} here'}");
  // The full path for @layer CSS goes through the light minify too.
  assert.equal(await minify("css", '@layer a;\n@import url("/s/a;}.css") layer(a);'), '@layer a;@import url("/s/a;}.css") layer(a);');
});

test("the light-path check reads only code: strings, url() and comments cannot trigger or hide it", async () => {
  const { cssLightReason } = await import("@/lib/minifier/minify");
  assert.equal(cssLightReason('.a { content: "calc(0px)"; }'), "");
  assert.equal(cssLightReason(".a { background: url(calc(0px).png); } /* @import */"), "");
  assert.match(cssLightReason(".a { height: calc-size(auto, size + 0px); }"), /math function/);
  // An escaped function name (\\63 alc = calc) cannot be checked by name, so it takes the light path.
  assert.match(cssLightReason(".a { width: \\63 alc(100% - 0px); }"), /math function/);
  // Names that only end in a math word are not math functions.
  assert.equal(cssLightReason(".a { animation-name: my-min; }"), "");
  assert.equal(await minify("css", ".a { height: calc-size(auto, size + 0px); }"), ".a{height: calc-size(auto, size + 0px)}");
});
