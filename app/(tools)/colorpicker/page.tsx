"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, ToolIntro, useCopy, Workbench } from "@/components/workbench";
import { clamp, hexToRgb, rgbToHex, rgbToHsl } from "@/lib/colorpicker/conversion";

type Channel = "r" | "g" | "b";
const CHANNELS: { key: Channel; name: string }[] = [{ key: "r", name: "Red" }, { key: "g", name: "Green" }, { key: "b", name: "Blue" }];

const PipetteIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m19 3 2 2-9.5 9.5-3 1-1 3-3 1 1-3 3-1 9.5-9.5Z" />
  </svg>
);

export default function ColorPickerTool() {
  const [color, setColor] = useState("#4f46e5");
  // What is in the HEX field while typing; the color only changes once it is a valid 3- or 6-digit hex.
  const [hexDraft, setHexDraft] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const rgb = hexToRgb(color) ?? { r: 79, g: 70, b: 229 };
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const rows = [
    { key: "hex", label: "HEX", value: color.toUpperCase() },
    { key: "rgb", label: "RGB", value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
    { key: "hsl", label: "HSL", value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
  ];
  const copiedValue = rows.find((row) => row.key === copiedKey)?.value ?? "";
  const { copied, copy } = useCopy(copiedValue, (ok) => setAnnouncement(ok ? "Color copied to the clipboard." : "Copy was blocked. Select the value and copy it by hand."));

  const hexText = hexDraft ?? color.toUpperCase();
  const hexInvalid = hexDraft !== null && hexToRgb(hexDraft) === null;
  const typeHex = (raw: string) => {
    const value = raw.trim();
    if (!/^#?[0-9a-fA-F]{0,6}$/.test(value)) return;
    const parsed = hexToRgb(value);
    if (parsed) { setColor(rgbToHex(parsed.r, parsed.g, parsed.b)); setHexDraft(null); }
    else setHexDraft(value);
  };
  const setChannel = (channel: Channel, raw: string) => {
    const next = { ...rgb, [channel]: clamp(Math.round(Number(raw) || 0), 0, 255) };
    setColor(rgbToHex(next.r, next.g, next.b));
    setHexDraft(null);
  };

  return (
    <Workbench>
      <ToolIntro title="Color Picker" summary="Pick a color, then read or copy it as HEX, RGB or HSL." />

      <div className="wb-color">
        <div className="wb-swatch" style={{ backgroundColor: color }}>
          <label className="wb-swatch-pick">
            <PipetteIcon />Pick color
            <input type="color" value={color} onChange={(event) => { setColor(event.target.value); setHexDraft(null); }} />
          </label>
          <span className="wb-swatch-value">{color.toUpperCase()}</span>
        </div>

        <div className="wb-cards">
          <section className="wb-card" aria-labelledby="edit-title">
            <h2 id="edit-title">Edit</h2>
            <div className="wb-inputs">
              <label className="wb-input">HEX
                <input value={hexText} onChange={(event) => typeHex(event.target.value)} onBlur={() => setHexDraft(null)} spellCheck={false} autoComplete="off" aria-invalid={hexInvalid ? true : undefined} aria-describedby="hex-hint" />
              </label>
            </div>
            <p id="hex-hint" className="wb-note">{hexInvalid ? "Type 3 or 6 hex digits, e.g. #4F46E5." : "3 or 6 hex digits, with or without #."}</p>
            <div className="wb-inputs wb-inputs-gap">
              {CHANNELS.map(({ key, name }) => (
                <label className="wb-input" key={key}>{name}
                  <input type="number" min={0} max={255} step={1} inputMode="numeric" value={rgb[key]} onChange={(event) => setChannel(key, event.target.value)} />
                </label>
              ))}
            </div>
          </section>

          <div className="wb-fields" role="group" aria-label="Color values">
            {rows.map((row) => (
              <div className="wb-field" key={row.key}>
                <span className="wb-field-label">{row.label}</span>
                <code>{row.value}</code>
                <button type="button" className="wb-button-plain" onClick={() => { setCopiedKey(row.key); void copy(row.value); }} aria-label={`Copy ${row.label} value`}>
                  {copied && copiedKey === row.key ? <><CheckIcon />Copied</> : <><CopyIcon />Copy</>}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="wb-sr" role="status" aria-live="polite">{announcement}</p>
    </Workbench>
  );
}
