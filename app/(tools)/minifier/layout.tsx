import type { Metadata } from "next";
import { toolOpenGraph } from "@/lib/site";

export const metadata: Metadata = {
  title: "Code Minifier",
  description: "Lightweight JS / CSS / HTML / JSON minifier that runs entirely client-side.",
  alternates: { canonical: "/minifier" },
  openGraph: toolOpenGraph("minifier", "Code Minifier", "Lightweight JS / CSS / HTML / JSON minifier that runs entirely client-side."),
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="tool-root t-minifier">{children}</div>;
}
