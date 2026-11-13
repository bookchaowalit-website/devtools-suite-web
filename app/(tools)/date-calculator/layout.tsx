import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Date Calculator",
  description: "Compute date differences and add or subtract days, weeks, or months.",
  alternates: { canonical: "/date-calculator" },
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="tool-root t-date-calculator">{children}</div>;
}
