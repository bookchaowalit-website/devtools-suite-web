import assert from "node:assert/strict";
import { test } from "node:test";
import { escapeHtml, renderMarkdown } from "../lib/markdown-editor/render.ts";

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
