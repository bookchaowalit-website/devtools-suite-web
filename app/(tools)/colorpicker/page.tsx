"use client";

import { useState } from "react";
import { CheckIcon, CopyBlocked, CopyIcon, ToolIntro, useCopy, Workbench } from "@/components/workbench";
import { hexToRgb, parseChannel, rgbToHex, rgbToHsl } from "@/lib/colorpicker/conversion";

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
  // What is in each RGB field while typing; out-of-range or empty text stays (marked invalid) instead of becoming 0.
  const [channelDrafts, setChannelDrafts] = useState<Partial<Record<Channel, string>>>({});
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
  const { copied, blocked, copy } = useCopy(copiedValue, (ok) => setAnnouncement(ok ? "Color copied to the clipboard." : "Copy was blocked. Select the value and copy it by hand."));

  const hexText = hexDraft ?? color.toUpperCase();
  const hexInvalid = hexDraft !== null && hexToRgb(hexDraft) === null;
  const typeHex = (raw: string) => {
    const value = raw.trim();
    if (!/^#?[0-9a-fA-F]{0,6}$/.test(value)) return;
    // Keep exactly what was typed until the field loses focus: "#4f4" is valid, but it may be the
    // start of "#4f46e5", so expanding it to "#44FF44" mid-typing would corrupt the next keystrokes.
    setHexDraft(value);
    const parsed = hexToRgb(value);
    if (parsed) setColor(rgbToHex(parsed.r, parsed.g, parsed.b));
  };
  const setChannel = (channel: Channel, raw: string) => {
    setChannelDrafts((current) => ({ ...current, [channel]: raw }));
    const value = parseChannel(raw);
    if (value === null) return;
    const next = { ...rgb, [channel]: value };
    setColor(rgbToHex(next.r, next.g, next.b));
    setHexDraft(null);
  };
  const invalidChannels = CHANNELS.filter(({ key }) => channelDrafts[key] !== undefined && parseChannel(channelDrafts[key] ?? "") === null);

  return (
    <Workbench>
      <ToolIntro title="Color Picker" summary="Pick a color, then read or copy it as HEX, RGB or HSL." />

      <div className="wb-color">
        <div className="wb-swatch" style={{ backgroundColor: color }}>
          <label className="wb-swatch-pick">
            <PipetteIcon />Pick color
            <input type="color" value={color} onChange={(event) => { setColor(event.target.value); setHexDraft(null); setChannelDrafts({}); }} />
          </label>
          <span className="wb-swatch-value">{color.toUpperCase()}</span>
        </div>

        <div className="wb-cards wb-color-values-first">
          <section className="wb-card" aria-labelledby="edit-title">
            <h2 id="edit-title">Edit</h2>
            <div className="wb-inputs">
              <label className="wb-input">HEX
                <input value={hexText} onChange={(event) => { typeHex(event.target.value); setChannelDrafts({}); }} onBlur={() => setHexDraft(null)} spellCheck={false} autoComplete="off" aria-invalid={hexInvalid ? true : undefined} aria-describedby="hex-hint" />
              </label>
            </div>
            <p id="hex-hint" className="wb-note">{hexInvalid ? "Type 3 or 6 hex digits, e.g. #4F46E5." : "3 or 6 hex digits, with or without #."}</p>
            <div className="wb-inputs wb-inputs-gap wb-inputs-rgb">
              {CHANNELS.map(({ key, name }) => {
                const invalid = invalidChannels.some((channel) => channel.key === key);
                return (
                  <label className="wb-input" key={key}>{name}
                    <input type="number" min={0} max={255} step={1} inputMode="numeric" value={channelDrafts[key] ?? rgb[key]} onChange={(event) => setChannel(key, event.target.value)} onBlur={() => setChannelDrafts((current) => ({ ...current, [key]: undefined }))} aria-invalid={invalid ? true : undefined} aria-describedby="rgb-hint" />
                  </label>
                );
              })}
            </div>
            <p id="rgb-hint" className="wb-note" data-invalid={invalidChannels.length ? "true" : undefined}>
              {invalidChannels.length
                ? `${invalidChannels.map((channel) => channel.name).join(" and ")} must be a whole number from 0 to 255. The color keeps the last valid value.`
                : "Each channel is a whole number from 0 to 255."}
            </p>
          </section>

          <div className="wb-fields wb-fields-compact" role="group" aria-label="Color values">
            {rows.map((row) => (
              <div className="wb-field" key={row.key}>
                <span className="wb-field-label">{row.label}</span>
                <code>{row.value}</code>
                <button type="button" className="wb-button-plain" onClick={() => { setCopiedKey(row.key); void copy(row.value); }} aria-label={`Copy ${row.label} value`}>
                  {copied && copiedKey === row.key ? <><CheckIcon />Copied</> : <><CopyIcon />Copy</>}
                </button>
              </div>
            ))}
            <CopyBlocked show={blocked} what="the value" />
          </div>
        </div>
      </div>
      <p className="wb-sr" role="status" aria-live="polite">{announcement}</p>
    </Workbench>
  );
}
