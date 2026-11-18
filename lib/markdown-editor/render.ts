/** Validate a link after decoding obfuscations, while retaining its escaped display URL. */
function isSafeLink(url: string): boolean {
  let decoded = url;
  for (let pass = 0; pass < 4; pass++) {
    const before = decoded;
    decoded = decoded.replace(/&amp;/gi, "&").replace(/&colon;/gi, ":")
      .replace(/&#(x[0-9a-f]+|[0-9]+);?/gi, (_, code: string) => {
        const point = code[0].toLowerCase() === "x" ? parseInt(code.slice(1), 16) : parseInt(code, 10);
        return point <= 0x10ffff ? String.fromCodePoint(point) : "";
      });
    try { decoded = decodeURIComponent(decoded); } catch { /* A literal percent in a path can remain unchanged. */ }
    if (decoded === before) break;
  }
  const candidate = decoded.replace(/[\u0000-\u0020\u007f-\u009f]/g, "");
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(candidate);
  if (scheme) return /^(https?|mailto)$/i.test(scheme[1]);
  // A colon before a slash, fragment or query can be a browser-interpreted scheme.
  return !candidate.split(/[/?#]/, 1)[0].includes(":");
}

export function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const TABLE_RULE = /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;
const cells = (row: string) => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());

/**
 * Small Markdown renderer: headings 1–6, bold, italic, code, links, quotes, fenced code, bullet and numbered lists
 * (nested by two-space indents) and pipe tables. HTML in the source is escaped first.
 * `headingOffset` moves every heading down (1 turns "#" into <h2>), for a preview inside a page that owns the h1;
 * such headings carry class="md-hN" so they keep the size of the level that was written.
 */
export function renderMarkdown(source: string, { headingOffset = 0 }: { headingOffset?: number } = {}) {
  const escaped = escapeHtml(source);
  let inCode = false;
  const lists: { type: "ul" | "ol"; indent: number }[] = [];
  const output: string[] = [];
  const closeList = () => { while (lists.length) output.push(`</li></${lists.pop()?.type}>`); };
  const inline = (line: string) => line
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label: string, url: string) =>
      isSafeLink(url) ? `<a href="${url}" rel="noreferrer">${label}</a>` : label);
  const listItem = (indent: number, type: "ul" | "ol", start: number, text: string) => {
    while (lists.length && lists[lists.length - 1].indent > indent) output.push(`</li></${lists.pop()?.type}>`);
    const top = lists[lists.length - 1];
    if (top && top.indent === indent && top.type !== type) { output.push(`</li></${lists.pop()?.type}>`); }
    const current = lists[lists.length - 1];
    if (current && current.indent === indent) output.push("</li>");
    else { output.push(type === "ol" && start !== 1 ? `<ol start="${start}">` : `<${type}>`); lists.push({ type, indent }); }
    output.push(`<li>${inline(text)}`);
  };
  const lines = escaped.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.startsWith("```")) { if (inCode) { output.push("</code></pre>"); inCode = false; } else { closeList(); output.push("<pre><code>"); inCode = true; } continue; }
    if (inCode) { output.push(line + "\n"); continue; }
    const heading = /^(#{1,6}) (.*)$/.exec(line);
    const bullet = /^( *)[-*+] (.*)$/.exec(line);
    const numbered = /^( *)(\d{1,9})[.)] (.*)$/.exec(line);
    if (heading) {
      closeList();
      const written = heading[1].length;
      const level = Math.min(6, written + headingOffset);
      output.push(headingOffset ? `<h${level} class="md-h${written}">${inline(heading[2])}</h${level}>` : `<h${level}>${inline(heading[2])}</h${level}>`);
    } else if (/^&gt; /.test(line)) { closeList(); output.push(`<blockquote>${inline(line.replace(/^&gt; /, ""))}</blockquote>`); }
    else if (bullet) listItem(Math.floor(bullet[1].length / 2), "ul", 1, bullet[2]);
    else if (numbered) listItem(Math.floor(numbered[1].length / 2), "ol", Number(numbered[2]), numbered[3]);
    else if (line.includes("|") && TABLE_RULE.test(lines[index + 1] ?? "")) {
      closeList();
      const head = cells(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) rows.push(cells(lines[index++]));
      index -= 1;
      const row = (values: string[], tag: "th" | "td") => `<tr>${head.map((_, column) => `<${tag}${tag === "th" ? ' scope="col"' : ""}>${inline(values[column] ?? "")}</${tag}>`).join("")}</tr>`;
      output.push(`<table><thead>${row(head, "th")}</thead><tbody>${rows.map((values) => row(values, "td")).join("")}</tbody></table>`);
    }
    else if (!line.trim()) { closeList(); output.push("<br />"); }
    else { closeList(); output.push(`<p>${inline(line)}</p>`); }
  }
  closeList(); if (inCode) output.push("</code></pre>");
  return output.join("");
}
