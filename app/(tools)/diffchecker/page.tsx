"use client";

import { useMemo, useState } from "react";
import { SwapIcon, ToolIntro, Workbench } from "@/components/workbench";
import { lineDiff } from "@/lib/diffchecker/diff";

export default function DiffCheckerTool() {
  const [left, setLeft] = useState("Hello World\nThis is the first text.\nShared line");
  const [right, setRight] = useState("Hello World\nThis is the second text.\nShared line\nExtra");
  const [announcement, setAnnouncement] = useState("");
  // Live comparison: the diff follows both texts as you type.
  const ops = useMemo(() => lineDiff(left, right), [left, right]);
  const added = ops.filter((op) => op.type === "add").length;
  const removed = ops.filter((op) => op.type === "del").length;
  const same = ops.length - added - removed;

  const swap = () => { setLeft(right); setRight(left); setAnnouncement("Swapped original and changed text."); };
  const clear = () => { setLeft(""); setRight(""); setAnnouncement("Cleared both texts."); };

  return (
    <Workbench>
      <ToolIntro title="Diff Checker" summary="Paste two versions of a text to see which lines were added, removed or kept." />

      <div className="wb-panes">
        <section className="wb-pane">
          <div className="wb-pane-head">
            <label htmlFor="diff-left">Original</label>
            <button type="button" className="wb-button-plain" onClick={clear} disabled={!left && !right}>Clear both</button>
          </div>
          <textarea id="diff-left" value={left} onChange={(event) => setLeft(event.target.value)} placeholder="Paste the original text" spellCheck={false} autoComplete="off" />
        </section>
        <section className="wb-pane">
          <div className="wb-pane-head">
            <label htmlFor="diff-right">Changed</label>
            <button type="button" className="wb-button-plain" onClick={swap} disabled={!left && !right} aria-label="Swap: exchange original and changed text">
              <SwapIcon />Swap
            </button>
          </div>
          <textarea id="diff-right" value={right} onChange={(event) => setRight(event.target.value)} placeholder="Paste the changed text" spellCheck={false} autoComplete="off" />
        </section>
      </div>
      <p className="wb-sr" role="status" aria-live="polite">{announcement}</p>

      <section className="wb-diff" aria-labelledby="diff-title">
        <div className="wb-diff-head">
          <h2 id="diff-title">Differences</h2>
          {ops.length ? (
            <p className="wb-diff-stats">
              <span className="is-added">+{added} added</span>
              <span className="is-removed">−{removed} removed</span>
              <span>{same} unchanged</span>
            </p>
          ) : null}
        </div>
        {ops.length === 0 ? (
          <p className="wb-note wb-diff-empty">Paste text into both boxes to compare them.</p>
        ) : added === 0 && removed === 0 ? (
          <p className="wb-note wb-diff-empty">The two texts are identical.</p>
        ) : (
          <div className="wb-diff-lines" role="list" aria-label="Line by line comparison">
            {ops.map((op, index) => (
              <div key={`${op.type}-${index}`} role="listitem" className={`wb-diff-line is-${op.type}`}>
                <span className="no" aria-hidden="true">{op.left ?? ""}</span>
                <span className="no" aria-hidden="true">{op.right ?? ""}</span>
                <span className="mark" aria-hidden="true">{op.type === "add" ? "+" : op.type === "del" ? "−" : ""}</span>
                <code>
                  {op.type !== "equal" ? <span className="wb-sr">{op.type === "add" ? "Added: " : "Removed: "}</span> : null}
                  {op.line || " "}
                </code>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="wb-hint">Compares whole lines. A changed line shows as one line removed and one added.</p>
    </Workbench>
  );
}
