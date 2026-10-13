import type { Metadata } from "next";
import "./tool.css";



export const metadata: Metadata = {
  title: "Coded Message Desk",
  description: "Encode and decode URL components in the browser.",
  alternates: { canonical: "/url-encoder" },
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className={`tool-root t-url-encoder antialiased`}>{children}</div>;
}
