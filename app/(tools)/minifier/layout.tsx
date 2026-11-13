import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Code Minifier",
  description: "Lightweight JS / CSS / HTML / JSON minifier that runs entirely client-side.",
  alternates: { canonical: "/minifier" },
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="tool-root t-minifier">{children}</div>;
}
