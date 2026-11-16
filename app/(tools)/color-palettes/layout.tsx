import type { Metadata } from "next";
import { toolOpenGraph } from "@/lib/site";

export const metadata: Metadata = {
  title: "Color Palettes",
  description: "Browse preset palettes and export as CSS, Tailwind, or JSON.",
  alternates: { canonical: "/color-palettes" },
  openGraph: toolOpenGraph("color-palettes", "Color Palettes", "Browse preset palettes and export as CSS, Tailwind, or JSON."),
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="tool-root t-color-palettes">{children}</div>;
}
