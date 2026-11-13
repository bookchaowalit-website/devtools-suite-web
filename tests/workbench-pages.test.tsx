import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HashTool from "@/app/(tools)/hashgen/page";
import UrlEncoderTool from "@/app/(tools)/url-encoder/page";

// Tools moved onto the Workbench shell keep plain labels and visible field labels.
describe("/url-encoder on the Workbench shell", () => {
  const html = renderToString(<UrlEncoderTool />);
  it("uses the shell, plain labels and a live encoded result", () => {
    expect(html).toContain('class="wb"');
    expect(html).toContain("<h1>URL Encoder</h1>");
    expect(html).not.toMatch(/telegram|Coded Message/i);
    expect(html).toContain("hello%20world%3Fq%3Dcaf%C3%A9%20%26%20more");
    expect(html).toContain('<label for="url-input">Text</label>');
    expect(html).toMatch(/aria-pressed="true"[^>]*>Query value</);
  });
});

describe("/hashgen on the Workbench shell", () => {
  const html = renderToString(<HashTool />);
  it("offers the four SHA algorithms as a labelled radio group with SHA-256 chosen", () => {
    expect(html).toContain('class="wb"');
    expect(html).toContain("<legend>Algorithm</legend>");
    for (const name of ["SHA-1", "SHA-256", "SHA-384", "SHA-512"]) expect(html).toContain(`<strong>${name}</strong>`);
    expect(html).toMatch(/checked=""[^>]*value="SHA-256"|value="SHA-256"[^>]*checked=""/);
    expect(html).not.toMatch(/SPECIMEN|calibration/i);
  });
});
