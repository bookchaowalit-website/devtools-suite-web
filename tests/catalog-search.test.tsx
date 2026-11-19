import { readFileSync } from "node:fs";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ToolCatalog } from "@/components/tool-catalog";
import Catalog from "@/app/page";
import { filterTools, TOOL_GROUPS, TOOLS, toolPath } from "@/lib/tools";

const ENTRIES = TOOLS.map(({ slug, name, description, keywords, group }) => ({ slug, name, description, keywords, group, path: toolPath({ slug }) }));

describe("filterTools", () => {
  it("matches name and description, case-insensitive, every word", () => {
    expect(filterTools(TOOLS, "").length).toBe(TOOLS.length);
    expect(filterTools(TOOLS, "   ").length).toBe(TOOLS.length);
    expect(filterTools(TOOLS, "REGEX").map((tool) => tool.slug)).toEqual(["regex"]);
    expect(filterTools(TOOLS, "beam").map((tool) => tool.slug)).toEqual(["engineering-calc"]);
    expect(filterTools(TOOLS, "json yaml").map((tool) => tool.slug)).toEqual(["jsonconverter"]);
    expect(filterTools(TOOLS, "nothing-like-this")).toEqual([]);
  });

  it("finds the tool for whole task phrases, joining words and abbreviations included", () => {
    const find = (query: string) => filterTools(TOOLS, query).map((tool) => tool.slug);
    expect(find("JSON to YAML")).toEqual(["jsonconverter"]);
    expect(find("yaml to json")).toEqual(["jsonconverter"]);
    expect(find("hex to decimal")).toEqual(["number-converter"]);
    expect(find("binary to hex")).toEqual(["number-converter"]);
    expect(find("text to base64")).toEqual(["base64"]);
    expect(find("sha256 checksum")).toEqual(["hashgen"]);
    expect(find("crontab")).toEqual(["cron"]);
    expect(find("pretty print json")).toEqual(["jsonconverter"]);
    expect(find("compare two texts")).toEqual(["diffchecker"]);
    // A query of joining words only is still matched literally, not treated as "show everything".
    expect(find("to").length).toBeLessThan(TOOLS.length);
  });

  it("the catalog filters on keywords too", () => {
    const html = renderToString(<ToolCatalog tools={ENTRIES} initialQuery="hex to decimal" />);
    expect(html).toContain('href="/number-converter"');
    expect(html).toContain(">1 of 17 tools</p>");
  });

  it("every description says plainly what the tool does", () => {
    for (const tool of TOOLS) {
      expect(tool.description.length, tool.slug).toBeGreaterThan(40);
      expect(tool.description, tool.slug).not.toMatch(/specimen|proof desk|instrument|illustrative/i);
    }
  });
});

describe("ToolCatalog", () => {
  it("renders a labelled search field and every card on the server", () => {
    const html = renderToString(<ToolCatalog tools={ENTRIES} />);
    expect(html).toContain('<label for="tool-search">Search tools</label>');
    expect(html).toMatch(/id="tool-search"[^>]*type="search"/);
    expect(html).toContain(`>${TOOLS.length} tools</p>`);
    for (const tool of ENTRIES) expect(html).toContain(`href="${tool.path}"`);
  });

  it("filters the cards and shows the count of matches", () => {
    const html = renderToString(<ToolCatalog tools={ENTRIES} initialQuery="cron" />);
    expect(html).toContain('href="/cron"');
    expect(html).not.toContain('href="/base64"');
    expect(html).toContain(">1 of 17 tools</p>");
  });

  it("shows an empty state with a Clear search button when nothing matches", () => {
    const html = renderToString(<ToolCatalog tools={ENTRIES} initialQuery="zzz" />);
    expect(html).not.toContain("catalog-grid");
    expect(html).toContain("No tool matches “<!-- -->zzz<!-- -->”");
    expect(html).toContain(">Clear search</button>");
  });
});

describe("suite header on phones", () => {
  it("keeps the bookchaowalit.com hub link visible and hides only the duplicate All tools link", () => {
    const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
    const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
    expect(css).not.toMatch(/\.suite-hub\s*\{\s*display:\s*none/);
    expect(css).toMatch(/\.suite-home\s*\{\s*display:\s*none/);
    const homeLink = readFileSync(new URL("../components/suite-home-link.tsx", import.meta.url), "utf8");
    expect(layout).toContain("<SuiteHomeLink />");
    expect(homeLink).toContain('className="suite-home">All tools</Link>');
    // On the home page the link would point at the page itself, beside the brand link: it is left out there.
    expect(homeLink).toMatch(/if \(pathname === "\/"\) return null;/);
    expect(layout).toContain('href="https://bookchaowalit.com/" className="suite-hub"');
  });
});

describe("home page grouping", () => {
  it("uses a focusable main landmark for the skip link", () => {
    expect(renderToString(<Catalog />)).toMatch(/^<main id="main" tabindex="-1" class="catalog">/);
  });

  it("lists the 17 cards under job headings, every tool in exactly one known group", () => {
    const html = renderToString(<ToolCatalog tools={ENTRIES} />);
    for (const group of TOOL_GROUPS) expect(html).toContain(`id="group-${group.id}"`);
    expect(html).not.toContain('id="group-other"');
    for (const tool of TOOLS) expect(TOOL_GROUPS.some((group) => group.id === tool.group), tool.slug).toBe(true);
    expect(html.match(/<h3>/g)?.length).toBe(TOOLS.length);
  });

  it("a search keeps only the sections that have a match", () => {
    const html = renderToString(<ToolCatalog tools={ENTRIES} initialQuery="cron" />);
    expect(html).toContain('id="group-time"');
    expect(html).not.toContain('id="group-encode"');
  });

  it("the card path is muted, not link blue, and the h1 is not the brand name again", () => {
    const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
    expect(css).toMatch(/\.catalog-card code \{[^}]*color: var\(--wb-muted\)/);
    const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
    expect(page).toContain("<h1>Developer tools that run in your browser</h1>");
  });
});
