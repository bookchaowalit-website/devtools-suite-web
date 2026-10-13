"use client";

import Link from "next/link";
import { useState } from "react";
type IconName = "check" | "copy" | "pipette";
function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, string> = {
    check: "m5 12 4 4L19 6",
    copy: "M9 9h10v10H9z M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1",
    pipette: "m19 3 2 2-9.5 9.5-3 1-1 3-3 1 1-3 3-1 9.5-9.5Z",
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>;
}

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.split("").map((part) => part + part).join("") : value;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return { r: parseInt(full.slice(0, 2), 16), g: parseInt(full.slice(2, 4), 16), b: parseInt(full.slice(4, 6), 16) };
}
function rgbToHex(r: number, g: number, b: number) { return `#${[r, g, b].map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0")).join("")}`; }
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255; const max = Math.max(r, g, b); const min = Math.min(r, g, b); const lightness = (max + min) / 2; const delta = max - min; let hue = 0; let saturation = 0;
  if (delta) { saturation = lightness > .5 ? delta / (2 - max - min) : delta / (max + min); switch (max) { case r: hue = (g - b) / delta + (g < b ? 6 : 0); break; case g: hue = (b - r) / delta + 2; break; default: hue = (r - g) / delta + 4; } hue /= 6; }
  return { h: Math.round(hue * 360), s: Math.round(saturation * 100), l: Math.round(lightness * 100) };
}

export default function Home() {
  const [hex, setHex] = useState("#4f46e5");
  const [copied, setCopied] = useState<string | null>(null);
  const rgb = hexToRgb(hex) ?? { r: 79, g: 70, b: 229 };
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const safeHex = rgbToHex(rgb.r, rgb.g, rgb.b);
  const setColor = (value: string) => setHex(value.startsWith("#") ? value : `#${value}`);
  const setRgb = (channel: "r" | "g" | "b", value: number) => setHex(rgbToHex(channel === "r" ? value : rgb.r, channel === "g" ? value : rgb.g, channel === "b" ? value : rgb.b));
  const copy = async (key: string, value: string) => { try { await navigator.clipboard.writeText(value); setCopied(key); window.setTimeout(() => setCopied(null), 1500); } catch { setCopied(null); } };
  const rows = [{ key: "hex", label: "HEX", value: safeHex }, { key: "rgb", label: "RGB", value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` }, { key: "hsl", label: "HSL", value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` }];

  return (
    <main className="picker-shell">
      <header className="picker-nav"><Link href="/" className="picker-brand"><Icon name="pipette" /> COLOR / PICKER</Link><span>CLIENT-SIDE UTILITY <i /> NO SERVER REQUIRED</span></header>
      <section className="picker-hero"><p className="picker-kicker">COLOR LAB / SINGLE SOURCE</p><h1>One color.<br /><em>Every handoff.</em></h1><p>Choose visually, inspect the exact values, and send the format your next tool understands.</p></section>
      <section className="picker-lab" aria-label="Color conversion bench">
        <div className="picker-stage" style={{ backgroundColor: safeHex }}>
          <div className="picker-stage-top"><span>ACTIVE SWATCH</span><label className="picker-native-input"><input type="color" value={safeHex} onChange={(event) => setHex(event.target.value)} aria-label="Choose color" /><Icon name="pipette" /> Change</label></div>
          <div className="picker-stage-bottom"><span>SELECTED VALUE</span><strong>{safeHex.toUpperCase()}</strong></div>
        </div>
        <div className="picker-readout">
          <div className="picker-readout-head"><span>VALUE LEDGER</span><span>LIVE / 01</span></div>
          <label className="picker-hex-field"><span>HEX</span><input value={hex} onChange={(event) => { const value = event.target.value; if (/^#?[0-9a-fA-F]{0,6}$/.test(value)) setColor(value); }} aria-label="HEX value" /></label>
          <div className="picker-rgb-fields">{(["r", "g", "b"] as const).map((channel) => <label key={channel}><span>{channel.toUpperCase()}</span><input type="number" min={0} max={255} value={rgb[channel]} onChange={(event) => setRgb(channel, clamp(Number(event.target.value), 0, 255))} aria-label={`${channel.toUpperCase()} value`} /></label>)}</div>
          <div className="picker-output-list">{rows.map((row) => <div className="picker-output" key={row.key}><span>{row.label}</span><code>{row.value}</code><button onClick={() => void copy(row.key, row.value)} type="button">{copied === row.key ? <><Icon name="check" size={14} /> COPIED</> : <><Icon name="copy" size={14} /> COPY</>}</button></div>)}</div>
          <p className="picker-note">Text values are the source of truth. Copy feedback stays in this browser.</p>
        </div>
      </section>
      <footer className="picker-footer"><span>BOOKCHAOWALIT / DEVELOPER TOOLS</span><span>DATA STAYS IN YOUR BROWSER</span></footer>
    </main>
  );
}
