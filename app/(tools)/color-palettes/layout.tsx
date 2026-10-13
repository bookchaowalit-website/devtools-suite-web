import type { Metadata } from "next";
import { Outfit, DM_Mono } from "next/font/google";
import "./tool.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});
const dmMono = DM_Mono({
  variable: "--font-dm",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Swatch Library — color token shelf",
  description: "Browse preset palettes and export as CSS, Tailwind, or JSON.",
  alternates: { canonical: "/color-palettes" },
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className={`tool-root t-color-palettes ${outfit.variable} ${dmMono.variable} antialiased`}>{children}</div>;
}
