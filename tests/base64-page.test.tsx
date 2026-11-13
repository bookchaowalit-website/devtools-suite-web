import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Base64Tool from "@/app/(tools)/base64/page";

// Workbench shell pilot: the page renders the shared shell with plain labels and a live result.
describe("/base64 on the Workbench shell", () => {
  const html = renderToString(<Base64Tool />);

  it("uses the shell and plain words, not the old darkroom metaphor", () => {
    expect(html).toContain('class="wb"');
    expect(html).toContain("<h1>Base64</h1>");
    expect(html).toContain("Nothing you type is uploaded.");
    expect(html).not.toMatch(/Expose payload|Develop payload|Take result|tray/i);
  });

  it("shows the encoded sample result on first render, with a visible label on both fields", () => {
    expect(html).toContain("SGVsbG8sIHBvcnRmb2xpbyE=");
    expect(html).toContain('<label for="b64-input">Text</label>');
    expect(html).toContain('<label for="b64-output">Base64</label>');
  });

  it("marks the selected mode for assistive tech", () => {
    expect(html).toMatch(/aria-pressed="true"[^>]*>Encode</);
    expect(html).toMatch(/aria-pressed="false"[^>]*>Decode</);
  });
});
