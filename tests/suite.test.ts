import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { describe, it } from "node:test";
import { redirectForHost, SUBDOMAIN_REDIRECTS } from "../lib/redirects.ts";
import { TOOLS, toolPath } from "../lib/tools.ts";

describe("tool registry", () => {
  it("has unique slugs and a route directory for each tool", () => {
    assert.equal(new Set(TOOLS.map((tool) => tool.slug)).size, TOOLS.length);
    for (const tool of TOOLS) {
      assert.match(tool.slug, /^[a-z0-9-]+$/);
      assert.ok(tool.description.length > 0, `${tool.slug} needs a description`);
      assert.ok(existsSync(new URL(`../app/(tools)/${tool.slug}/page.tsx`, import.meta.url)), `${tool.slug} page missing`);
      assert.ok(existsSync(new URL(`../app/(tools)/${tool.slug}/layout.tsx`, import.meta.url)), `${tool.slug} layout missing`);
    }
  });
});

describe("subdomain redirects", () => {
  it("maps every tool's former subdomain to its suite path", () => {
    for (const tool of TOOLS) assert.equal(SUBDOMAIN_REDIRECTS[tool.subdomain], toolPath(tool));
    assert.equal(Object.keys(SUBDOMAIN_REDIRECTS).length, TOOLS.length);
  });

  it("resolves hosts case-insensitively and ignores ports", () => {
    assert.equal(redirectForHost("Base64.bookchaowalit.com"), "/base64");
    assert.equal(redirectForHost("engineering.bookchaowalit.com:443"), "/engineering-calc");
    assert.equal(redirectForHost("unknown.bookchaowalit.com"), undefined);
    assert.equal(redirectForHost("constructor"), undefined);
  });
});
