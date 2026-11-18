"use client";

import { useState } from "react";
import { AlertIcon, Segmented, ToolIntro, Workbench } from "@/components/workbench";
import { convertLoad, formulaFor, FORCE_UNITS, fromKn, LOAD_CASES, LOAD_PRESETS, loadBounds, loadUnit, maxLocations, momentUnit, roundForUnit, solve, SPAN_RANGE, toKn, validate, type ForceUnit, type LoadCaseId } from "@/lib/engineering-calc/beam";

const UNIT_OPTIONS = FORCE_UNITS.map((value) => ({ value, label: value }));

/** A small beam on two supports with the load drawn on it: many arrows for a spread load, one arrow at the centre. */
function BeamDiagram({ caseId }: { caseId: LoadCaseId }) {
  const arrows = caseId === "uniform" ? [16, 40, 64, 88, 112, 136] : [76];
  return (
    <svg className="wb-beam" viewBox="0 0 152 56" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {caseId === "uniform" ? <path d="M12 8h128" /> : null}
      {arrows.map((x) => <path key={x} d={`M${x} ${caseId === "uniform" ? 8 : 4}v20m-4-5 4 5 4-5`} />)}
      <path d="M8 32h136" strokeWidth="4" />
      <path d="M16 34l-7 12h14z M136 34l-7 12h14z" strokeWidth="1.6" />
    </svg>
  );
}

export default function EngineeringCalcTool() {
  const [caseId, setCaseId] = useState<LoadCaseId>("uniform");
  const [span, setSpan] = useState("4.2");
  const [load, setLoad] = useState("4");
  const [forceUnit, setForceUnit] = useState<ForceUnit>("kN");
  const selected = LOAD_CASES.find((item) => item.id === caseId) ?? LOAD_CASES[0];
  const formula = formulaFor(selected.id);
  const digits = forceUnit === "kN" ? 2 : 0;
  const spanNumber = span.trim() === "" ? Number.NaN : Number(span);
  const loadNumber = load.trim() === "" ? Number.NaN : Number(load);

  // Live result: recomputed whenever the inputs are valid.
  const check = validate(spanNumber, loadNumber, forceUnit);
  const result = check.ok ? solve(selected.id, spanNumber, toKn(loadNumber, forceUnit)) : null;
  const errors = check.ok ? [] : check.errors;
  const spanError = errors.find((error) => error.startsWith("Span"));
  const loadError = errors.find((error) => error.startsWith("Load"));
  const bounds = loadBounds(forceUnit);
  const presetValue = (kn: number) => String(roundForUnit(fromKn(kn, forceUnit), forceUnit));
  const where = result ? maxLocations(spanNumber) : null;

  const chooseCase = (nextId: LoadCaseId) => {
    const next = LOAD_CASES.find((item) => item.id === nextId) ?? LOAD_CASES[0];
    setCaseId(next.id);
    setLoad(presetValue(next.baseLoad));
  };
  const chooseUnit = (next: ForceUnit) => {
    if (next === forceUnit) return;
    if (Number.isFinite(loadNumber)) setLoad(String(convertLoad(loadNumber, forceUnit, next)));
    setForceUnit(next);
  };

  return (
    <Workbench>
      <ToolIntro title="Engineering Calculator" summary="Maximum bending moment and shear for a simply supported beam, for learning and quick sanity checks." warning="Illustrative only: not a design check or engineering approval." />

      <fieldset className="wb-options wb-options-2 wb-options-beam">
        <legend>Load case</legend>
        {LOAD_CASES.map((item) => (
          <label key={item.id} className="wb-option">
            <input type="radio" name="load-case" value={item.id} checked={item.id === selected.id} onChange={() => chooseCase(item.id)} />
            <BeamDiagram caseId={item.id} />
            <strong>{item.label}</strong>
            <span>{item.note}</span>
          </label>
        ))}
      </fieldset>

      <section className="wb-card" aria-labelledby="inputs-title">
        <div className="wb-card-head">
          <h2 id="inputs-title">Inputs</h2>
          <Segmented label="Force unit" options={UNIT_OPTIONS} value={forceUnit} onChange={chooseUnit} />
        </div>
        {/* Span and load stay on one row on phones, so the result is in the first screen. */}
        <div className="wb-inputs wb-inputs-pair">
          <label className="wb-input">Span (m)
            <input type="number" inputMode="decimal" min={SPAN_RANGE.min} max={SPAN_RANGE.max} step="0.1" value={span} onChange={(event) => setSpan(event.target.value)} aria-invalid={spanError ? true : undefined} aria-describedby={spanError ? "calc-errors" : undefined} />
          </label>
          <label className="wb-input">{selected.id === "point" ? "Point load" : "Load"} ({loadUnit(selected.id, forceUnit)})
            <input type="number" inputMode="decimal" min={bounds.min} max={bounds.max} step={forceUnit === "kN" ? "0.1" : "1"} value={load} onChange={(event) => setLoad(event.target.value)} aria-invalid={loadError ? true : undefined} aria-describedby={loadError ? "calc-errors" : undefined} />
          </label>
        </div>
        <div className="wb-chips wb-chips-scroll" role="group" aria-label="Load presets">
          {LOAD_PRESETS[selected.id].map((preset) => (
            <button key={preset.label} type="button" aria-pressed={load === presetValue(preset.load)} onClick={() => setLoad(presetValue(preset.load))}>
              {preset.label} · {presetValue(preset.load)} {loadUnit(selected.id, forceUnit)}
            </button>
          ))}
        </div>
        {errors.length ? (
          <div id="calc-errors" className="wb-error wb-error-inline" role="alert"><AlertIcon /><span>{errors.join(" ")}</span></div>
        ) : null}
      </section>

      <section className="wb-card wb-panes-gap" aria-labelledby="result-title">
        <h2 id="result-title">Result</h2>
        <dl className="wb-figures wb-figures-lead" aria-live="polite">
          <div><dt>Max bending moment</dt><dd>{result ? fromKn(result.moment, forceUnit).toFixed(digits) : "—"} <small className="wb-unit">{momentUnit(forceUnit)}</small></dd></div>
          <div><dt>Max shear</dt><dd>{result ? fromKn(result.shear, forceUnit).toFixed(digits) : "—"} <small className="wb-unit">{forceUnit}</small></dd></div>
        </dl>
        {where ? <p className="wb-note wb-formulas"><span>Moment is largest {where.moment}.</span><span>Shear is largest {where.shear}.</span></p> : null}
        <p className="wb-note wb-formulas"><span>Moment: <code>{formula.moment}</code></span><span>Shear: <code>{formula.shear}</code></span></p>
      </section>

      <p className="wb-hint">Model: simply supported beam, length in metres{forceUnit === "kgf" ? ", force in kgf (1 kN = 101.97 kgf, standard gravity)" : ", force in kN"}. Material and self-weight are not included. Verify real designs with a qualified engineer.</p>
    </Workbench>
  );
}
