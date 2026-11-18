"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The header's "All tools" link. On the home page it would only point back at the page you are on, next to the
 * brand link that already does, so it is left out there; tool pages still get it.
 */
export function SuiteHomeLink() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <Link href="/" className="suite-home">All tools</Link>;
}
