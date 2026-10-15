# devtools-suite-web

Devtools Workbench: the client-side developer tools of the Solo Empire
portfolio merged into one Next.js 16 site. Each tool lives at `/<slug>`; `/`
is a catalog. Everything runs in the browser, so nothing you type is uploaded.
The only network call is the Latency Test pinging the URL you enter.

This is phase 1 of the Devtools suite (see the showcase suites plan in the
Solo Empire registry). Tools that need a real backend (status, uptime-monitor,
error-logs, webhook-tester, devhub, mcplist, mcpdocs, github, changelog, lab,
roadmaps, design, tools, language-forge) are not part of this phase.

## Tools

| Tool | Former subdomain | Route | What it does |
|---|---|---|---|
| Base64 | `base64.bookchaowalit.com` | `/base64` | Encode and decode Base64 text fully in the browser. UTF-8 safe, no upload. |
| Color Palettes | `color-palettes.bookchaowalit.com` | `/color-palettes` | Browse preset palettes and export as CSS, Tailwind, or JSON. |
| Color Picker | `colorpicker.bookchaowalit.com` | `/colorpicker` | Pick a color and convert between HEX, RGB, and HSL. |
| Cron Helper | `cron.bookchaowalit.com` | `/cron` | Build and explain standard 5-field cron expressions and preview next run times. |
| Date Calculator | `date-calculator.bookchaowalit.com` | `/date-calculator` | Compute date differences and add or subtract days, weeks, or months. |
| Diff Checker | `diffchecker.bookchaowalit.com` | `/diffchecker` | Compare two texts line-by-line and highlight additions and removals. |
| Hash Generator | `hashgen.bookchaowalit.com` | `/hashgen` | Generate SHA fingerprints locally with the Web Crypto API. |
| JSON Converter | `jsonconverter.bookchaowalit.com` | `/jsonconverter` | Format JSON and move simple data between JSON and YAML in the browser. |
| Markdown Editor | `markdown-editor.bookchaowalit.com` | `/markdown-editor` | Split-pane Markdown editor with a lightweight live preview. |
| Code Minifier | `minifier.bookchaowalit.com` | `/minifier` | Lightweight JS / CSS / HTML / JSON minifier that runs entirely client-side. |
| Number Base Converter | `number-converter.bookchaowalit.com` | `/number-converter` | Convert integers between binary, octal, decimal, and hexadecimal. |
| Regex Tester | `regex.bookchaowalit.com` | `/regex` | A live JavaScript regular expression proof desk. |
| URL Encoder | `url-encoder.bookchaowalit.com` | `/url-encoder` | Encode and decode URL components in the browser. |
| Engineering Calculator | `engineering.bookchaowalit.com` | `/engineering-calc` | An illustrative field instrument for beam-load checks. |
| Latency Test | `latency-test.bookchaowalit.com` | `/latency-test` | Ping a URL from the browser. |
| Clipboard Manager | `clipboard-manager.bookchaowalit.com` | `/clipboard-manager` | Local-only clipboard history snippets stored in localStorage. |
| Snippets | `snippets.bookchaowalit.com` | `/snippets` | A small local code specimen library: filter, read and copy reusable snippets. |

The Snippets catalog also has a JSON-RPC MCP endpoint at `POST /api/snippets/mcp`
(`initialize`, `tools/list`, `tools/call` with `get_all`, `get_by_id` and
`search`). It reuses `lib/snippets/catalog.ts`, the same `SNIPPETS` source and
`filterSnippets` function as the `/snippets` page. It replaces the archived
`devtools-snippets-web` stub at `/api/mcp`, which never returned snippet data;
the old subdomain redirect does not preserve that path.

`lib/redirects.ts` exports the host -> path mapping (`SUBDOMAIN_REDIRECTS`,
`redirectForHost`) for later Vercel redirects. No domain is configured here.

## Layout

- `app/(tools)/<slug>/page.tsx`: the tool, ported from `devtools-<slug>-web`.
- `app/(tools)/<slug>/layout.tsx` and `tool.css`: the tool's fonts, metadata and
  its original stylesheet, scoped under `.t-<slug>` so the 17 designs do not clash.
- `lib/<slug>/`: pure logic that has unit tests; `lib/tools.ts` is the registry.
- Browser storage (clipboard-manager) uses keys prefixed `devtools-suite:<slug>:`.

## Develop

```bash
npm ci
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm test           # node --experimental-strip-types --test tests/*.test.ts
npm run build
```

Set `NEXT_PUBLIC_SITE_URL` to the canonical origin for sitemap, robots and
metadata (default `https://devtools.bookchaowalit.com`).

## License

Apache-2.0, see `LICENSE`.
