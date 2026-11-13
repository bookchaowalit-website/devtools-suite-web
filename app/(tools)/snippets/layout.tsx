import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Snippets",
  description: "A small local code specimen library: filter, read and copy reusable snippets.",
  alternates: { canonical: "/snippets" },
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="tool-root t-snippets">{children}</div>;
}
