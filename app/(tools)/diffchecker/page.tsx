"use client";

import { useMemo, useState } from "react";
import { lineDiff } from "@/lib/diffchecker/diff";


export default function Home() {
  const [left, setLeft] = useState("Hello World\nThis is the first text.\nShared line");
  const [right, setRight] = useState("Hello World\nThis is the second text.\nShared line\nExtra");
  const [status, setStatus] = useState("COMPARISON LIVE / LOCAL TEXT");
  const ops = useMemo(() => lineDiff(left, right), [left, right]);
  const stats = useMemo(() => ({ add: ops.filter((op) => op.type === "add").length, del: ops.filter((op) => op.type === "del").length, equal: ops.filter((op) => op.type === "equal").length }), [ops]);
  const clear = () => { setLeft(""); setRight(""); setStatus("EVIDENCE CLEARED / READY"); };
  const swap = () => { setLeft(right); setRight(left); setStatus("COLUMNS SWAPPED / COMPARISON LIVE"); };

  return (
    <main className="proof-page">
      <div className="proof-shell">
        <header className="proof-header"><div className="proof-brand"><span>BOOKCHAOWALIT / TEXT FORENSICS</span><strong>DIFF / DESK</strong></div><p aria-live="polite">{status}</p><span className="proof-mode">LINE LEVEL / NO UPLOAD</span></header>
        <section className="proof-intro" aria-labelledby="page-title"><h1 id="page-title">Find the changed line.</h1><p>Lay two versions side by side. The evidence stays in this browser while the comparison marks what moved, what stayed, and what arrived.</p></section>
        <section className="proof-inputs" aria-label="Text evidence"><label><span>01 / ORIGINAL</span><textarea value={left} onChange={(event) => { setLeft(event.target.value); setStatus("EVIDENCE UPDATED / ORIGINAL"); }} aria-label="Original text" spellCheck={false} /></label><div className="proof-divider" aria-hidden="true">VS</div><label><span>02 / MODIFIED</span><textarea value={right} onChange={(event) => { setRight(event.target.value); setStatus("EVIDENCE UPDATED / MODIFIED"); }} aria-label="Modified text" spellCheck={false} /></label></section>
        <div className="proof-actions"><button type="button" className="proof-primary" onClick={() => setStatus("REPORT READY / READ THE MARKS")}>Run comparison</button><button type="button" onClick={swap}>Swap evidence</button><button type="button" onClick={clear}>Clear desk</button></div>
        <section className="proof-report" aria-labelledby="report-title"><div className="proof-report-head"><div><span>REPORT / LINE LEDGER</span><h2 id="report-title">Marked evidence</h2></div><dl><div><dt>ADDED</dt><dd className="is-added">+{stats.add}</dd></div><div><dt>REMOVED</dt><dd className="is-removed">−{stats.del}</dd></div><div><dt>SHARED</dt><dd>{stats.equal}</dd></div></dl></div><div className="proof-legend"><span><b className="mark-add">+</b> added to modified</span><span><b className="mark-del">−</b> removed from original</span><span><b> </b> unchanged</span></div><div className="proof-lines">{ops.map((op, index) => <div key={`${op.type}-${index}`} className={`proof-line is-${op.type}`}><span className="line-no">{op.left ?? "·"}</span><span className="line-no">{op.right ?? "·"}</span><span className="line-mark" aria-hidden="true">{op.type === "add" ? "+" : op.type === "del" ? "−" : " "}</span><code>{op.line || " "}</code></div>)}</div></section>
        <footer className="proof-footer">LCS-STYLE LINE COMPARISON / CHARACTER AND WORD MODES NOT CLAIMED / LOCAL ONLY</footer>
      </div>
    </main>
  );
}
