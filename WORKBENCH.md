# Workbench shell

The shared look for every single-purpose tool in this suite: calm, minimal, Apple-like. Started
2026-11-13 with `/base64` as the pilot, then `/url-encoder`, `/hashgen`, `/number-converter`, `/jsonconverter` and `/minifier` the
same day; the other 11 tools still carry their own themes and move over one at a time.

## Why

The 2026-11-11 review of all 17 tools found the same problems in almost every one: text under 12px,
buttons under 44px, metaphor labels ("Expose payload", "Take result") instead of plain verbs, and on
phones a decorative hero that pushed the input below the first screen. Seventeen unrelated themes also
made the suite feel like seventeen sites. One shell fixes these once.

## Rules

- **One job per screen.** Title, one plain sentence, the privacy note, then the tool. No hero art.
- **Plain verbs.** Encode, Decode, Copy, Swap, Clear. Name the format, not a metaphor.
- **Live result.** The output follows the input as you type; no separate "convert" step when the work is cheap.
- **One filled button.** The main action (usually Copy) is the only `.wb-button`; everything else is `.wb-button-plain`.
- **First screen on a phone (375×812)** shows the input and the main action.
- **Floor:** text ≥ 12px (body 15–17px), every control ≥ 44px tall, 3px focus ring, 4.5:1 text contrast in light and dark.

## Pieces

| Piece | Where |
|---|---|
| Tokens `--wb-*` (light + dark), layout, segmented control, switch, panes, buttons | `app/workbench.css` |
| `Workbench`, `ToolIntro`, `Segmented`, `useCopy`, icons | `components/workbench.tsx` |
| Option cards (`.wb-options` radio group), result table (`.wb-table`), read-only digest (`.wb-digest`), labelled field rows (`.wb-fields`), size stats (`.wb-stats`); 4+ segments wrap 2×2 on phones | `app/workbench.css` |
| Suite header (translucent bar) and footer with hub + source links | `app/layout.tsx`, `app/globals.css` |

Page structure:

```tsx
<Workbench>
  <ToolIntro title="…" summary="One sentence." />
  <div className="wb-controls"><Segmented … /> {options}</div>
  <div className="wb-panes">
    <section className="wb-pane">head (label + Clear) · textarea · meta or .wb-error</section>
    <section className="wb-pane">head (label + Swap + Copy) · readOnly textarea · meta</section>
  </div>
  <p className="wb-sr" role="status" aria-live="polite">{announcement}</p>
</Workbench>
```

## Moving a tool onto the shell

1. Keep `lib/<slug>/` logic and its tests unchanged.
2. Rewrite `app/(tools)/<slug>/page.tsx` with the pieces above; delete `tool.css` and any `next/font` in the tool layout.
3. Keep `canonical: "/<slug>"` in the layout; set a plain `title`.
4. Add a render test like `tests/base64-page.test.tsx` or `tests/workbench-pages.test.tsx`.
5. Screenshot 375 / 768 / 1440 in light and dark before merging.

Done: base64, url-encoder, hashgen, number-converter, jsonconverter, minifier. Next in line (simplest first):
date-calculator, colorpicker, diffchecker, cron, markdown-editor.
