export type Tool = {
  /** Route segment: the tool lives at /<slug>. */
  slug: string;
  name: string;
  description: string;
  /** Host the tool was served from before it joined the suite. */
  subdomain: string;
};

export const TOOLS: readonly Tool[] = [
  { slug: "base64", name: "Base64", description: "Encode and decode Base64 text fully in the browser. UTF-8 safe, no upload.", subdomain: "base64.bookchaowalit.com" },
  { slug: "color-palettes", name: "Color Palettes", description: "Browse preset palettes and export as CSS, Tailwind, or JSON.", subdomain: "color-palettes.bookchaowalit.com" },
  { slug: "colorpicker", name: "Color Picker", description: "Pick a color and convert between HEX, RGB, and HSL.", subdomain: "colorpicker.bookchaowalit.com" },
  { slug: "cron", name: "Cron Helper", description: "Build and explain standard 5-field cron expressions and preview next run times.", subdomain: "cron.bookchaowalit.com" },
  { slug: "date-calculator", name: "Date Calculator", description: "Compute date differences and add or subtract days, weeks, or months.", subdomain: "date-calculator.bookchaowalit.com" },
  { slug: "diffchecker", name: "Diff Checker", description: "Compare two texts line-by-line and highlight additions and removals.", subdomain: "diffchecker.bookchaowalit.com" },
  { slug: "hashgen", name: "Hash Generator", description: "Generate SHA fingerprints locally with the Web Crypto API.", subdomain: "hashgen.bookchaowalit.com" },
  { slug: "jsonconverter", name: "JSON Converter", description: "Format JSON and move simple data between JSON and YAML in the browser.", subdomain: "jsonconverter.bookchaowalit.com" },
  { slug: "markdown-editor", name: "Markdown Editor", description: "Split-pane Markdown editor with a lightweight live preview.", subdomain: "markdown-editor.bookchaowalit.com" },
  { slug: "minifier", name: "Code Minifier", description: "Lightweight JS / CSS / HTML / JSON minifier that runs entirely client-side.", subdomain: "minifier.bookchaowalit.com" },
  { slug: "number-converter", name: "Number Base Converter", description: "Convert integers between binary, octal, decimal, and hexadecimal.", subdomain: "number-converter.bookchaowalit.com" },
  { slug: "regex", name: "Regex Tester", description: "A live JavaScript regular expression proof desk.", subdomain: "regex.bookchaowalit.com" },
  { slug: "url-encoder", name: "URL Encoder", description: "Encode and decode URL components in the browser.", subdomain: "url-encoder.bookchaowalit.com" },
  { slug: "engineering-calc", name: "Engineering Calculator", description: "An illustrative field instrument for beam-load checks.", subdomain: "engineering.bookchaowalit.com" },
  { slug: "latency-test", name: "Latency Test", description: "Ping a URL from the browser.", subdomain: "latency-test.bookchaowalit.com" },
  { slug: "clipboard-manager", name: "Clipboard Manager", description: "Local-only clipboard history snippets stored in localStorage.", subdomain: "clipboard-manager.bookchaowalit.com" },
  { slug: "snippets", name: "Snippets", description: "A small local code specimen library: filter, read and copy reusable snippets.", subdomain: "snippets.bookchaowalit.com" },
];

export function toolPath(tool: Pick<Tool, "slug">): string {
  return `/${tool.slug}`;
}
