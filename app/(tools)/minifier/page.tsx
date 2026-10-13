"use client";

import { useState, type ReactNode } from "react";

type Mode = "json" | "css" | "html" | "js";

const SAMPLES: Record<Mode, string> = {
  json: '{\n  "project": "solo-empire",\n  "ships": ["tools", "stories"],\n  "active": true\n}',
  css: `/* A small component */\n.card {\n  color: #17211b;\n  padding: 16px 20px;\n  border: 1px solid #17211b;\n}`,
  html: `<!-- A small document -->\n<article class="note">\n  <h2>Ship the useful thing</h2>\n  <p>Small files travel faster.</p>\n</article>`,
  js: `// A small function\nfunction greet(name) {\n  const message = "Hello, " + name;\n  return message;\n}`,
};

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function minify(mode: Mode, input: string): string {
  if (mode === "json") return JSON.stringify(JSON.parse(input));
  if (mode === "css") {
    return input
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s+/g, " ")
      .replace(/\s*([{}:;,])\s*/g, "$1")
      .trim();
  }
  if (mode === "html") {
    return input
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/>\s+</g, "><")
      .replace(/\s{2,}/g, " ")
      .trim();
  }
  const withoutComments = input.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
  return withoutComments
    .replace(/\s+/g, " ")
    .replace(/\s*([{};,=+\-*/%<>!&|?:])\s*/g, "$1")
    .trim();
}

function Action({
  children,
  onClick,
  disabled = false,
  muted = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  muted?: boolean;
}) {
  return (
    <button type="button" className={`chamber-action${muted ? " chamber-action-muted" : ""}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("json");
  const [input, setInput] = useState(SAMPLES.json);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const run = () => {
    setError("");
    try {
      setOutput(minify(mode, input));
    } catch (cause) {
      setOutput("");
      setError(cause instanceof Error ? cause.message : "This input could not be minified.");
    }
  };

  const chooseMode = (nextMode: Mode) => {
    setMode(nextMode);
    setInput(SAMPLES[nextMode]);
    setOutput("");
    setError("");
    setCopied(false);
  };

  const saved = input.length && output.length ? Math.max(0, Math.round((1 - output.length / input.length) * 100)) : 0;

  return (
    <main className="compression-shell">
      <div className="compression-frame">
        <header className="chamber-topbar">
          <a className="brand-lockup" href="https://bookchaowalit.com" aria-label="Bookchaowalit home">
            <span className="brand-stamp">B/</span>
            <span>BOOKCHAOWALIT</span>
          </a>
          <span className="topbar-note">LOCAL TOOL / 01</span>
        </header>

        <section className="chamber-intro">
          <div className="intro-mark" aria-hidden="true">&lt; 0 &gt;</div>
          <div>
            <p className="section-label">COMPRESSION CHAMBER</p>
            <h1>Make it smaller.<br /><em>Keep the shape.</em></h1>
            <p className="intro-copy">A small, honest bench for stripping whitespace from the code that is ready to travel.</p>
          </div>
          <p className="boundary-note">NO UPLOADS<br />NO PIPELINE<br />BROWSER ONLY</p>
        </section>

        <section className="chamber-tool" aria-label="Code minifier">
          <div className="tool-rail">
            <div>
              <p className="section-label">MATERIAL</p>
              <p className="rail-copy">Choose the shape of the source.</p>
            </div>
            <div className="mode-strip" role="tablist" aria-label="Source type">
              {(Object.keys(SAMPLES) as Mode[]).map((item) => (
                <button key={item} type="button" role="tab" aria-selected={mode === item} className={`mode-tab${mode === item ? " mode-tab-active" : ""}`} onClick={() => chooseMode(item)}>
                  .{item}
                </button>
              ))}
            </div>
            <Action onClick={run}>Run chamber <span aria-hidden="true">→</span></Action>
          </div>

          <div className="chamber-grid">
            <label className="material-panel">
              <span className="panel-heading"><span>01 / SOURCE</span><span>{input.length} chars</span></span>
              <textarea aria-label="Source code" className="material-editor" value={input} onChange={(event) => { setInput(event.target.value); setOutput(""); setError(""); }} spellCheck={false} />
            </label>
            <div className="material-panel output-panel">
              <span className="panel-heading"><span>02 / COMPACTED</span><span>{output.length ? `${output.length} chars` : "waiting"}</span></span>
              {output ? (
                <textarea aria-label="Minified output" className="material-editor" value={output} readOnly spellCheck={false} />
              ) : (
                <div className="output-empty"><span className="empty-seal">&lt; / &gt;</span><p>Run the chamber<br />to see the compacted form.</p></div>
              )}
            </div>
          </div>

          <div className="chamber-status" aria-live="polite">
            <div className="status-cell"><span className="status-label">SOURCE</span><strong>{input.length.toLocaleString()} B</strong></div>
            <div className="status-arrow" aria-hidden="true">→</div>
            <div className="status-cell"><span className="status-label">OUTPUT</span><strong>{output ? `${output.length.toLocaleString()} B` : "—"}</strong></div>
            <div className="status-cell status-saved"><span className="status-label">SPACE RETURNED</span><strong>{output ? `${saved}%` : "—"}</strong></div>
            <Action muted disabled={!output} onClick={async () => { if (await copyText(output)) { setCopied(true); setTimeout(() => setCopied(false), 1500); } }}>{copied ? "Copied to clipboard" : "Copy output"}</Action>
          </div>
          {error ? <p className="chamber-error" role="alert">Input error: {error}</p> : null}
        </section>

        <footer className="chamber-footer">
          <p>THE SMALL PRINT</p>
          <p>Simple client-side transforms for snippets and demos. This is not a production compiler or security boundary. Your source stays in this browser.</p>
          <span>BOOK / DEV TOOLS</span>
        </footer>
      </div>
    </main>
  );
}
