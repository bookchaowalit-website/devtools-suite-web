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

export function renderMarkdown(source: string) {
  const escaped = escapeHtml(source);
  let inCode = false;
  let listOpen = false;
  const output: string[] = [];
  const closeList = () => { if (listOpen) { output.push("</ul>"); listOpen = false; } };
  const inline = (line: string) => line
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label: string, url: string) =>
      isSafeLink(url) ? `<a href="${url}" rel="noreferrer">${label}</a>` : label);
  for (const line of escaped.split("\n")) {
    if (line.startsWith("```")) { if (inCode) { output.push("</code></pre>"); inCode = false; } else { closeList(); output.push("<pre><code>"); inCode = true; } continue; }
    if (inCode) { output.push(line + "\n"); continue; }
    if (/^### /.test(line)) { closeList(); output.push(`<h3>${inline(line.slice(4))}</h3>`); }
    else if (/^## /.test(line)) { closeList(); output.push(`<h2>${inline(line.slice(3))}</h2>`); }
    else if (/^# /.test(line)) { closeList(); output.push(`<h1>${inline(line.slice(2))}</h1>`); }
    else if (/^&gt; /.test(line)) { closeList(); output.push(`<blockquote>${inline(line.replace(/^&gt; /, ""))}</blockquote>`); }
    else if (/^- /.test(line)) { if (!listOpen) { output.push("<ul>"); listOpen = true; } output.push(`<li>${inline(line.slice(2))}</li>`); }
    else if (!line.trim()) { closeList(); output.push("<br />"); }
    else { closeList(); output.push(`<p>${inline(line)}</p>`); }
  }
  closeList(); if (inCode) output.push("</code></pre>");
  return output.join("");
}
