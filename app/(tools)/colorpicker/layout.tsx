import type { Metadata } from "next";
import { toolOpenGraph } from "@/lib/site";

export const metadata: Metadata = {
  title: "Color Picker",
  description: "Pick a color and convert between HEX, RGB, and HSL.",
  alternates: { canonical: "/colorpicker" },
  openGraph: toolOpenGraph("colorpicker", "Color Picker", "Pick a color and convert between HEX, RGB, and HSL."),
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="tool-root t-colorpicker">{children}</div>;
}
