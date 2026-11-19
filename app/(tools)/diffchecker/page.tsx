"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { AlertIcon, CheckIcon, CopyBlocked, CopyIcon, SwapIcon, ToolIntro, UndoToast, useCopy, useUndo, Workbench } from "@/components/workbench";
import { diffLines, patchPath, unifiedDiff, wordDiffs, type Op, type WordPart } from "@/lib/diffchecker/diff";

/** A changed line with the words that differ from its partner line highlighted (when a word diff was computed). */
function ChangedLine({ op, parts }: { op: Op; parts?: WordPart[] }) {
  if (!parts) return <>{op.line || " "}</>;
  return <>{parts.map((part, index) => (part.changed ? <span key={index} className={op.type === "del" ? "wb-word-del" : "wb-word-add"}>{part.text}</span> : <span key={index}>{part.text}</span>))}</>;
}

export default function DiffCheckerTool() {
  const [left, setLeft] = useState("Hello World\nThis is the first text.\nShared line\n");
  const [right, setRight] = useState("Hello World\nThis is the second text.\nShared line\nExtra\n");
  const [announcement, setAnnouncement] = useState("");
  const [fileName, setFileName] = useState("file.txt");
  const undo = useUndo();
  // Live comparison: the diff follows both texts, deferred so typing in a long text stays responsive.
  const deferredLeft = useDeferredValue(left);
  const deferredRight = useDeferredValue(right);
  const { ops, approximate } = useMemo(() => diffLines(deferredLeft, deferredRight), [deferredLeft, deferredRight]);
  // Word diffs are computed once per pair, within a total budget, and skipped when the line diff is approximate.
  const words = useMemo(() => wordDiffs(ops, approximate), [ops, approximate]);
  // The deferred comparison can lag one render behind the boxes: Copy waits until it matches what is on screen.
  const current = deferredLeft === left && deferredRight === right;
  const added = ops.filter((op) => op.type === "add").length;
  const removed = ops.filter((op) => op.type === "del").length;
  const same = ops.length - added - removed;
  const unified = useMemo(() => (added || removed ? unifiedDiff(deferredLeft, deferredRight, { file: fileName }) : ""), [deferredLeft, deferredRight, added, removed, fileName]);
  const { copied, blocked, copy } = useCopy(unified, (ok) => setAnnouncement(ok ? "Diff copied to the clipboard as a unified diff." : "Copy was blocked. Select the differences and copy them by hand."));

  const swap = () => { setLeft(right); setRight(left); undo.dismiss(); setAnnouncement("Swapped original and changed text."); };
  const clear = () => {
    const before = { left, right };
    setLeft(""); setRight("");
    undo.offer("Both texts cleared.", () => { setLeft(before.left); setRight(before.right); });
  };

  return (
    <Workbench>
      <ToolIntro title="Diff Checker" summary="Paste two versions of a text to see which lines were added, removed or kept." />

      <div className="wb-panes">
        <section className="wb-pane">
          <div className="wb-pane-head"><label htmlFor="diff-left">Original</label></div>
          <textarea id="diff-left" value={left} onChange={(event) => { setLeft(event.target.value); undo.dismiss(); }} placeholder="Paste the original text" spellCheck={false} autoComplete="off" />
        </section>
        <section className="wb-pane">
          <div className="wb-pane-head"><label htmlFor="diff-right">Changed</label></div>
          <textarea id="diff-right" value={right} onChange={(event) => { setRight(event.target.value); undo.dismiss(); }} placeholder="Paste the changed text" spellCheck={false} autoComplete="off" />
        </section>
      </div>
      {/* Actions that touch both texts sit under both panes, not in one pane's header. */}
      <div className="wb-actions">
        <button type="button" className="wb-button-plain" onClick={swap} disabled={!left && !right} aria-label="Swap: exchange original and changed text">
          <SwapIcon />Swap sides
        </button>
        <button type="button" className="wb-button-plain" onClick={clear} disabled={!left && !right}>Clear both</button>
        <label className="wb-input wb-input-inline">File name in the patch
          <input value={fileName} onChange={(event) => setFileName(event.target.value)} spellCheck={false} autoComplete="off" placeholder="file.txt" aria-describedby="diff-file-hint" />
        </label>
      </div>
      <p id="diff-file-hint" className="wb-note">Copy diff writes a/{patchPath(fileName)} and b/{patchPath(fileName)}, so <code>git apply</code> run in the folder that holds it finds the file.</p>
      <p className="wb-sr" role="status" aria-live="polite">{announcement}</p>

      <section className="wb-diff" aria-labelledby="diff-title">
        <div className="wb-diff-head">
          <h2 id="diff-title">Differences</h2>
          <div className="wb-diff-tools">
            {ops.length ? (
              <p className="wb-diff-stats">
                <span className="is-added">+{added} added</span>
                <span className="is-removed">−{removed} removed</span>
                <span>{same} unchanged</span>
              </p>
            ) : null}
            <button type="button" className="wb-button" onClick={() => copy(unified)} disabled={!unified || !current}>
              {!current ? "Comparing…" : copied ? <><CheckIcon />Copied</> : <><CopyIcon />Copy diff</>}
            </button>
          </div>
        </div>
        {blocked ? (
          <div className="wb-diff-fallback">
            <CopyBlocked show what="the patch below (it has the file and hunk headers git apply needs)" />
            <label className="wb-sr" htmlFor="diff-unified">Unified diff to copy by hand</label>
            <textarea id="diff-unified" className="wb-unified" value={unified} readOnly rows={Math.min(12, unified.split("\n").length)} spellCheck={false} onFocus={(event) => event.currentTarget.select()} />
          </div>
        ) : null}
        {approximate ? <p className="wb-note wb-note-alert wb-diff-empty"><AlertIcon />These texts are too long to compare line by line here, so the changed middle part is shown as removed, then added.</p> : null}
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
                  {op.type === "equal" ? op.line || " " : <ChangedLine op={op} parts={words.get(index)} />}
                  {op.noEol ? <span className="wb-noeol"> (no newline at end)</span> : null}
                </code>
              </div>
            ))}
          </div>
        )}
      </section>
      <UndoToast state={undo} />

      <p className="wb-hint">Compares whole lines. A changed line shows as one line removed and one added, with the words that differ highlighted. Copy diff gives a unified diff that git apply and patch accept.</p>
    </Workbench>
  );
}
