import type { NextConfig } from "next";
import { SUBDOMAIN_REDIRECTS } from "./lib/redirects";

// The suite's canonical host. Former standalone tool subdomains are attached to
// this project and redirect permanently to their route here.
const SUITE_ORIGIN = "https://devtools.bookchaowalit.com";

const nextConfig: NextConfig = {
  async redirects() {
    return Object.entries(SUBDOMAIN_REDIRECTS).map(([host, path]) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: `${SUITE_ORIGIN}${path}`,
      permanent: true,
    }));
  },
};

export default nextConfig;
