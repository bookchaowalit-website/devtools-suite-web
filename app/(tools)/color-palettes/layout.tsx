import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Color Palettes",
  description: "Browse preset palettes and export as CSS, Tailwind, or JSON.",
  alternates: { canonical: "/color-palettes" },
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="tool-root t-color-palettes">{children}</div>;
}
