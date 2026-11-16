import type { Metadata } from "next";
import { toolOpenGraph } from "@/lib/site";

export const metadata: Metadata = {
  title: "Diff Checker",
  description: "Compare two texts line-by-line and highlight additions and removals.",
  alternates: { canonical: "/diffchecker" },
  openGraph: toolOpenGraph("diffchecker", "Diff Checker", "Compare two texts line-by-line and highlight additions and removals."),
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="tool-root t-diffchecker">{children}</div>;
}
