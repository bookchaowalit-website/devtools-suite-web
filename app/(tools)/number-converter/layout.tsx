import type { Metadata } from "next";
import { toolOpenGraph } from "@/lib/site";

export const metadata: Metadata = {
  title: "Number Base Converter",
  description: "Convert integers between binary, octal, decimal, and hexadecimal.",
  alternates: { canonical: "/number-converter" },
  openGraph: toolOpenGraph("number-converter", "Number Base Converter", "Convert integers between binary, octal, decimal, and hexadecimal."),
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="tool-root t-number-converter">{children}</div>;
}
