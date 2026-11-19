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
| `/color-palettes` | Six fixed preset palettes labelled static sample; copy one colour, the whole palette, or CSS variables / Tailwind / JSON tokens. Tailwind export now quotes its hyphenated keys so it parses as JS. On the Workbench shell. | No contrast or WCAG check, no palette generation, no UI-pattern previews. |
| `/colorpicker` | Pick a colour and read/copy it as HEX, RGB and HSL (with clamping and round-trip conversion). On the Workbench shell. | No OKLCH, contrast checker, colour-blindness simulation or palette generation. |
| `/cron` | Edit a standard 5-field cron expression or choose a preset; get a plain-English sentence and an estimated list of the next 5 run times in local time. Logic in `lib/cron/cron.ts`; next runs still browser-only. On the Workbench shell. | No visual builder, full validation, shareable URLs or non-standard fields. |
| `/date-calculator` | Difference between two dates and add/subtract days, weeks or months, on a fixed Asia/Bangkok calendar. Today is filled in after hydration (no build-time date in the HTML). On the Workbench shell. | No working days, holidays or time-zone conversion. |
| `/diffchecker` | Line-by-line comparison (one LCS algorithm) marking added and removed lines; swap and clear. Compares as you type. On the Workbench shell. | No character/word modes, other algorithms or sharing. |
| `/hashgen` | SHA-1, SHA-256, SHA-384 or SHA-512 of the entered text via Web Crypto, recomputed as you type; copy the digest. On the Workbench shell. | No MD5, bcrypt, file hashing or batch comparison. |
| `/jsonconverter` | Pretty-print or minify JSON, and convert JSON ↔ YAML (js-yaml); errors are shown; copy output. Result updates as you type. On the Workbench shell. | No tree view, syntax highlighting, CSV or XML. |
| `/markdown-editor` | Split-pane editor with a live preview from a small built-in renderer (escaped HTML, safe links only); reset sample; copy source. On the Workbench shell. | No syntax highlighting, themes, or export to HTML/PDF/MDX. |
| `/minifier` | Shrink JS with terser and CSS with csso (both loaded only on this page, renaming and restructuring off), HTML with a comment and whitespace stripper, and JSON through `JSON.parse`; parse errors give line and column; size savings; copy. Logic in `lib/minifier/minify.ts`. On the Workbench shell. | No source maps or mangling. |
| `/number-converter` | Four synced inputs (binary, octal, decimal, hexadecimal) using BigInt, so large integers convert exactly; invalid input is flagged. On the Workbench shell. | No bit visualisation or signed/unsigned representations. |
| `/regex` | Live JavaScript RegExp tester with flag toggles, highlighted matches and capture groups, on the main thread. Default pattern fixed (it was "\b\w+\b" in a plain string, so it matched nothing); logic in `lib/regex/run.ts`. On the Workbench shell. | No pattern library or Web Worker execution. |
| `/url-encoder` | `encodeURIComponent` / `decodeURIComponent` / `encodeURI` / `decodeURI` (chosen as Encode/Decode × Query value/Full URL), live result, swap-and-reverse, and a `URLSearchParams` query inspector. On the Workbench shell. | No query builder, batch mode, full URL parsing or double-encoding handling. |
| `/engineering-calc` | Illustrative simply-supported beam check: three load cases (uniform M = wL²/8, mid-span point M = PL/4, service), kN or kgf, input bounds and the formula shown. Result updates as you type. On the Workbench shell. | Not an engineering design tool; no codes, materials or deflection. |
| `/latency-test` | Ping one URL you enter (or a preset) with `fetch`, with a timeout; keeps the last 12 runs for this tab with average, median, min and max. On the Workbench shell. | No multi-region probes, world map or history across sessions. |
| `/clipboard-manager` | File text snippets by hand (or read the clipboard on request), search, pin, copy and delete; stored in `localStorage` (`devtools-suite:clipboard-manager:` keys). On the Workbench shell. | No passive clipboard listening, categories or syntax-aware formatting. |
| `/snippets` | Three hard-coded sample snippets (React, Python, TypeScript): filter by category, read one, copy it. The open snippet now follows the filter. On the Workbench shell. | No saving, organising, syntax highlighting, sharing, private snippets or "500+" library. |
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

- No accounts, no server storage, no analytics or tracking scripts (removed 2026-11-17). Only the clipboard manager
  writes to `localStorage`. (The Markdown editor's opt-in draft saving was removed again on 2026-11-19 to keep this
  boundary: the editor keeps text in memory only.)

## Known limits

Recorded 2026-11-19 after the last polish round. Review findings after this point are listed here instead of
starting another devtools round.

- Code Minifier: JavaScript (terser) and CSS (csso) run with renaming and restructuring off, so results are safe
  but not as small as a full build. JavaScript that is not a valid script is retried as a module; if both fail, the
  script parse error is shown. CSS that csso would shorten by dropping blocks (nested rules, empty `@layer` or rule
  blocks) is refused with an error instead of minified. HTML is a comment and whitespace stripper, not a parser.
- Markdown Editor: a small renderer, not CommonMark (no reference links, HTML blocks or footnotes); tables preview
  at most 50 columns and 5,000 cells; nothing is saved.
- Diff Checker: one unified-diff hunk for the whole text; very long texts fall back to an approximate diff with a
  notice, and word highlighting stops at a page-wide budget. File paths in the patch drop "..", a leading "/" and
  control characters.
- Hash Generator: files up to 512 MB; one file read and one hash job at a time (newest request wins). Undo after
  Clear does not bring back a file that was still being read.
- Regex Tester: Replace stops at 1,000 matches, 200,000 characters or a fixed amount of template work, and says so.
- Latency Test: cross-site results cannot show the HTTP status; timing ends at the response headers.
- Undo toasts last six seconds, paused while focused or hovered; focus moves to Undo only when the control that
  triggered it is gone.
