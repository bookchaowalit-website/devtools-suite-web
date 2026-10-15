export function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
export function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.split("").map((part) => part + part).join("") : value;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return { r: parseInt(full.slice(0, 2), 16), g: parseInt(full.slice(2, 4), 16), b: parseInt(full.slice(4, 6), 16) };
}
export function rgbToHex(r: number, g: number, b: number) { return `#${[r, g, b].map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0")).join("")}`; }
export function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255; const max = Math.max(r, g, b); const min = Math.min(r, g, b); const lightness = (max + min) / 2; const delta = max - min; let hue = 0; let saturation = 0;
  if (delta) { saturation = lightness > .5 ? delta / (2 - max - min) : delta / (max + min); switch (max) { case r: hue = (g - b) / delta + (g < b ? 6 : 0); break; case g: hue = (b - r) / delta + 2; break; default: hue = (r - g) / delta + 4; } hue /= 6; }
  return { h: Math.round(hue * 360), s: Math.round(saturation * 100), l: Math.round(lightness * 100) };
}

/** HSL uses degrees/percentages; hue wraps and saturation/lightness are bounded. */
export function hslToRgb(h: number, s: number, l: number) {
  if (![h, s, l].every(Number.isFinite)) throw new RangeError("HSL channels must be finite numbers.");
  const hue = ((h % 360) + 360) % 360 / 60;
  const saturation = clamp(s, 0, 100) / 100;
  const lightness = clamp(l, 0, 100) / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs(hue % 2 - 1));
  const [r, g, b] = hue < 1 ? [chroma, x, 0]
    : hue < 2 ? [x, chroma, 0]
    : hue < 3 ? [0, chroma, x]
    : hue < 4 ? [0, x, chroma]
    : hue < 5 ? [x, 0, chroma]
    : [chroma, 0, x];
  const offset = lightness - chroma / 2;
  return { r: Math.round((r + offset) * 255), g: Math.round((g + offset) * 255), b: Math.round((b + offset) * 255) };
}

export function hslToHex(h: number, s: number, l: number) {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}
