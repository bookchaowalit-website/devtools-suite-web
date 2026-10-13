import type { Metadata } from "next";
import "./tool.css";



export const metadata: Metadata = {
  title: "Engineering Calculator",
  description: "An illustrative field instrument for beam-load checks.",
  alternates: { canonical: "/engineering-calc" },
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className={`tool-root t-engineering-calc antialiased`}>{children}</div>;
}
