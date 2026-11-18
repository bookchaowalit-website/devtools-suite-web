import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CronPage from "@/app/(tools)/cron/page";

// The next-run list depends on the viewer's clock and time zone, so the server must not render it:
// a server-rendered list never matches the browser's and React throws hydration error #418.
describe("cron next runs", () => {
  it("server render shows a placeholder instead of clock-dependent times", () => {
    const html = renderToString(<CronPage />);
    expect(html).not.toMatch(/<time>/);
    expect(html).toContain("Calculating run times");
    expect(html).toContain("At 09:00, Monday to Friday");
    expect(html).toMatch(/aria-label="Time zone"/);
    expect(html).toContain('class="wb"');
  });
});

describe("cron expression label", () => {
  it("is visible, not screen-reader only", () => {
    const html = renderToString(<CronPage />);
    expect(html).toMatch(/<label id="cron-label" for="cron-expr" class="wb-expression-label">Cron expression/);
    expect(html).not.toMatch(/class="wb-sr"[^>]*>Cron expression/);
  });
});
