import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Color Picker",
  description: "Pick a color and convert between HEX, RGB, and HSL.",
  alternates: { canonical: "/colorpicker" },
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="tool-root t-colorpicker">{children}</div>;
}
