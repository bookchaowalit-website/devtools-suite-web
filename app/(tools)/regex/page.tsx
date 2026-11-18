"use client";

import { useMemo, useState } from "react";
import { AlertIcon, CheckIcon, CopyBlocked, CopyIcon, ToolIntro, useCopy, Workbench } from "@/components/workbench";
import { FLAGS, MAX_MATCHES, MAX_REPLACE_OUTPUT, replaceAll, runRegex, segments, toLiteral } from "@/lib/regex/run";

const groupClass = (group: number) => `wb-group wb-group-${((group - 1) % 3) + 1}`;

export default function RegexTool() {
  // String.raw keeps the backslashes: in a normal string "\b" is a backspace character.
  const [pattern, setPattern] = useState(String.raw`\b\w+\b`);
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState("The quick brown fox jumps over the lazy dog.");
  // null until you type in Replace: an empty replacement is a real one (it deletes each match).
  const [replacement, setReplacement] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const literal = toLiteral(pattern, flags);
  const { copied, blocked, copy } = useCopy(literal, (ok) => setAnnouncement(ok ? "Pattern copied to the clipboard." : "Copy was blocked. Select the pattern and copy it by hand."));

  // Live result: the pattern runs on every keystroke.
  const result = useMemo(() => runRegex(pattern, flags, text), [pattern, flags, text]);
  const parts = useMemo(() => segments(text, result.matches), [text, result.matches]);
  // Only computed once Replace is in use, and capped, so a large paste never stalls typing.
  const replaced = useMemo(() => (replacement === null ? null : replaceAll(pattern, flags, text, replacement)), [pattern, flags, text, replacement]);
  const replacedCopy = useCopy(replaced?.value ?? "", (ok) => setAnnouncement(ok ? "Replaced text copied to the clipboard." : "Copy was blocked. Select the replaced text and copy it by hand."));
  const groupCount = result.matches.reduce((most, match) => Math.max(most, match.groups.length), 0);
  const groupHeads = Array.from({ length: groupCount }, (_, index) => result.names?.[index] ? `${index + 1} · ${result.names[index]}` : `Group ${index + 1}`);
  const toggle = (flag: string) => setFlags((current) => (current.includes(flag) ? current.replace(flag, "") : FLAGS.map((f) => f.flag).filter((f) => f === flag || current.includes(f)).join("")));
  const count = `${result.matches.length}${result.matches.length >= MAX_MATCHES ? "+" : ""} ${result.matches.length === 1 ? "match" : "matches"}`;

  return (
    <Workbench>
      <ToolIntro title="Regex Tester" summary="Type a JavaScript regular expression and some text to see every match, its position and its groups." />

      <section className="wb-card" aria-labelledby="pattern-label">
        <label id="pattern-label" htmlFor="regex-pattern" className="wb-expression-label">Pattern</label>
        <div className="wb-expression wb-regex">
          <span aria-hidden="true">/</span>
          <input id="regex-pattern" value={pattern} onChange={(event) => setPattern(event.target.value)} spellCheck={false} autoComplete="off" aria-invalid={result.error ? true : undefined} aria-describedby={result.error ? "regex-error" : undefined} />
          <span aria-hidden="true">/{flags}</span>
          <button type="button" className="wb-button" onClick={() => copy(literal)} disabled={!pattern || Boolean(result.error)}>
            {copied ? <><CheckIcon />Copied</> : <><CopyIcon />Copy</>}
          </button>
        </div>
        <CopyBlocked show={blocked} what="the pattern" />
        {result.error ? <p id="regex-error" className="wb-error wb-error-inline" role="alert"><AlertIcon />{result.error}</p> : null}
        {/* Each flag says what it does on screen (not in a hover-only title), and the chips scroll sideways on phones. */}
        <div className="wb-chips wb-chips-scroll wb-chips-described" role="group" aria-label="Flags">
          {FLAGS.map(({ flag, name, hint }) => (
            <button key={flag} type="button" aria-pressed={flags.includes(flag)} onClick={() => toggle(flag)}>
              <span><code>{flag}</code> {name}</span>
              <small>{hint}</small>
            </button>
          ))}
        </div>
      </section>
      <p className="wb-sr" role="status" aria-live="polite">{announcement}</p>

      {/* Test text comes first in the DOM and on screen, so Tab reaches the editor before the results everywhere.
          On phones the editor is compact (it scrolls inside), which keeps the match count and highlight in the first screen. */}
      <div className="wb-panes wb-panes-gap wb-regex-panes">
        <section className="wb-pane">
          <div className="wb-pane-head">
            <label htmlFor="regex-text">Test text</label>
            <button type="button" className="wb-button-plain" onClick={() => setText("")} disabled={!text}>Clear</button>
          </div>
          <textarea id="regex-text" rows={3} value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste text to search" spellCheck={false} />
          <p className="wb-pane-meta">{text.length} characters</p>
        </section>
        <section className="wb-pane" aria-labelledby="regex-preview">
          <div className="wb-pane-head">
            <h2 id="regex-preview">Matches highlighted</h2>
            <span className="wb-muted" aria-live="polite">{count}</span>
          </div>
          {/* Focusable so keyboard users can scroll it when it is capped on phones (Safari does not focus scroll boxes). */}
          <div className="wb-highlight" role="region" aria-label="Highlighted matches" tabIndex={0}>
            {text ? parts.map((part, index) => (part.match ? (
              <mark key={index} className={(part.index ?? 0) % 2 ? "is-alt" : undefined}>
                <span className="wb-sr">[match {(part.index ?? 0) + 1}: </span>
                {part.pieces ? part.pieces.map((piece, at) => (piece.group ? <span key={at} className={groupClass(piece.group)} title={`Group ${piece.group}`}>{piece.text}</span> : <span key={at}>{piece.text}</span>)) : part.text}
                <span className="wb-sr">]</span>
              </mark>
            ) : <span key={index}>{part.text}</span>)) : <span className="wb-muted">Matches appear here.</span>}
          </div>
        </section>
      </div>

      <section className="wb-card wb-panes-gap" aria-labelledby="regex-list">
        <h2 id="regex-list">Match list</h2>
        {result.matches.length ? (
          <div className="wb-table-wrap wb-table-flat">
            <table className="wb-table">
              <thead>
                <tr>
                  <th scope="col">#</th><th scope="col">Match</th><th scope="col">Index</th>
                  {groupHeads.map((head, index) => <th key={index} scope="col"><span className={groupClass(index + 1)}>{head}</span></th>)}
                </tr>
              </thead>
              <tbody>
                {result.matches.slice(0, 200).map((match, index) => (
                  <tr key={index}>
                    <th scope="row">{index + 1}</th>
                    <td>{match.value === "" ? <em>(empty)</em> : match.value}</td>
                    <td>{match.index}</td>
                    {groupHeads.map((_, group) => {
                      const value = match.groups[group];
                      return <td key={group}>{value === undefined ? <em>not matched</em> : value === "" ? <em>(empty)</em> : value}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="wb-note">{result.error ? "Fix the pattern to see matches." : "No matches."}</p>
        )}
        {result.matches.length > 200 ? <p className="wb-note">Showing the first 200 of {result.matches.length}.</p> : null}
        {result.matches.length && !groupCount ? <p className="wb-note">No capture groups. Wrap part of the pattern in ( ) to capture it.</p> : null}
      </section>

      <section className="wb-pane wb-panes-gap" aria-labelledby="regex-replace-title">
        <div className="wb-pane-head">
          <h2 id="regex-replace-title">Replace</h2>
          <button type="button" className="wb-button-plain" onClick={() => replaced && replacedCopy.copy(replaced.value)} disabled={!replaced || Boolean(replaced.error) || replaced.truncated}>
            {replacedCopy.copied ? <><CheckIcon />Copied</> : <><CopyIcon />Copy result</>}
          </button>
        </div>
        <div className="wb-card-body">
          <label className="wb-input">Replace with <span className="wb-muted">$1, $&lt;name&gt; and $&amp; insert groups</span>
            <input value={replacement ?? ""} onChange={(event) => setReplacement(event.target.value)} placeholder="e.g. [$&], or leave empty to delete each match" spellCheck={false} autoComplete="off" />
          </label>
        </div>
        <CopyBlocked show={replacedCopy.blocked} what="the replaced text" />
        {replaced?.truncated ? <p className="wb-note wb-card-body">Very long result: showing the first {MAX_REPLACE_OUTPUT.toLocaleString("en")} characters, or the text after the first {MAX_MATCHES} replacements. Copy is off for a partial result.</p> : null}
        <pre className="wb-code wb-code-wrap" aria-label="Text after replace">{replaced ? (replaced.error ? "Fix the pattern to replace." : replaced.value === "" ? <span className="wb-muted">(empty: every character was replaced by nothing)</span> : replaced.value) : <span className="wb-muted">Type a replacement to see the text after replace. Type and delete to replace with nothing.</span>}</pre>
      </section>
    </Workbench>
  );
}
