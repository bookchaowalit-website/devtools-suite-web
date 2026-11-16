import type { Metadata } from "next";
import { toolOpenGraph } from "@/lib/site";

export const metadata: Metadata = {
  title: "Markdown Editor",
  description: "Split-pane Markdown editor with a lightweight live preview.",
  alternates: { canonical: "/markdown-editor" },
  openGraph: toolOpenGraph("markdown-editor", "Markdown Editor", "Split-pane Markdown editor with a lightweight live preview."),
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="tool-root t-markdown-editor">{children}</div>;
}
