"use client";

import { useMemo, useState } from "react";
import { AlertIcon, CheckIcon, CopyIcon, ToolIntro, useCopy, Workbench } from "@/components/workbench";
import { FLAGS, MAX_MATCHES, runRegex, segments, toLiteral } from "@/lib/regex/run";

export default function RegexTool() {
  // String.raw keeps the backslashes: in a normal string "\b" is a backspace character.
  const [pattern, setPattern] = useState(String.raw`\b\w+\b`);
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState("The quick brown fox jumps over the lazy dog.");
  const [announcement, setAnnouncement] = useState("");
  const literal = toLiteral(pattern, flags);
  const { copied, copy } = useCopy(literal, (ok) => setAnnouncement(ok ? "Pattern copied to the clipboard." : "Copy was blocked. Select the pattern and copy it by hand."));

  // Live result: the pattern runs on every keystroke.
  const result = useMemo(() => runRegex(pattern, flags, text), [pattern, flags, text]);
  const parts = useMemo(() => segments(text, result.matches), [text, result.matches]);
  const toggle = (flag: string) => setFlags((current) => (current.includes(flag) ? current.replace(flag, "") : FLAGS.map((f) => f.flag).filter((f) => f === flag || current.includes(f)).join("")));

  return (
    <Workbench>
      <ToolIntro title="Regex Tester" summary="Type a JavaScript regular expression and some text to see every match, its position and its groups." />

      <section className="wb-card" aria-labelledby="pattern-label">
        <div className="wb-expression wb-regex">
          <span aria-hidden="true">/</span>
          <label id="pattern-label" htmlFor="regex-pattern" className="wb-sr">Pattern</label>
          <input id="regex-pattern" value={pattern} onChange={(event) => setPattern(event.target.value)} spellCheck={false} autoComplete="off" aria-invalid={result.error ? true : undefined} aria-describedby={result.error ? "regex-error" : undefined} />
          <span aria-hidden="true">/{flags}</span>
          <button type="button" className="wb-button" onClick={() => copy(literal)} disabled={!pattern || Boolean(result.error)}>
            {copied ? <><CheckIcon />Copied</> : <><CopyIcon />Copy</>}
          </button>
        </div>
        {result.error ? <p id="regex-error" className="wb-error wb-error-inline" role="alert"><AlertIcon />{result.error}</p> : null}
        <div className="wb-chips" role="group" aria-label="Flags">
          {FLAGS.map(({ flag, name, hint }) => (
            <button key={flag} type="button" aria-pressed={flags.includes(flag)} onClick={() => toggle(flag)} title={hint}>
              <code>{flag}</code> {name}
            </button>
          ))}
        </div>
      </section>
      <p className="wb-sr" role="status" aria-live="polite">{announcement}</p>

      <div className="wb-panes wb-panes-gap wb-panes-result-first">
        {/* The result comes first in the DOM, as it is shown first on phones, so Tab follows the screen; the
            desktop grid puts it back in the right-hand column. */}
        <section className="wb-pane" aria-labelledby="regex-preview">
          <div className="wb-pane-head">
            <h2 id="regex-preview">Matches highlighted</h2>
            <span className="wb-muted" aria-live="polite">{result.matches.length}{result.matches.length >= MAX_MATCHES ? "+" : ""} {result.matches.length === 1 ? "match" : "matches"}</span>
          </div>
          {/* Focusable so keyboard users can scroll it when it is capped on phones (Safari does not focus scroll boxes). */}
          <div className="wb-highlight" role="region" aria-label="Highlighted matches" tabIndex={0}>
            {text ? parts.map((part, index) => (part.match ? <mark key={index}>{part.text}</mark> : <span key={index}>{part.text}</span>)) : <span className="wb-muted">Matches appear here.</span>}
          </div>
        </section>
        <section className="wb-pane">
          <div className="wb-pane-head">
            <label htmlFor="regex-text">Test text</label>
            <button type="button" className="wb-button-plain" onClick={() => setText("")} disabled={!text}>Clear</button>
          </div>
          <textarea id="regex-text" value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste text to search" spellCheck={false} />
          <p className="wb-pane-meta">{text.length} characters</p>
        </section>
      </div>

      <section className="wb-card wb-panes-gap" aria-labelledby="regex-list">
        <h2 id="regex-list">Match list</h2>
        {result.matches.length ? (
          <div className="wb-table-wrap wb-table-flat">
            <table className="wb-table">
              <thead><tr><th scope="col">#</th><th scope="col">Match</th><th scope="col">Index</th><th scope="col">Groups</th></tr></thead>
              <tbody>
                {result.matches.slice(0, 200).map((match, index) => (
                  <tr key={index}>
                    <th scope="row">{index + 1}</th>
                    <td>{match.value === "" ? <em>(empty)</em> : match.value}</td>
                    <td>{match.index}</td>
                    <td>{match.groups.length ? match.groups.map((group) => group ?? "undefined").join(" · ") : <em>none</em>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="wb-note">{result.error ? "Fix the pattern to see matches." : "No matches."}</p>
        )}
        {result.matches.length > 200 ? <p className="wb-note">Showing the first 200 of {result.matches.length}.</p> : null}
      </section>
    </Workbench>
  );
}
