import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Latency Test",
  description: "Ping a URL from the browser.",
  alternates: { canonical: "/latency-test" },
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="tool-root t-latency-test">{children}</div>;
}
