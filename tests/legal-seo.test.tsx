import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Interface coverage (ADR-0015 §1.2, free tool): every page links the privacy policy, the public
// status page and a contact, and the layout carries Open Graph metadata.

vi.mock("next/font/google", () => ({ Inter: () => ({ variable: "font-wb", className: "font-wb" }) }));

const { default: RootLayout, metadata } = await import("@/app/layout");

describe("site footer and metadata", () => {
  it("the layout footer links privacy, status and contact", () => {
    const html = renderToString(<RootLayout><main /></RootLayout>);
    expect(html).toContain("<footer");
    expect(html).toContain('href="https://bookchaowalit.com/privacy"');
    expect(html).toContain('href="https://monitor.bookchaowalit.com/"');
    expect(html).toContain('href="mailto:bookchaowalit.work@gmail.com"');
  });

  it("the header and footer link back to the bookchaowalit.com hub and the source", () => {
    const html = renderToString(<RootLayout><main /></RootLayout>);
    expect(html.match(/href="https:\/\/bookchaowalit.com\/"/g)?.length).toBe(2);
    expect(html).toContain('href="https://github.com/bookchaowalit-website/devtools-suite-web"');
  });

  it("has Open Graph title, description and site name", () => {
    expect(metadata.openGraph).toMatchObject({ type: "website", siteName: expect.any(String) });
    expect(metadata.openGraph?.title).toBeTruthy();
    expect(metadata.openGraph?.description).toBeTruthy();
  });
});
