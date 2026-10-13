"use client";

import { useMemo, useState, type ReactNode } from "react";

type Match = { value: string; index: number; groups: string[] };

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="press-field">
      <span className="press-field-label">{label}</span>
      {children}
      {hint ? <span className="press-field-hint">{hint}</span> : null}
    </label>
  );
}

const FLAGS = ["g", "i", "m", "s", "u", "y"];

export default function Home() {
  const [pattern, setPattern] = useState("\b\w+\b");
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState("The quick brown fox jumps over the lazy dog.");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    try {
      const re = new RegExp(pattern, flags);
      const matches: Match[] = [];
      if (flags.includes("g")) {
        const runner = new RegExp(pattern, flags);
        let match: RegExpExecArray | null;
        while ((match = runner.exec(text)) !== null) {
          matches.push({ value: match[0], index: match.index, groups: match.slice(1) });
          if (match[0] === "") runner.lastIndex += 1;
        }
      } else {
        const match = re.exec(text);
        if (match) matches.push({ value: match[0], index: match.index, groups: match.slice(1) });
      }
      return { re, matches, error: "" };
    } catch (error) {
      return {
        re: null,
        matches: [] as Match[],
        error: error instanceof Error ? error.message : "Invalid JavaScript pattern",
      };
    }
  }, [flags, pattern, text]);

  const highlighted = useMemo(() => {
    if (!result.re || result.matches.length === 0) return text;
    const parts: ReactNode[] = [];
    let cursor = 0;
    result.matches.forEach((match, index) => {
      if (match.index > cursor) parts.push(text.slice(cursor, match.index));
      parts.push(
        <mark key={index} className="proof-mark">
          {match.value || "empty"}
        </mark>,
      );
      cursor = match.index + match.value.length;
    });
    if (cursor < text.length) parts.push(text.slice(cursor));
    return parts;
  }, [result, text]);

  async function handleCopy() {
    setCopied(await copyText(pattern));
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <main className="press-shell">
      <div className="press-sheet">
        <header className="press-masthead">
          <div className="press-brand">
            <span className="press-brand-mark" aria-hidden="true">PP</span>
            <span>PATTERN / PRESS</span>
          </div>
          <div className="press-meta">
            <span>JAVASCRIPT ONLY</span>
            <span>NO SERVER</span>
          </div>
        </header>

        <section className="press-hero">
          <div>
            <h1>
              Print the pattern.
              <br />
              <em>Read the proof.</em>
            </h1>
            <p>
              Set a JavaScript expression, feed it a line of text, and inspect the
              marks it leaves behind.
            </p>
          </div>
          <div className="press-proof-count">
            <strong>{result.matches.length.toString().padStart(2, "0")}</strong>
            <span>matches on<br />this proof</span>
          </div>
        </section>

        <section className="press-workbench">
          <section className="press-compose" aria-labelledby="compose-title">
            <div className="press-section-line">
              <span className="press-section-index">A / COMPOSE</span>
              <span>Live typesetting</span>
            </div>
            <h2 id="compose-title">Set the form.</h2>
            <Field label="Pattern" hint="JavaScript RegExp syntax">
              <div className="press-pattern-row">
                <span className="press-slash" aria-hidden="true">/</span>
                <input
                  className="press-input press-pattern-input"
                  value={pattern}
                  onChange={(event) => setPattern(event.target.value)}
                  spellCheck={false}
                  aria-label="Pattern"
                />
                <span className="press-slash" aria-hidden="true">/</span>
              </div>
            </Field>
            <div className="press-flags">
              <span className="press-field-label">FLAGS</span>
              <div className="press-flag-list">
                {FLAGS.map((flag) => {
                  const active = flags.includes(flag);
                  return (
                    <button
                      key={flag}
                      type="button"
                      className={"press-flag " + (active ? "is-active" : "")}
                      aria-pressed={active}
                      onClick={() =>
                        setFlags((current) =>
                          active ? current.replace(flag, "") : current + flag,
                        )
                      }
                    >
                      {flag}
                    </button>
                  );
                })}
              </div>
            </div>
            <Field label="Test string">
              <textarea
                className="press-input press-textarea"
                value={text}
                onChange={(event) => setText(event.target.value)}
                aria-label="Test string"
              />
            </Field>
            <button className="press-copy" type="button" onClick={handleCopy}>
              {copied ? "Pattern copied" : "Copy pattern"}
            </button>
            {result.error ? (
              <p className="press-error" role="alert">
                Pattern could not be printed: {result.error}
              </p>
            ) : null}
          </section>

          <section className="press-proof" aria-labelledby="proof-title">
            <div className="press-section-line">
              <span className="press-section-index">B / PROOF</span>
              <span>{flags || "no flags"} active</span>
            </div>
            <h2 id="proof-title">Read the impression.</h2>
            <div className="press-proof-paper">
              <div className="press-proof-header">
                <span>TEST STRING / 01</span>
                <span>{text.length} characters</span>
              </div>
              <p className="press-highlighted">{highlighted}</p>
            </div>
            <div className="press-match-list">
              <div className="press-match-header">
                <span>INDEXED IMPRESSIONS</span>
                <span>{result.matches.length} total</span>
              </div>
              {result.matches.length === 0 ? (
                <p className="press-empty">No marks on this proof.</p>
              ) : (
                <ol>
                  {result.matches.map((match, index) => (
                    <li key={index}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>{JSON.stringify(match.value)}</strong>
                      <small>index {match.index}{match.groups.length ? " · groups " + JSON.stringify(match.groups) : ""}</small>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>
        </section>

        <footer className="press-footer">
          <span>BOOK / DEV TOOLS</span>
          <span>COMPOSE · PROOF · INSPECT</span>
        </footer>
      </div>
    </main>
  );
}
