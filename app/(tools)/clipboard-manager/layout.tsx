import type { Metadata } from "next";
import { toolOpenGraph } from "@/lib/site";

export const metadata: Metadata = {
  title: "Clipboard Manager",
  description: "Local-only clipboard history snippets stored in localStorage.",
  alternates: { canonical: "/clipboard-manager" },
  openGraph: toolOpenGraph("clipboard-manager", "Clipboard Manager", "Local-only clipboard history snippets stored in localStorage."),
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="tool-root t-clipboard-manager">{children}</div>;
}
