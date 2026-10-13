"use client";

import { useState } from "react";

type Base = "bin" | "oct" | "dec" | "hex";
const RADIX: Record<Base, number> = { bin: 2, oct: 8, dec: 10, hex: 16 };
const LABELS: Record<Base, { name: string; prefix: string; hint: string }> = {
  bin: { name: "Binary", prefix: "0b", hint: "two symbols / 0 and 1" },
  oct: { name: "Octal", prefix: "0o", hint: "eight symbols / 0 to 7" },
  dec: { name: "Decimal", prefix: "10", hint: "the everyday baseline" },
  hex: { name: "Hexadecimal", prefix: "0x", hint: "sixteen symbols / 0 to f" },
};
const BASES: Base[] = ["bin", "oct", "dec", "hex"];

async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

function parseInteger(raw: string, radix: number) {
  let value = raw.trim();
  let negative = false;
  if (value.startsWith("-")) { negative = true; value = value.slice(1); }
  if (radix === 16) value = value.replace(/^0x/i, "");
  const patterns: Record<number, RegExp> = { 2: /^[01]+$/, 8: /^[0-7]+$/, 10: /^\d+$/, 16: /^[0-9a-f]+$/i };
  if (!value || !patterns[radix].test(value)) throw new Error("Use only the digits allowed by this base.");
  let number = BigInt(0);
  const digits = "0123456789abcdefghijklmnopqrstuvwxyz";
  for (const character of value.toLowerCase()) {
    const digit = BigInt(digits.indexOf(character));
    if (digit < 0 || digit >= BigInt(radix)) throw new Error("This digit is outside the selected base.");
    number = number * BigInt(radix) + digit;
  }
  return negative ? -number : number;
}

export default function Home() {
  const [values, setValues] = useState<Record<Base, string>>({ bin: "1010", oct: "12", dec: "10", hex: "a" });
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<Base | null>(null);

  const updateFrom = (base: Base, raw: string) => {
    if (!raw.trim()) { setValues({ bin: "", oct: "", dec: "", hex: "" }); setError(""); return; }
    try {
      const number = parseInteger(raw, RADIX[base]);
      setValues({ bin: number.toString(2), oct: number.toString(8), dec: number.toString(10), hex: number.toString(16) });
      setError("");
    } catch (cause) {
      setValues((current) => ({ ...current, [base]: raw }));
      setError(cause instanceof Error ? cause.message : "This value cannot be converted.");
    }
  };

  return (
    <main className="radix-shell">
      <div className="radix-frame">
        <header className="radix-topbar">
          <a href="https://bookchaowalit.com" className="radix-mark" aria-label="Bookchaowalit home"><span>BASE</span> / 4</a>
          <span>INTEGER INSTRUMENT</span>
          <span>BIGINT / LOCAL</span>
        </header>

        <section className="radix-intro">
          <div>
            <h1>See the same number<br /><em>in four voices.</em></h1>
            <p>Type into any register. The other three follow, so place value becomes something you can see and check.</p>
          </div>
          <div className="radix-signal" aria-hidden="true"><span>0b</span><span>0o</span><b>10</b><span>0x</span></div>
        </section>

        <section className="converter-board" aria-label="Number base converter">
          <div className="board-head"><span>FOUR REGISTERS / ONE INTEGER</span><span>NO FLOATING POINT</span></div>
          <div className="registers">
            {BASES.map((base) => (
              <div className={`register register-${base}`} key={base}>
                <div className="register-label"><span className="register-prefix">{LABELS[base].prefix}</span><span>{LABELS[base].name}</span></div>
                <label><span className="sr-only">{LABELS[base].name} value</span><input value={values[base]} onChange={(event) => updateFrom(base, event.target.value)} spellCheck={false} inputMode={base === "dec" ? "numeric" : "text"} /></label>
                <div className="register-foot"><span>{LABELS[base].hint}</span><button type="button" onClick={async () => { if (await copyText(values[base])) { setCopied(base); setTimeout(() => setCopied(null), 1500); } }}>{copied === base ? "copied" : "copy value"}</button></div>
              </div>
            ))}
          </div>
          {error ? <p className="radix-error" role="alert">Register error: {error}</p> : null}
          <div className="board-foot"><span>EDIT ANY REGISTER</span><span>INTEGER ONLY / NO API / NO HISTORY</span></div>
        </section>

        <footer className="radix-footer"><span>BOOK / DEV TOOLS</span><span>THE RELATIONSHIP IS THE RESULT</span></footer>
      </div>
    </main>
  );
}
