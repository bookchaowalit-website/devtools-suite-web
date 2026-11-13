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

import JsonConverterTool from "@/app/(tools)/jsonconverter/page";
import MinifierTool from "@/app/(tools)/minifier/page";
import NumberConverterTool from "@/app/(tools)/number-converter/page";

describe("/number-converter on the Workbench shell", () => {
  const html = renderToString(<NumberConverterTool />);
  it("shows 10 in all four bases with a visible label per field", () => {
    expect(html).toContain('class="wb"');
    for (const [base, value] of [["dec", "10"], ["hex", "a"], ["bin", "1010"], ["oct", "12"]]) {
      expect(html).toMatch(new RegExp(`id="n-${base}"[^>]*value="${value}"|value="${value}"[^>]*id="n-${base}"`));
      expect(html).toContain(`for="n-${base}"`);
    }
    expect(html).not.toMatch(/four voices|REGISTER/);
  });
});

describe("/jsonconverter on the Workbench shell", () => {
  const html = renderToString(<JsonConverterTool />);
  it("formats the sample live and names the modes plainly", () => {
    expect(html).toContain('class="wb"');
    for (const label of ["Format", "Minify", "To YAML", "To JSON"]) expect(html).toContain(`>${label}</button>`);
    expect(html).toContain("&quot;project&quot;: &quot;book-dev&quot;");
    expect(html).not.toMatch(/drafting|cloth|pattern/i);
  });
});

describe("/minifier on the Workbench shell", () => {
  const html = renderToString(<MinifierTool />);
  it("minifies the JSON sample live and reports the saving", () => {
    expect(html).toContain('class="wb"');
    expect(html).toContain("{&quot;project&quot;:&quot;solo-empire&quot;");
    expect(html).toMatch(/\d+(<!-- -->)?% smaller/);
    expect(html).not.toMatch(/chamber/i);
  });
});
