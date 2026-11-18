import { readFileSync } from "node:fs";
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

import ColorPickerTool from "@/app/(tools)/colorpicker/page";
import DateCalculatorTool from "@/app/(tools)/date-calculator/page";
import DiffCheckerTool from "@/app/(tools)/diffchecker/page";

describe("/date-calculator on the Workbench shell", () => {
  const html = renderToString(<DateCalculatorTool />);
  it("renders no build-time date on the server (hydration #418) and labels every field", () => {
    expect(html).toContain('class="wb"');
    expect(html).not.toMatch(/value="\d{4}-\d{2}-\d{2}"/);
    expect(html).toContain("Days between");
    expect(html).toContain("Add or subtract");
    expect(html).not.toMatch(/calendar slide|ruler/i);
  });
});

describe("/colorpicker on the Workbench shell", () => {
  const html = renderToString(<ColorPickerTool />);
  it("shows the default color in all three formats with copy buttons", () => {
    expect(html).toContain('class="wb"');
    expect(html).toContain("#4F46E5");
    expect(html).toContain("rgb(79, 70, 229)");
    expect(html).toMatch(/hsl\(\d+, \d+%, \d+%\)/);
    expect(html.match(/aria-label="Copy (HEX|RGB|HSL) value"/g)?.length).toBe(3);
  });
});

describe("/diffchecker on the Workbench shell", () => {
  const html = renderToString(<DiffCheckerTool />);
  it("compares the samples live and says which lines changed in words", () => {
    expect(html).toContain('class="wb"');
    expect(html).toMatch(/\+(<!-- -->)?2(<!-- -->)? added/);
    expect(html).toMatch(/−(<!-- -->)?1(<!-- -->)? removed/);
    expect(html).toContain("Added: ");
    expect(html).not.toMatch(/evidence|forensic/i);
  });
});

import ColorPalettesTool from "@/app/(tools)/color-palettes/page";
import MarkdownEditorTool from "@/app/(tools)/markdown-editor/page";

describe("/markdown-editor on the Workbench shell", () => {
  const html = renderToString(<MarkdownEditorTool />);
  it("renders the sample preview next to a labelled source field", () => {
    expect(html).toContain('class="wb"');
    expect(html).toContain('<label for="md-source">Markdown</label>');
    expect(html).toMatch(/<h1[^>]*>Markdown Editor<\/h1>/);
    expect(html).not.toMatch(/two plates|proof/i);
  });
});

describe("/color-palettes on the Workbench shell", () => {
  const html = renderToString(<ColorPalettesTool />);
  it("offers six palettes as a radio group and exports CSS by default", () => {
    expect(html).toContain('class="wb"');
    expect(html.match(/name="palette"/g)?.length).toBe(6);
    expect(html).toContain("--color-1: #FF6B6B;");
    expect(html.match(/aria-label="Copy #[0-9A-F]{6}"/g)?.length).toBe(5);
    expect(html).not.toMatch(/swatch library|edition/i);
  });
});

import ClipboardManagerTool from "@/app/(tools)/clipboard-manager/page";
import EngineeringCalcTool from "@/app/(tools)/engineering-calc/page";
import LatencyTool from "@/app/(tools)/latency-test/page";
import RegexTool from "@/app/(tools)/regex/page";
import SnippetsTool from "@/app/(tools)/snippets/page";

describe("the last five tools on the Workbench shell", () => {
  it("/regex matches every word of the sample (the default pattern keeps its backslashes)", () => {
    const html = renderToString(<RegexTool />);
    expect(html).toContain('class="wb"');
    expect(html).toContain('value="\\b\\w+\\b"');
    expect(html).toMatch(/9(<!-- -->)? (<!-- -->)?matches/);
    expect(html).not.toMatch(/print the pattern|impression/i);
  });

  it("/engineering-calc shows a live result for the default inputs", () => {
    const html = renderToString(<EngineeringCalcTool />);
    expect(html).toContain('class="wb"');
    expect(html).toContain("8.82"); // 4 kN/m × 4.2² / 8
    expect(html).toContain("Illustrative only");
  });

  it("/latency-test starts empty with a labelled URL field", () => {
    const html = renderToString(<LatencyTool />);
    expect(html).toContain('class="wb"');
    expect(html).toContain('for="latency-url"');
    expect(html).toContain("No tests yet");
  });

  it("/clipboard-manager waits for localStorage before saying it is empty", () => {
    const html = renderToString(<ClipboardManagerTool />);
    expect(html).toContain('class="wb"');
    expect(html).toContain("Loading saved items");
    expect(html).toContain('for="clip-draft"');
  });

  it("/snippets lists every snippet and shows the first one", () => {
    const html = renderToString(<SnippetsTool />);
    expect(html).toContain('class="wb"');
    expect(html).toContain("React Hook");
    expect(html).toContain('aria-current="true"');
    expect(html).not.toMatch(/specimen/i);
  });
});

describe("/regex on phones", () => {
  it("caps the preview shown above the editor, so a long paste cannot push the editor screens down", () => {
    const css = readFileSync(new URL("../app/workbench.css", import.meta.url), "utf8");
    const phone = css.slice(css.indexOf(".wb-panes-result-first > :last-child { order: -1; }"));
    expect(phone).toMatch(/\.wb-panes-result-first \.wb-highlight \{[^}]*max-height: min\(40vh, 320px\);[^}]*overflow-y: auto;/);
  });
});

// A pasted hash with no spaces must wrap in the Snippets empty state, not widen the column (Codex review, 2026-11-18).
describe("/snippets empty state with a long query", () => {
  it("wraps the query and keeps the phone column from growing past the screen", () => {
    const css = readFileSync(new URL("../app/workbench.css", import.meta.url), "utf8");
    expect(css).toMatch(/\.wb-empty-actions \.wb-note \{[^}]*overflow-wrap: anywhere/);
    expect(css).toMatch(/@media \(max-width: 720px\) \{ \.wb-library \{ grid-template-columns: minmax\(0, 1fr\); \}/);
  });
});
