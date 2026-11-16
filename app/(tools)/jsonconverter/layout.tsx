import type { Metadata } from "next";
import { toolOpenGraph } from "@/lib/site";

export const metadata: Metadata = {
  title: "JSON Converter",
  description: "Format JSON and move simple data between JSON and YAML in the browser.",
  alternates: { canonical: "/jsonconverter" },
  openGraph: toolOpenGraph("jsonconverter", "JSON Converter", "Format JSON and move simple data between JSON and YAML in the browser."),
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="tool-root t-jsonconverter">{children}</div>;
}
