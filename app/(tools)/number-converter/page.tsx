"use client";

import { useState } from "react";
import { AlertIcon, CheckIcon, CopyIcon, ToolIntro, useCopy, Workbench } from "@/components/workbench";
import { parseInteger } from "@/lib/number-converter/conversion";

type Base = "bin" | "oct" | "dec" | "hex";
const BASES: { base: Base; radix: number; name: string; hint: string }[] = [
  { base: "dec", radix: 10, name: "Decimal", hint: "Base 10" },
  { base: "hex", radix: 16, name: "Hexadecimal", hint: "Base 16, 0–9 a–f" },
  { base: "bin", radix: 2, name: "Binary", hint: "Base 2, 0 and 1" },
  { base: "oct", radix: 8, name: "Octal", hint: "Base 8, 0–7" },
];
const EMPTY: Record<Base, string> = { bin: "", oct: "", dec: "", hex: "" };

const nameOf = (base: Base) => BASES.find((entry) => entry.base === base)?.name ?? base;

function fromInteger(number: bigint): Record<Base, string> {
  return { bin: number.toString(2), oct: number.toString(8), dec: number.toString(10), hex: number.toString(16) };
}

export default function NumberConverterTool() {
  const [values, setValues] = useState<Record<Base, string>>(fromInteger(BigInt(10)));
  const [error, setError] = useState<{ base: Base; message: string } | null>(null);
  const [copiedBase, setCopiedBase] = useState<Base | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const { copied, copy } = useCopy(copiedBase ? values[copiedBase] : "", (ok) =>
    setAnnouncement(ok ? "Value copied to the clipboard." : "Copy was blocked. Select the value and copy it by hand."));

  const updateFrom = (base: Base, radix: number, raw: string) => {
    if (!raw.trim()) { setValues(EMPTY); setError(null); return; }
    try {
      setValues(fromInteger(parseInteger(raw, radix)));
      setError(null);
    } catch (cause) {
      // Keep what was typed in this field; the other fields still show the last valid number.
      setValues((current) => ({ ...current, [base]: raw }));
      setError({ base, message: cause instanceof Error ? cause.message : "This value cannot be converted." });
    }
  };

  return (
    <Workbench>
      <ToolIntro title="Number Base Converter" summary="Type a whole number in any field and the other three follow. Works with very large and negative integers." />

      <div className="wb-fields">
        {BASES.map(({ base, radix, name, hint }) => {
          const invalid = error?.base === base;
          // While another field is invalid this one still holds the last valid number: show it muted.
          const stale = Boolean(error) && !invalid;
          return (
            <div className="wb-field" key={base} data-invalid={invalid ? "true" : undefined} data-stale={stale ? "true" : undefined}>
              <label htmlFor={`n-${base}`}>{name}<small>{hint}</small></label>
              <input
                id={`n-${base}`}
                value={values[base]}
                onChange={(event) => updateFrom(base, radix, event.target.value)}
                inputMode={base === "dec" ? "numeric" : "text"}
                spellCheck={false}
                autoComplete="off"
                aria-invalid={invalid ? true : undefined}
                aria-describedby={invalid || stale ? "n-error" : undefined}
              />
              <button type="button" className="wb-button-plain" disabled={!values[base] || Boolean(error)} onClick={() => { setCopiedBase(base); void copy(values[base]); }} aria-label={`Copy ${name.toLowerCase()} value`}>
                {copied && copiedBase === base ? <><CheckIcon />Copied</> : <><CopyIcon />Copy</>}
              </button>
            </div>
          );
        })}
        {error ? (
          <p id="n-error" className="wb-error" role="alert">
            <AlertIcon />
            <span><strong>{nameOf(error.base)}:</strong> {error.message} The other fields still show the last valid number, muted, until this one is fixed.</span>
          </p>
        ) : null}
      </div>
      <p className="wb-sr" role="status" aria-live="polite">{announcement}</p>

      <p className="wb-hint">Integers only. A leading - makes the number negative; hexadecimal also accepts a 0x prefix.</p>
    </Workbench>
  );
}
