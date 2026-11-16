import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { SITE_URL } from "@/lib/site";
import { TOOLS, toolPath } from "@/lib/tools";

describe("robots and sitemap", () => {
  it("use the suite's live origin", () => {
    expect(SITE_URL).toBe("https://devtools.bookchaowalit.com");
    expect(robots()).toEqual({ rules: { userAgent: "*", allow: "/" }, sitemap: `${SITE_URL}/sitemap.xml` });
  });

  it("list the catalog and all 17 tool routes", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toEqual([`${SITE_URL}/`, ...TOOLS.map((tool) => `${SITE_URL}${toolPath(tool)}`)]);
    expect(urls).toHaveLength(18);
  });
});

describe("tool Open Graph", () => {
  it("gives every tool page its own og:url, since a page openGraph replaces the root one", async () => {
    const { toolOpenGraph, SUITE_NAME } = await import("@/lib/site");
    expect(toolOpenGraph("base64", "Base64", "Encode text.")).toEqual({
      type: "website", siteName: SUITE_NAME, title: `Base64 | ${SUITE_NAME}`, description: "Encode text.", url: "/base64",
    });
    for (const tool of TOOLS) {
      const layout = await import(`@/app/(tools)/${tool.slug}/layout`);
      expect(layout.metadata.openGraph.url).toBe(`/${tool.slug}`);
    }
  });
});
