/**
 * Former standalone subdomain -> path inside the suite.
 * Intended for Vercel redirects (host match) once the domains are moved; no
 * domain is configured by this repository.
 */
export const SUBDOMAIN_REDIRECTS: Readonly<Record<string, string>> = {
  "base64.bookchaowalit.com": "/base64",
  "color-palettes.bookchaowalit.com": "/color-palettes",
  "colorpicker.bookchaowalit.com": "/colorpicker",
  "cron.bookchaowalit.com": "/cron",
  "date-calculator.bookchaowalit.com": "/date-calculator",
  "diffchecker.bookchaowalit.com": "/diffchecker",
  "hashgen.bookchaowalit.com": "/hashgen",
  "jsonconverter.bookchaowalit.com": "/jsonconverter",
  "markdown-editor.bookchaowalit.com": "/markdown-editor",
  "minifier.bookchaowalit.com": "/minifier",
  "number-converter.bookchaowalit.com": "/number-converter",
  "regex.bookchaowalit.com": "/regex",
  "url-encoder.bookchaowalit.com": "/url-encoder",
  "engineering.bookchaowalit.com": "/engineering-calc",
  "latency-test.bookchaowalit.com": "/latency-test",
  "clipboard-manager.bookchaowalit.com": "/clipboard-manager",
  "snippets.bookchaowalit.com": "/snippets",
};

/** Resolve a request host (port and case ignored) to its suite path, if any. */
export function redirectForHost(host: string): string | undefined {
  const bare = host.trim().toLowerCase().replace(/:\d+$/, "");
  return Object.hasOwn(SUBDOMAIN_REDIRECTS, bare) ? SUBDOMAIN_REDIRECTS[bare] : undefined;
}
