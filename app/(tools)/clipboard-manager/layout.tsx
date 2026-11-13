import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clipboard Manager",
  description: "Local-only clipboard history snippets stored in localStorage.",
  alternates: { canonical: "/clipboard-manager" },
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="tool-root t-clipboard-manager">{children}</div>;
}
