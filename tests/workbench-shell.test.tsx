import { readFileSync } from "node:fs";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CopyBlocked, Segmented, ToolIntro, UndoToast, type UndoState } from "@/components/workbench";

const css = readFileSync(new URL("../app/workbench.css", import.meta.url), "utf8");
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

describe("shared Workbench pieces (2026-11-19 polish)", () => {
  it("shows a visible copy-blocked note only when copying failed", () => {
    expect(renderToString(<CopyBlocked show={false} />)).toBe("");
    const html = renderToString(<CopyBlocked show what="the hash" />);
    expect(html).toContain('class="wb-note wb-note-alert"');
    expect(html).toContain("Copy was blocked by the browser. Select <!-- -->the hash<!-- --> and copy it by hand.");
  });

  it("renders the undo toast inside an always-present status region", () => {
    const idle: UndoState = { pending: null, offer: () => {}, undo: () => {}, dismiss: () => {}, pause: () => {}, resume: () => {} };
    expect(renderToString(<UndoToast state={idle} />)).toBe('<div class="wb-toast" role="status" aria-live="polite"></div>');
    const html = renderToString(<UndoToast state={{ ...idle, pending: { message: "Item deleted.", restore: () => {}, id: 1 } }} />);
    expect(html).toContain("<span>Item deleted.</span>");
    expect(html).toContain('class="wb-toast-undo">Undo</button>');
  });

  it("puts a warning on its own line with an alert icon, apart from the privacy lock", () => {
    const html = renderToString(<ToolIntro title="T" summary="S" warning="Illustrative only." />);
    expect(html).toContain("Runs in your browser. Nothing you type is uploaded.");
    expect(html).toMatch(/class="wb-private wb-warning"><svg[^]*<\/svg>Illustrative only\.<\/span>/);
  });

  it("can disable a segmented control", () => {
    const html = renderToString(<Segmented label="Indent" options={[{ value: "2", label: "2" }]} value="2" onChange={() => {}} disabled />);
    expect(html).toMatch(/aria-pressed="true" disabled=""/);
  });
});

describe("non-text contrast (WCAG 1.4.11, 3:1)", () => {
  it("the selected segment has an edge that passes on the track and the thumb, light and dark", () => {
    expect(css).toMatch(/\.wb-segmented button\[aria-pressed="true"\] \{[^}]*box-shadow: inset 0 0 0 1px var\(--wb-seg-line\)/);
    expect(contrast("#6e6e73", "#e8e8ed")).toBeGreaterThanOrEqual(3);
    expect(contrast("#6e6e73", "#ffffff")).toBeGreaterThanOrEqual(3);
    expect(contrast("#d2d2d7", "#2c2c2e")).toBeGreaterThanOrEqual(3);
    expect(contrast("#d2d2d7", "#636366")).toBeGreaterThanOrEqual(3);
  });

  it("an off switch, number fields and palette swatches carry a --wb-field-line edge", () => {
    expect(css).toMatch(/\.wb-switch input:not\(:checked\) \{ box-shadow: inset 0 0 0 1px var\(--wb-field-line\); \}/);
    expect(css).toMatch(/\.wb-field input \{[^}]*border: 1px solid var\(--wb-field-line\)/);
    expect(css).toMatch(/\.wb-swatches button \{[^}]*border: 1px solid var\(--wb-field-line\)/);
    expect(contrast("#86868b", "#f5f5f7")).toBeGreaterThanOrEqual(3);
    expect(contrast("#7c7c80", "#000000")).toBeGreaterThanOrEqual(3);
  });

  it("regex match edges and diff line numbers pass", () => {
    expect(contrast("#8a6d00", "#ffffff")).toBeGreaterThanOrEqual(3);
    expect(contrast("#1f5fbf", "#ffffff")).toBeGreaterThanOrEqual(3);
    expect(contrast("#5f5f64", "#fdecec")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#b4b4b9", "#3a1214")).toBeGreaterThanOrEqual(4.5);
  });
});
