import assert from "node:assert/strict";
import { test } from "vitest";
import { escapeHtml, renderMarkdown } from "@/lib/markdown-editor/render";

test("renders each supported block and inline construct", () => {
  assert.equal(renderMarkdown("# One\n## Two\n### Three"), "<h1>One</h1><h2>Two</h2><h3>Three</h3>");
  assert.equal(renderMarkdown("**bold** *italic* `code`"), "<p><strong>bold</strong> <em>italic</em> <code>code</code></p>");
  assert.equal(renderMarkdown("> quote\n- first\n- second\n\nparagraph"), "<blockquote>quote</blockquote><ul><li>first</li><li>second</li></ul><br /><p>paragraph</p>");
  assert.equal(renderMarkdown("```\n<a>\n```"), "<pre><code>&lt;a&gt;\n</code></pre>");
  assert.equal(renderMarkdown("```\nopen"), "<pre><code>open\n</code></pre>");
});
test("escapes raw HTML and attribute quotes", () => {
  assert.equal(escapeHtml('<a x="y">&'), "&lt;a x=&quot;y&quot;&gt;&amp;");
  const output = renderMarkdown('<script>alert("hi")</script>');
  assert.ok(output.includes("&lt;script&gt;"));
  assert.ok(!output.includes("<script>"));
});
test("preserves normal absolute, relative and fragment links", () => {
  for (const url of ["https://example.com?a=1&b=2", "http://example.com", "mailto:book@example.com", "/docs", "./guide", "../guide", "guide/start", "#section", "?page=2"]) {
    const output = renderMarkdown(`[read](${url})`);
    assert.ok(output.includes('<a href="'), url);
    assert.ok(output.includes('rel="noreferrer">read</a>'), url);
  }
});
test("rejects script schemes including case, encoding and whitespace variants", () => {
  for (const url of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", " javascript:alert(1)", "java\tscript:alert(1)", "java\nscript:alert(1)", "%6aavascript:alert(1)", "java%73cript%3Aalert(1)", "&#106;avascript:alert(1)", "javascript&#58;alert(1)", "data:text/html,<script>alert(1)</script>", "vbscript:msgbox(1)"]) {
    const output = renderMarkdown(`[read](${url})`);
    assert.ok(!output.includes('<a '), url);
    assert.ok(!output.includes('href='), url);
  }
});

test("numbered lists, nesting, headings 4–6 and tables", () => {
  assert.equal(renderMarkdown("1. one\n2. two"), "<ol><li>one</li><li>two</li></ol>");
  assert.equal(renderMarkdown("3. three\n4. four"), '<ol start="3"><li>three</li><li>four</li></ol>');
  assert.equal(renderMarkdown("- a\n  - b\n  - c\n- d"), "<ul><li>a<ul><li>b</li><li>c</li></ul></li><li>d</li></ul>");
  assert.equal(renderMarkdown("- a\n1. b"), "<ul><li>a</li></ul><ol><li>b</li></ol>");
  assert.equal(renderMarkdown("#### Four\n##### Five\n###### Six"), "<h4>Four</h4><h5>Five</h5><h6>Six</h6>");
  assert.equal(renderMarkdown("| A | B |\n| --- | :-: |\n| 1 | **2** |\n\nafter"), '<table><thead><tr><th scope="col">A</th><th scope="col">B</th></tr></thead><tbody><tr><td>1</td><td><strong>2</strong></td></tr></tbody></table><br /><p>after</p>');
});

test("a heading offset keeps the page's single h1 and the written size", () => {
  assert.equal(renderMarkdown("# Title\n## Part\n###### Deep", { headingOffset: 1 }), '<h2 class="md-h1">Title</h2><h3 class="md-h2">Part</h3><h6 class="md-h6">Deep</h6>');
});

test("a table ends where the next block starts", () => {
  assert.equal(renderMarkdown("| A |\n| - |\n| 1 |\n## C | D"), '<table><thead><tr><th scope="col">A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table><h2>C | D</h2>');
  assert.equal(renderMarkdown("| A |\n| - |\n- x | y"), '<table><thead><tr><th scope="col">A</th></tr></thead><tbody></tbody></table><ul><li>x | y</li></ul>');
});

test("an escaped pipe stays inside its table cell", () => {
  assert.equal(renderMarkdown("| A | B |\n| - | - |\n| a \\| b | next |"), '<table><thead><tr><th scope="col">A</th><th scope="col">B</th></tr></thead><tbody><tr><td>a | b</td><td>next</td></tr></tbody></table>');
});

test("a table needs as many separator cells as header cells", () => {
  assert.equal(renderMarkdown("| A | B |\n| - |\n| 1 | 2 |").includes("<table>"), false);
});

test("a huge table is cut at the cell cap with a note", async () => {
  const { MAX_TABLE_CELLS, MAX_TABLE_COLUMNS } = await import("@/lib/markdown-editor/render");
  const head = `|${" h |".repeat(1000)}`;
  const rule = `|${" - |".repeat(1000)}`;
  const body = Array.from({ length: 1000 }, () => "| a | b |").join("\n");
  const html = renderMarkdown(`${head}\n${rule}\n${body}`);
  assert.ok((html.match(/<t[hd]/g) ?? []).length <= MAX_TABLE_CELLS + MAX_TABLE_COLUMNS);
  assert.ok(html.length < 400_000, String(html.length));
  assert.match(html, /Preview shows the first 50 columns/);
});
