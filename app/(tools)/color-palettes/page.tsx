"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, Segmented, ToolIntro, useCopy, Workbench } from "@/components/workbench";
import { cssTokens, jsonTokens, tailwindTokens, type Palette } from "@/lib/color-palettes/export";

const PRESETS: Palette[] = [
  { name: "Sunset", note: "Warm reds to blue", colors: ["#FF6B6B", "#FFA06B", "#FFD93D", "#6BCB77", "#4D96FF"] },
  { name: "Ocean", note: "Deep to light blue", colors: ["#023E8A", "#0077B6", "#0096C7", "#48CAE4", "#90E0EF"] },
  { name: "Forest", note: "Dark to soft green", colors: ["#2D6A4F", "#40916C", "#52B788", "#74C69D", "#95D5B2"] },
  { name: "Berry", note: "Purple to lilac", colors: ["#7400B8", "#9D4EDD", "#C77DFF", "#E0AAFF", "#F3D9FA"] },
  { name: "Warm", note: "Brick to sand", colors: ["#9B2222", "#CD5C5C", "#E9967A", "#F4A460", "#FFE4B5"] },
  { name: "Slate", note: "Near-black to off-white", colors: ["#0F172A", "#1E293B", "#334155", "#94A3B8", "#F8FAFC"] },
];
type Format = "css" | "tailwind" | "json";
const FORMATS = [{ value: "css", label: "CSS" }, { value: "tailwind", label: "Tailwind" }, { value: "json", label: "JSON" }] as const;
const EXPORT: Record<Format, (palette: Palette) => string> = { css: cssTokens, tailwind: tailwindTokens, json: jsonTokens };

export default function ColorPalettesTool() {
  const [selected, setSelected] = useState(PRESETS[0]);
  const [format, setFormat] = useState<Format>("css");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const code = EXPORT[format](selected);
  const copiedValue = copiedKey === "code" ? code : copiedKey === "all" ? selected.colors.join("\n") : copiedKey ?? "";
  const { copied, copy } = useCopy(copiedValue, (ok) => setAnnouncement(ok ? "Copied to the clipboard." : "Copy was blocked. Select the text and copy it by hand."));
  const copyKey = (key: string, value: string) => { setCopiedKey(key); void copy(value); };
  const isCopied = (key: string) => copied && copiedKey === key;

  return (
    <Workbench>
      <ToolIntro title="Color Palettes" summary="Pick a preset palette, copy single colors, or export the whole set as CSS, Tailwind or JSON." />

      <fieldset className="wb-options wb-palettes">
        <legend>Palette</legend>
        {PRESETS.map((palette) => (
          <label key={palette.name} className="wb-option">
            <input type="radio" name="palette" value={palette.name} checked={selected.name === palette.name} onChange={() => setSelected(palette)} />
            <span className="wb-mini" aria-hidden="true">{palette.colors.map((color) => <i key={color} style={{ backgroundColor: color }} />)}</span>
            <strong>{palette.name}</strong>
            <span>{palette.note}</span>
          </label>
        ))}
      </fieldset>

      <section className="wb-card" aria-labelledby="swatches-title">
        <div className="wb-card-head">
          <h2 id="swatches-title">{selected.name}</h2>
          <button type="button" className="wb-button-plain" onClick={() => copyKey("all", selected.colors.join("\n"))}>
            {isCopied("all") ? <><CheckIcon />Copied</> : <><CopyIcon />Copy all HEX</>}
          </button>
        </div>
        <div className="wb-swatches">
          {selected.colors.map((color) => (
            <button key={color} type="button" style={{ backgroundColor: color }} onClick={() => copyKey(color, color)} aria-label={`Copy ${color}`}>
              <span>{isCopied(color) ? "Copied" : color}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="wb-pane wb-export" aria-labelledby="export-title">
        <div className="wb-pane-head">
          <h2 id="export-title">Export</h2>
          <div className="wb-pane-tools">
            <Segmented label="Format" options={FORMATS} value={format} onChange={setFormat} />
            <button type="button" className="wb-button" onClick={() => copyKey("code", code)}>
              {isCopied("code") ? <><CheckIcon />Copied</> : <><CopyIcon />Copy</>}
            </button>
          </div>
        </div>
        <pre className="wb-code"><code>{code}</code></pre>
      </section>
      <p className="wb-sr" role="status" aria-live="polite">{announcement}</p>

      <p className="wb-hint">Six fixed sample palettes. No contrast check or palette generation.</p>
    </Workbench>
  );
}
