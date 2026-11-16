import type { Metadata } from "next";
import { toolOpenGraph } from "@/lib/site";

export const metadata: Metadata = {
  title: "Latency Test",
  description: "Ping a URL from the browser.",
  alternates: { canonical: "/latency-test" },
  openGraph: toolOpenGraph("latency-test", "Latency Test", "Ping a URL from the browser."),
};

export default function ToolLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="tool-root t-latency-test">{children}</div>;
}
