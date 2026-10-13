import type { Metadata } from "next";
import "./tool.css";



export const metadata: Metadata = {
  title: "JSON Converter",
  description: "Format JSON and move simple data between JSON and YAML in the browser.",
  alternates: { canonical: "/jsonconverter" },
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className={`tool-root t-jsonconverter antialiased`}>{children}</div>;
}
