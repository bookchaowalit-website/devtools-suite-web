import { test } from "node:test";
import assert from "node:assert/strict";
import { SUBDOMAIN_REDIRECTS, redirectForHost } from "../lib/redirects.ts";
import { TOOLS } from "../lib/tools.ts";

test("every ported tool has exactly one former subdomain", () => {
  const paths = Object.values(SUBDOMAIN_REDIRECTS).sort();
  assert.deepEqual(paths, TOOLS.map((tool) => `/${tool.slug}`).sort());
});

test("host lookup ignores case and port", () => {
  assert.equal(redirectForHost("Base64.BookChaowalit.com:443"), "/base64");
  assert.equal(redirectForHost("devtools.bookchaowalit.com"), undefined);
});
