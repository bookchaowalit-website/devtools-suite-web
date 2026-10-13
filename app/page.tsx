import Link from "next/link";
import { SUITE_NAME } from "@/lib/site";
import { TOOLS, toolPath } from "@/lib/tools";

export default function Catalog() {
  return (
    <div className="catalog">
      <h1>{SUITE_NAME}</h1>
      <p className="catalog-lede">
        {TOOLS.length} developer tools in one place. Every tool runs in your browser; nothing you type is uploaded.
      </p>
      <ul className="catalog-grid" aria-label="Tools">
        {TOOLS.map((tool) => (
          <li key={tool.slug}>
            <Link href={toolPath(tool)} className="catalog-card">
              <h2>{tool.name}</h2>
              <p>{tool.description}</p>
              <code>{toolPath(tool)}</code>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
