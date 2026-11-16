export type Tool = {
  /** Route segment: the tool lives at /<slug>. */
  slug: string;
  name: string;
  description: string;
  /** Host the tool was served from before it joined the suite. */
  subdomain: string;
};

export const TOOLS: readonly Tool[] = [
  { slug: "base64", name: "Base64", description: "Encode text to Base64 or decode it back, including Thai, emoji and accents.", subdomain: "base64.bookchaowalit.com" },
  { slug: "color-palettes", name: "Color Palettes", description: "Pick a preset color palette and copy it as CSS variables, Tailwind config or JSON.", subdomain: "color-palettes.bookchaowalit.com" },
  { slug: "colorpicker", name: "Color Picker", description: "Pick a color and read or copy it as HEX, RGB and HSL.", subdomain: "colorpicker.bookchaowalit.com" },
  { slug: "cron", name: "Cron Helper", description: "Check a five-field cron expression, read it in plain English and list its next run times.", subdomain: "cron.bookchaowalit.com" },
  { slug: "date-calculator", name: "Date Calculator", description: "Count the days between two dates, or add and subtract days, weeks or months.", subdomain: "date-calculator.bookchaowalit.com" },
  { slug: "diffchecker", name: "Diff Checker", description: "Compare two texts line by line and see which lines were added or removed.", subdomain: "diffchecker.bookchaowalit.com" },
  { slug: "hashgen", name: "Hash Generator", description: "Make a SHA-1, SHA-256, SHA-384 or SHA-512 hash of any text.", subdomain: "hashgen.bookchaowalit.com" },
  { slug: "jsonconverter", name: "JSON Converter", description: "Format or minify JSON and convert simple data between JSON and YAML.", subdomain: "jsonconverter.bookchaowalit.com" },
  { slug: "markdown-editor", name: "Markdown Editor", description: "Write Markdown on one side and see the formatted preview on the other.", subdomain: "markdown-editor.bookchaowalit.com" },
  { slug: "minifier", name: "Code Minifier", description: "Shrink JavaScript, CSS, HTML or JSON by removing spaces and comments.", subdomain: "minifier.bookchaowalit.com" },
  { slug: "number-converter", name: "Number Base Converter", description: "Convert whole numbers between decimal, hexadecimal, binary and octal.", subdomain: "number-converter.bookchaowalit.com" },
  { slug: "regex", name: "Regex Tester", description: "Run a JavaScript regular expression on your text and see every match and group.", subdomain: "regex.bookchaowalit.com" },
  { slug: "url-encoder", name: "URL Encoder", description: "Percent-encode text for a URL, or decode an encoded URL back to text.", subdomain: "url-encoder.bookchaowalit.com" },
  { slug: "engineering-calc", name: "Engineering Calculator", description: "Work out the maximum bending moment and shear for a simply supported beam.", subdomain: "engineering.bookchaowalit.com" },
  { slug: "latency-test", name: "Latency Test", description: "Time how long a request from your browser to a URL takes, with average and median.", subdomain: "latency-test.bookchaowalit.com" },
  { slug: "clipboard-manager", name: "Clipboard Manager", description: "Save text you paste often in this browser, then find and copy it again.", subdomain: "clipboard-manager.bookchaowalit.com" },
  { slug: "snippets", name: "Snippets", description: "Search a small library of React, Python and TypeScript snippets and copy one.", subdomain: "snippets.bookchaowalit.com" },
];

/** Tools whose name or description contains every word of the query (case-insensitive). */
export function filterTools<T extends Pick<Tool, "name" | "description">>(tools: readonly T[], query: string): T[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [...tools];
  return tools.filter((tool) => {
    const text = `${tool.name} ${tool.description}`.toLowerCase();
    return words.every((word) => text.includes(word));
  });
}

export function toolPath(tool: Pick<Tool, "slug">): string {
  return `/${tool.slug}`;
}
