"use client";

import { useState } from "react";

type Palette = { name: string; note: string; colors: string[] };
const PRESETS: Palette[] = [
  { name: "Sunset", note: "heat / late light", colors: ["#FF6B6B", "#FFA06B", "#FFD93D", "#6BCB77", "#4D96FF"] },
  { name: "Ocean", note: "depth / open water", colors: ["#023E8A", "#0077B6", "#0096C7", "#48CAE4", "#90E0EF"] },
  { name: "Forest", note: "leaf / understory", colors: ["#2D6A4F", "#40916C", "#52B788", "#74C69D", "#95D5B2"] },
  { name: "Berry", note: "ink / dusk", colors: ["#7400B8", "#9D4EDD", "#C77DFF", "#E0AAFF", "#F3D9FA"] },
  { name: "Warm", note: "clay / kiln", colors: ["#9B2222", "#CD5C5C", "#E9967A", "#F4A460", "#FFE4B5"] },
  { name: "Slate", note: "graphite / quiet", colors: ["#0F172A", "#1E293B", "#334155", "#94A3B8", "#F8FAFC"] },
];

async function copyText(text: string) { try { await navigator.clipboard.writeText(text); return true; } catch { return false; } }
const cssTokens = (palette: Palette) => `:root {\n${palette.colors.map((color, index) => `  --color-${index + 1}: ${color};`).join("\n")}\n}`;
const tailwindTokens = (palette: Palette) => `colors: {\n${palette.colors.map((color, index) => `  ${palette.name.toLowerCase()}-${index + 1}: "${color}",`).join("\n")}\n}`;
const jsonTokens = (palette: Palette) => JSON.stringify({ name: palette.name, colors: palette.colors }, null, 2);

export default function Home() {
  const [selected, setSelected] = useState(PRESETS[0]);
  const [status, setStatus] = useState("LIBRARY OPEN / DEMO PRESETS");
  const copy = async (value: string, label: string) => setStatus((await copyText(value)) ? `COPIED / ${label}` : "COPY BLOCKED / SELECT THE VALUE");

  return (
    <main className="palette-page">
      <div className="palette-shell">
        <header className="palette-header">
          <div className="palette-brand"><span>BOOKCHAOWALIT / DEV TOOLS</span><strong>SWATCH LIBRARY</strong></div>
          <p aria-live="polite">{status}</p>
          <span className="palette-edition">EDITION 06 / STATIC SAMPLE</span>
        </header>
        <section className="palette-intro" aria-labelledby="page-title"><h1 id="page-title">Choose the light.</h1><p>Browse a small set of curated color studies, inspect each swatch, and carry the palette into code without losing its name.</p></section>
        <section className="palette-workspace" aria-label="Palette library">
          <aside className="palette-shelf"><div className="palette-section-head"><span>SHELF / PRESETS</span><span>{PRESETS.length}</span></div><div className="palette-list">{PRESETS.map((palette, index) => <button type="button" key={palette.name} className={selected.name === palette.name ? "palette-choice is-selected" : "palette-choice"} onClick={() => { setSelected(palette); setStatus(`OPEN / ${palette.name.toUpperCase()} STUDY`); }}><span className="palette-choice-index">{String(index + 1).padStart(2, "0")}</span><span className="palette-mini" aria-hidden="true">{palette.colors.map((color) => <i key={color} style={{ backgroundColor: color }} />)}</span><span><b>{palette.name}</b><small>{palette.note}</small></span></button>)}</div></aside>
          <div className="palette-study">
            <div className="palette-section-head"><span>STUDY / {selected.name.toUpperCase()}</span><span>HEX / 05</span></div>
            <div className="palette-strips" role="group" aria-label={`${selected.name} palette swatches`}>{selected.colors.map((color, index) => <button type="button" key={color} style={{ backgroundColor: color }} onClick={() => void copy(color, `${color} COPIED`)} aria-label={`Copy ${color}`}><strong>{String(index + 1).padStart(2, "0")}</strong><span>{color}</span></button>)}</div>
            <div className="palette-study-meta"><div><span>SELECTED STUDY</span><strong>{selected.name}</strong><p>{selected.note}. Click a strip to copy its HEX value.</p></div><button type="button" className="palette-copy-all" onClick={() => void copy(selected.colors.join("\n"), "ALL HEX COPIED")}>Copy all HEX</button></div>
            <div className="palette-export"><div className="palette-section-head"><span>EXPORT / TOKEN DRAWER</span><span>READY</span></div><div className="export-row"><button type="button" onClick={() => void copy(cssTokens(selected), "CSS COPIED")}>CSS variables</button><button type="button" onClick={() => void copy(tailwindTokens(selected), "TAILWIND COPIED")}>Tailwind colors</button><button type="button" onClick={() => void copy(jsonTokens(selected), "JSON COPIED")}>JSON object</button></div><pre>{cssTokens(selected)}</pre></div>
          </div>
        </section>
        <footer className="palette-footer">STATIC DEMO DATA / NO IMAGE EXTRACTION / COPY WHAT YOU SEE</footer>
      </div>
    </main>
  );
}
