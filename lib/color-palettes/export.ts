export type Palette = { name: string; note: string; colors: string[] };

export const cssTokens = (palette: Palette) => `:root {\n${palette.colors.map((color, index) => `  --color-${index + 1}: ${color};`).join("\n")}\n}`;
export const tailwindTokens = (palette: Palette) => `colors: {\n${palette.colors.map((color, index) => `  ${palette.name.toLowerCase()}-${index + 1}: "${color}",`).join("\n")}\n}`;
export const jsonTokens = (palette: Palette) => JSON.stringify({ name: palette.name, colors: palette.colors }, null, 2);
