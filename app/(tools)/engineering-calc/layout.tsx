import type { Metadata } from "next";
import { toolOpenGraph } from "@/lib/site";

export const metadata: Metadata = {
  title: "Engineering Calculator",
  description: "An illustrative field instrument for beam-load checks.",
  alternates: { canonical: "/engineering-calc" },
  openGraph: toolOpenGraph("engineering-calc", "Engineering Calculator", "An illustrative field instrument for beam-load checks."),
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="tool-root t-engineering-calc">{children}</div>;
}
