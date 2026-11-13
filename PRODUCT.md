# Devtools Workbench (devtools-suite-web) — Product truth

> Inferred from the code (every `app/(tools)/*/page.tsx` and its `lib/<slug>/`), no user interview. Checked on
> 2026-10-23 against every row of `portfolio-site-web/docs/audits/CARD-CLAIMS-REVIEW-2026-10.md` whose source is
> `bookchaowalit-website/devtools-suite-web` (17 cards: base64, color-palettes, colorpicker, cron, date-calculator,
> diffchecker, hashgen, jsonconverter, markdown-editor, minifier, number-converter, regex, url-encoder,
> engineering-calc, latency-test, clipboard-manager, snippets). The "does not" lines repeat what those rows removed.

## What it is

One Next.js site that merged 17 former single-tool subdomains. `/` is a catalogue; each tool lives at `/<slug>`.
Everything runs in the browser; the only network calls are the Latency Test's fetch to the URL you enter and the
read-only snippets MCP route.

## Who it is for

A developer who needs a quick, private, in-browser utility, and a portfolio visitor comparing 17 small UI designs.

## Routes: what each one really does

| Route | Does | Does not |
|---|---|---|
| `/` | Catalogue of the 17 tools with name, one-line description and route. | — |
| `/base64` | Encode text to Base64 or decode it back as you type (live result); UTF-8 safe; optional URL-safe output (no padding); decoding accepts standard or URL-safe input and ignores spaces and line breaks; character/byte counts; swap and copy. First tool on the Workbench shell (`WORKBENCH.md`). | No file-to-Base64, no Web Worker. |
| `/color-palettes` | Six fixed preset palettes labelled static sample; copy one colour, the whole palette, or CSS variables / Tailwind / JSON tokens. | No contrast or WCAG check, no palette generation, no UI-pattern previews. |
| `/colorpicker` | Pick a colour and read/copy it as HEX, RGB and HSL (with clamping and round-trip conversion). On the Workbench shell. | No OKLCH, contrast checker, colour-blindness simulation or palette generation. |
| `/cron` | Edit a standard 5-field cron expression or choose a preset; get a plain-English sentence and an estimated list of the next 5 run times in local time. | No visual builder, full validation, shareable URLs or non-standard fields. |
| `/date-calculator` | Difference between two dates and add/subtract days, weeks or months, on a fixed Asia/Bangkok calendar. Today is filled in after hydration (no build-time date in the HTML). On the Workbench shell. | No working days, holidays or time-zone conversion. |
| `/diffchecker` | Line-by-line comparison (one LCS algorithm) marking added and removed lines; swap and clear. Compares as you type. On the Workbench shell. | No character/word modes, other algorithms or sharing. |
| `/hashgen` | SHA-1, SHA-256, SHA-384 or SHA-512 of the entered text via Web Crypto, recomputed as you type; copy the digest. On the Workbench shell. | No MD5, bcrypt, file hashing or batch comparison. |
| `/jsonconverter` | Pretty-print or minify JSON, and convert JSON ↔ YAML (js-yaml); errors are shown; copy output. Result updates as you type. On the Workbench shell. | No tree view, syntax highlighting, CSV or XML. |
| `/markdown-editor` | Split-pane editor with a live preview from a small built-in renderer (escaped HTML, safe links only); reset sample; copy source. | No syntax highlighting, themes, or export to HTML/PDF/MDX. |
| `/minifier` | Shrink CSS, HTML or JS with regex replacements and JSON through `JSON.parse`; size savings; copy. It says it is not a production compiler. Result and size saving update as you type; logic in `lib/minifier/minify.ts`. On the Workbench shell. | No real parser-based minification, source maps or mangling. |
| `/number-converter` | Four synced inputs (binary, octal, decimal, hexadecimal) using BigInt, so large integers convert exactly; invalid input is flagged. On the Workbench shell. | No bit visualisation or signed/unsigned representations. |
| `/regex` | Live JavaScript RegExp tester with flag toggles, highlighted matches and capture groups, on the main thread. | No pattern library or Web Worker execution. |
| `/url-encoder` | `encodeURIComponent` / `decodeURIComponent` / `encodeURI` / `decodeURI` (chosen as Encode/Decode × Query value/Full URL), live result, swap-and-reverse, and a `URLSearchParams` query inspector. On the Workbench shell. | No query builder, batch mode, full URL parsing or double-encoding handling. |
| `/engineering-calc` | Illustrative simply-supported beam check: three load cases (uniform M = wL²/8, mid-span point M = PL/4, service), kN or kgf, input bounds and the formula shown. | Not an engineering design tool; no codes, materials or deflection. |
| `/latency-test` | Ping one URL you enter (or a preset) with `fetch`, with a timeout; keeps the last 12 runs for this tab with average, median, min and max. | No multi-region probes, world map or history across sessions. |
| `/clipboard-manager` | File text snippets by hand (or read the clipboard on request), search, pin, copy and delete; stored in `localStorage` (`devtools-suite:clipboard-manager:` keys). | No passive clipboard listening, categories or syntax-aware formatting. |
| `/snippets` | Three hard-coded sample snippets (React, Python, TypeScript): filter by category, read one, copy it. | No saving, organising, syntax highlighting, sharing, private snippets or "500+" library. |
| `POST /api/snippets/mcp` | Stateless JSON-RPC (`initialize`, `tools/list`, `tools/call` with `get_all`, `get_by_id`, `search`) over the same three snippets; bad JSON → 400, notifications → 202, unknown tools/methods → JSON-RPC errors. | No database or write tools. |

Former subdomains (`base64.bookchaowalit.com` and the other 16) answer with a permanent redirect to their route
here (host-matched redirects in `next.config.ts`, map in `lib/redirects.ts`).

## Errors

Front-end and server errors go to Sentry (errors only, personal data stripped) when `NEXT_PUBLIC_SENTRY_DSN` is set.

## Live URL and deploy state

- Live: https://devtools.bookchaowalit.com (HTTP 200 on 2026-10-23); e.g. https://base64.bookchaowalit.com answers
  308 → `/base64`.
- The Vercel project `devtools-suite-web` has no Git link, so a push to `main` does not deploy. The last production
  deploy is the CVE patch (2026-10-23 12:27, CLI, commit 90df71b). Later commits (Vitest, Sentry, docs) stay
  undeployed until the coordinator's next deploy (Vercel's daily deploy quota was used up on 2026-10-23) or the owner
  connects Vercel Git to `bookchaowalit-website/devtools-suite-web` (owner action D9).
- `NEXT_PUBLIC_SENTRY_DSN` is set on the Vercel project (Sentry project `devtools-suite-web`, org `personal-yu0`); it
  takes effect on the next deploy.

## Boundaries

- No accounts, no server storage, no analytics beyond Vercel Analytics/Speed Insights. Only the clipboard manager
  writes to `localStorage`.
