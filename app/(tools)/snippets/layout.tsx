import type { Metadata } from "next";
import { toolOpenGraph } from "@/lib/site";

export const metadata: Metadata = {
  title: "Snippets",
  description: "A small local code specimen library: filter, read and copy reusable snippets.",
  alternates: { canonical: "/snippets" },
  openGraph: toolOpenGraph("snippets", "Snippets", "A small local code specimen library: filter, read and copy reusable snippets."),
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="tool-root t-snippets">{children}</div>;
}
