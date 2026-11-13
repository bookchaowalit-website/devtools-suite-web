import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Number Base Converter",
  description: "Convert integers between binary, octal, decimal, and hexadecimal.",
  alternates: { canonical: "/number-converter" },
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="tool-root t-number-converter">{children}</div>;
}
