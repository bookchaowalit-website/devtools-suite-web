export type LoadCaseId = "uniform" | "point" | "service";
export type LoadCase = { id: LoadCaseId; label: string; note: string; symbol: string; baseLoad: number };

export const LOAD_CASES: LoadCase[] = [
  { id: "uniform", label: "Uniform load", note: "Load distributed across the span", symbol: "w", baseLoad: 4 },
  { id: "point", label: "Mid-span point", note: "Single illustrative load at centre", symbol: "P", baseLoad: 7 },
  { id: "service", label: "Service check", note: "Lower illustrative working load", symbol: "q", baseLoad: 2.5 },
];

export const SPAN_RANGE = { min: 1, max: 12 } as const;
export const LOAD_RANGE = { min: 0.1, max: 50 } as const;

export function isPointLoad(caseId: LoadCaseId): boolean {
  return caseId === "point";
}

export function formulaFor(caseId: LoadCaseId): { moment: string; shear: string } {
  return isPointLoad(caseId) ? { moment: "M = P · L / 4", shear: "V = P / 2" } : { moment: "M = w · L² / 8", shear: "V = w · L / 2" };
}

export type ForceUnit = "kN" | "kgf";
export const FORCE_UNITS: readonly ForceUnit[] = ["kN", "kgf"];
/** 1 kN = 1000 N / 9.80665 m/s² (standard gravity) ≈ 101.97 kgf. */
export const KGF_PER_KN = 1000 / 9.80665;

/** Convert a force (or force per metre) in `unit` to kN. */
export function toKn(value: number, unit: ForceUnit): number {
  return unit === "kN" ? value : value / KGF_PER_KN;
}

/** Convert a force (or force per metre) in kN to `unit`. */
export function fromKn(valueKn: number, unit: ForceUnit): number {
  return unit === "kN" ? valueKn : valueKn * KGF_PER_KN;
}

export function loadUnit(caseId: LoadCaseId, unit: ForceUnit = "kN"): string {
  return isPointLoad(caseId) ? unit : `${unit}/m`;
}

export function momentUnit(unit: ForceUnit = "kN"): string {
  return `${unit}·m`;
}

/** Round for display/input: 2 decimals for kN, whole numbers for kgf. */
export function roundForUnit(value: number, unit: ForceUnit): number {
  const factor = unit === "kN" ? 100 : 1;
  return Math.round(value * factor) / factor;
}

export type Validation = { ok: true } | { ok: false; errors: string[] };

const EPSILON = 1e-9;

/**
 * Allowed load range expressed in `unit`, rounded *inwards* to the unit's
 * display precision (min up, max down). Rounding to nearest would advertise
 * 10 kgf as the minimum although 10 kgf is 0.098 kN, below the 0.1 kN limit,
 * and 5099 kgf as the maximum although that is 50.003 kN.
 */
export function loadBounds(unit: ForceUnit = "kN"): { min: number; max: number } {
  const factor = unit === "kN" ? 100 : 1;
  return {
    min: Math.ceil(fromKn(LOAD_RANGE.min, unit) * factor - EPSILON) / factor,
    max: Math.floor(fromKn(LOAD_RANGE.max, unit) * factor + EPSILON) / factor,
  };
}

/** `load` is in `unit`; it is checked against the physical range in kN and reported in the chosen unit. */
export function validate(span: number, load: number, unit: ForceUnit = "kN"): Validation {
  const errors: string[] = [];
  if (!Number.isFinite(span) || span < SPAN_RANGE.min || span > SPAN_RANGE.max) errors.push(`Span must be between ${SPAN_RANGE.min} and ${SPAN_RANGE.max} m.`);
  const loadKn = toKn(load, unit);
  const { min, max } = loadBounds(unit);
  if (!Number.isFinite(load) || loadKn < LOAD_RANGE.min - EPSILON || loadKn > LOAD_RANGE.max + EPSILON) {
    errors.push(`Load must be between ${min} and ${max} ${unit}.`);
  }
  return errors.length ? { ok: false, errors } : { ok: true };
}

/**
 * Convert an entered load between units for the input box. A load that was in
 * range stays in range after rounding (0.1 kN becomes 11 kgf, not an invalid
 * 10 kgf); NaN (empty input) stays NaN.
 */
export function convertLoad(load: number, from: ForceUnit, to: ForceUnit): number {
  if (!Number.isFinite(load)) return load;
  const loadKn = toKn(load, from);
  const rounded = roundForUnit(fromKn(loadKn, to), to);
  if (loadKn < LOAD_RANGE.min - EPSILON || loadKn > LOAD_RANGE.max + EPSILON) return rounded;
  const { min, max } = loadBounds(to);
  return Math.min(max, Math.max(min, rounded));
}

/**
 * Simply supported beam: maximum bending moment (kN·m) and maximum end shear (kN).
 * Uniform/service: M = wL²/8, V = wL/2. Mid-span point: M = PL/4, V = P/2.
 */
export function solve(caseId: LoadCaseId, span: number, load: number): { moment: number; shear: number } {
  if (isPointLoad(caseId)) return { moment: (load * span) / 4, shear: load / 2 };
  return { moment: (load * span * span) / 8, shear: (load * span) / 2 };
}
