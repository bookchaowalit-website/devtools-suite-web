import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Regex Tester",
  description: "Test a JavaScript regular expression against text and see every match live.",
  alternates: { canonical: "/regex" },
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="tool-root t-regex">{children}</div>;
}
