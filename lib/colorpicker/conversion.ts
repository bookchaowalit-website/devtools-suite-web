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
