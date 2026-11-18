export type Tool = {
  /** Route segment: the tool lives at /<slug>. */
  slug: string;
  name: string;
  description: string;
  /** Host the tool was served from before it joined the suite. */
  subdomain: string;
  /** Extra search words people use for this job (abbreviations, synonyms) that the name and description lack. */
  keywords?: string;
  /** Home page section the card is listed under. */
  group: ToolGroup;
};

/** Home page sections, in display order, so people who do not know a tool's name can still find it by job. */
export const TOOL_GROUPS = [
  { id: "encode", name: "Encode and convert" },
  { id: "text", name: "Text and code" },
  { id: "color", name: "Color" },
  { id: "time", name: "Dates and schedules" },
  { id: "measure", name: "Network and engineering" },
] as const;
export type ToolGroup = (typeof TOOL_GROUPS)[number]["id"];

export const TOOLS: readonly Tool[] = [
  { slug: "base64", name: "Base64", description: "Encode text to Base64 or decode it back, including Thai, emoji and accents.", subdomain: "base64.bookchaowalit.com", keywords: "b64 atob btoa decoder encoder", group: "encode" },
  { slug: "color-palettes", name: "Color Palettes", description: "Pick a preset color palette and copy it as CSS variables, Tailwind config or JSON.", subdomain: "color-palettes.bookchaowalit.com", keywords: "colour scheme theme swatches", group: "color" },
  { slug: "colorpicker", name: "Color Picker", description: "Pick a color and read or copy it as HEX, RGB and HSL.", subdomain: "colorpicker.bookchaowalit.com", keywords: "colour converter rgba", group: "color" },
  { slug: "cron", name: "Cron Helper", description: "Check a five-field cron expression, read it in plain English and list its next run times.", subdomain: "cron.bookchaowalit.com", keywords: "crontab schedule job", group: "time" },
  { slug: "date-calculator", name: "Date Calculator", description: "Count the days between two dates, or add and subtract days, weeks or months.", subdomain: "date-calculator.bookchaowalit.com", keywords: "difference duration age countdown", group: "time" },
  { slug: "diffchecker", name: "Diff Checker", description: "Compare two texts line by line and see which lines were added or removed.", subdomain: "diffchecker.bookchaowalit.com", keywords: "diff difference changes", group: "text" },
  { slug: "hashgen", name: "Hash Generator", description: "Make a SHA-1, SHA-256, SHA-384 or SHA-512 hash of text or a file, and check it against a checksum.", subdomain: "hashgen.bookchaowalit.com", keywords: "sha1 sha256 sha384 sha512 checksum digest verify download file", group: "encode" },
  { slug: "jsonconverter", name: "JSON Converter", description: "Format or minify JSON and convert simple data between JSON and YAML.", subdomain: "jsonconverter.bookchaowalit.com", keywords: "yml pretty print beautify formatter prettify", group: "encode" },
  { slug: "markdown-editor", name: "Markdown Editor", description: "Write Markdown on one side and see the formatted preview on the other.", subdomain: "markdown-editor.bookchaowalit.com", keywords: "md previewer", group: "text" },
  { slug: "minifier", name: "Code Minifier", description: "Shrink JavaScript, CSS, HTML or JSON by removing spaces and comments.", subdomain: "minifier.bookchaowalit.com", keywords: "minify compress uglify js", group: "text" },
  { slug: "number-converter", name: "Number Base Converter", description: "Convert whole numbers between decimal, hexadecimal, binary and octal.", subdomain: "number-converter.bookchaowalit.com", keywords: "hex dec bin oct radix base conversion", group: "encode" },
  { slug: "regex", name: "Regex Tester", description: "Run a JavaScript regular expression on your text and see every match and group.", subdomain: "regex.bookchaowalit.com", keywords: "regexp regular expression match", group: "text" },
  { slug: "url-encoder", name: "URL Encoder", description: "Percent-encode text for a URL, or decode an encoded URL back to text.", subdomain: "url-encoder.bookchaowalit.com", keywords: "urlencode urldecode percent encoding uri query string", group: "encode" },
  { slug: "engineering-calc", name: "Engineering Calculator", description: "Work out the maximum bending moment and shear for a simply supported beam.", subdomain: "engineering.bookchaowalit.com", keywords: "structural bending moment shear force", group: "measure" },
  { slug: "latency-test", name: "Latency Test", description: "Time how long a request from your browser to a URL takes, with average and median.", subdomain: "latency-test.bookchaowalit.com", keywords: "ping response time speed", group: "measure" },
  { slug: "clipboard-manager", name: "Clipboard Manager", description: "Save text you paste often in this browser, then find and copy it again.", subdomain: "clipboard-manager.bookchaowalit.com", keywords: "paste saved text", group: "text" },
  { slug: "snippets", name: "Snippets", description: "Search a small library of React, Python and TypeScript snippets and copy one.", subdomain: "snippets.bookchaowalit.com", keywords: "code snippet", group: "text" },
];

// Joining words in a task phrase ("JSON to YAML", "hex to decimal"): ignored when the query has other words.
const FILLER = new Set(["a", "an", "and", "as", "for", "from", "in", "into", "of", "or", "the", "to", "with"]);

/** Tools whose name, description or keywords contain every word of the query (case-insensitive), joining words aside. */
export function filterTools<T extends Pick<Tool, "name" | "description" | "keywords">>(tools: readonly T[], query: string): T[] {
  const all = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!all.length) return [...tools];
  const meaningful = all.filter((word) => !FILLER.has(word));
  const words = meaningful.length ? meaningful : all;
  return tools.filter((tool) => {
    const text = `${tool.name} ${tool.description} ${tool.keywords ?? ""}`.toLowerCase();
    return words.every((word) => text.includes(word));
  });
}

export function toolPath(tool: Pick<Tool, "slug">): string {
  return `/${tool.slug}`;
}
