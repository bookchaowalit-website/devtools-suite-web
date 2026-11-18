"use client";

import { useState } from "react";
import { AlertIcon, CheckIcon, CopyIcon, ToolIntro, useCopy, Workbench } from "@/components/workbench";
import { type Base, editField, initialFields, shownValue } from "@/lib/number-converter/fields";

const BASES: { base: Base; name: string; hint: string }[] = [
  { base: "dec", name: "Decimal", hint: "Base 10" },
  { base: "hex", name: "Hexadecimal", hint: "Base 16, 0–9 a–f" },
  { base: "bin", name: "Binary", hint: "Base 2, 0 and 1" },
  { base: "oct", name: "Octal", hint: "Base 8, 0–7" },
];

const nameOf = (base: Base) => BASES.find((entry) => entry.base === base)?.name ?? base;

export default function NumberConverterTool() {
  const [fields, setFields] = useState(() => initialFields(BigInt(10)));
  const [copiedBase, setCopiedBase] = useState<Base | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const error = fields.draft;
  const { copied, copy } = useCopy(copiedBase ? fields.valid[copiedBase] : "", (ok) =>
    setAnnouncement(ok ? "Value copied to the clipboard." : "Copy was blocked. Select the value and copy it by hand."));

  // Only the field being edited keeps invalid text; the other three always show the last valid number.
  const updateFrom = (base: Base, raw: string) => setFields((current) => editField(current, base, raw));

  return (
    <Workbench>
      <ToolIntro title="Number Base Converter" summary="Type a whole number in any field and the other three follow. Works with very large and negative integers." />

      <div className="wb-fields">
        {BASES.map(({ base, name, hint }) => {
          const invalid = error?.base === base;
          // While another field is invalid this one still holds the last valid number: show it muted.
          const stale = Boolean(error) && !invalid;
          return (
            <div className="wb-field" key={base} data-invalid={invalid ? "true" : undefined} data-stale={stale ? "true" : undefined}>
              <label htmlFor={`n-${base}`}>{name}<small>{hint}</small></label>
              <input
                id={`n-${base}`}
                value={shownValue(fields, base)}
                onChange={(event) => updateFrom(base, event.target.value)}
                inputMode={base === "dec" ? "numeric" : "text"}
                spellCheck={false}
                autoComplete="off"
                aria-invalid={invalid ? true : undefined}
                aria-describedby={invalid || stale ? "n-error" : undefined}
              />
              <button type="button" className="wb-button-plain" disabled={!fields.valid[base] || Boolean(error)} onClick={() => { setCopiedBase(base); void copy(fields.valid[base]); }} aria-label={`Copy ${name.toLowerCase()} value`}>
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
