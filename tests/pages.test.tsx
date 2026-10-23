import { readFileSync } from "node:fs";
import type { ComponentType } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Catalog from "@/app/page";
import { POST } from "@/app/api/snippets/mcp/route";
import { SNIPPETS } from "@/lib/snippets/catalog";
import { TOOLS, toolPath } from "@/lib/tools";

// The (tools) route group's parentheses are glob syntax, so match every page and keep that group's.
const allPages = import.meta.glob<{ default: ComponentType }>("../app/**/page.tsx", { eager: true });
const pages = Object.fromEntries(Object.entries(allPages).filter(([path]) => path.startsWith("../app/(tools)/")));
const pageFor = (slug: string) => pages[`../app/(tools)/${slug}/page.tsx`]?.default;

describe("catalog page", () => {
  it("links every tool with its route and the nothing-is-uploaded notice", () => {
    const html = renderToString(<Catalog />);
    expect(html).toMatch(new RegExp(`${TOOLS.length}(<!-- -->)? developer tools in one place.`));
    expect(html).toContain("nothing you type is uploaded");
    for (const tool of TOOLS) {
      expect(html).toContain(tool.name);
      expect(html).toContain(`href="${toolPath(tool)}"`);
    }
  });
});

describe("tool pages", () => {
  it("there is exactly one page per catalog entry (17 routes)", () => {
    expect(Object.keys(pages).length).toBe(TOOLS.length);
    expect(TOOLS.length).toBe(17);
  });

  for (const tool of TOOLS) {
    it(`/${tool.slug} renders on the server and its layout's canonical is its own route`, () => {
      const Page = pageFor(tool.slug);
      expect(Page, `missing app/(tools)/${tool.slug}/page.tsx`).toBeTypeOf("function");
      const html = renderToString(<Page />);
      expect(html.length).toBeGreaterThan(500);
      const layout = readFileSync(new URL(`../app/(tools)/${tool.slug}/layout.tsx`, import.meta.url), "utf8");
      expect(layout).toContain(`canonical: "${toolPath(tool)}"`);
    });
  }
});

describe("POST /api/snippets/mcp", () => {
  const post = (body: string) => POST(new Request("https://example.test/api/snippets/mcp", { method: "POST", body }));

  it("serves the same snippets the page shows and echoes the id", async () => {
    const response = await post(JSON.stringify({ jsonrpc: "2.0", id: 9, method: "tools/call", params: { name: "get_all" } }));
    const json = await response.json();
    expect(json.id).toBe(9);
    expect(json.result.content[0].text).toContain(SNIPPETS[0].title);
  });

  it("returns 400 for a body that is not JSON and 202 for notifications", async () => {
    const bad = await post("{");
    expect(bad.status).toBe(400);
    expect((await bad.json()).error.code).toBe(-32700);
    expect((await post(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }))).status).toBe(202);
  });
});
