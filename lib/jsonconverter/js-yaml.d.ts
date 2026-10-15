declare module "js-yaml" {
  export const JSON_SCHEMA: object;
  export function dump(value: unknown, options?: { schema?: object; indent?: number; lineWidth?: number; noRefs?: boolean }): string;
  export function load(source: string, options?: { schema?: object }): unknown;
}
