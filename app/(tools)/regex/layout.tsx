import type { Metadata } from "next";
import { toolOpenGraph } from "@/lib/site";

export const metadata: Metadata = {
  title: "Regex Tester",
  description: "Test a JavaScript regular expression against text and see every match live.",
  alternates: { canonical: "/regex" },
  openGraph: toolOpenGraph("regex", "Regex Tester", "Test a JavaScript regular expression against text and see every match live."),
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="tool-root t-regex">{children}</div>;
}
