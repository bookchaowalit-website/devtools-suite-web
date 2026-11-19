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
  assert.equal(await minify("css", ".a\\> .b { color: red }"), ".a\\> .b{color:red}");
});
