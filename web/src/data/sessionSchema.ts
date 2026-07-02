// One Zod schema per field spec — the agent-authored field constraints
// (min/max/length/options) become real runtime validation, not just a
// display hint. validateField is the single entry point views call; it
// falls back to a field-aware "required" message for empty values instead
// of Zod's generic type-error text, and otherwise surfaces Zod's own
// min/max message.
import { z } from 'zod';
import type { SessionField } from './types.ts';

export const fieldSchema = (f: SessionField): z.ZodTypeAny => {
  switch (f.type) {
    case 'text':
    case 'textarea': {
      let s = z
        .string()
        .trim()
        .min(f.minLength ?? 1);
      if (f.maxLength)
        s = s.max(f.maxLength, `${f.label} must be ${f.maxLength} characters or fewer`);
      return s;
    }
    case 'number': {
      let s = z.coerce.number();
      if (f.min != null) s = s.min(f.min, `${f.label} must be at least ${f.min}`);
      if (f.max != null) s = s.max(f.max, `${f.label} must be at most ${f.max}`);
      return s;
    }
    case 'select':
      return z.enum(f.options as [string, ...string[]]);
    case 'multiselect':
      return z.array(z.enum(f.options as [string, ...string[]])).min(1);
    case 'boolean':
      return z.boolean();
    case 'date':
      return z
        .string()
        .min(1)
        .refine((v) => !Number.isNaN(Date.parse(v)), `${f.label} must be a valid date`);
  }
};

const isEmptyValue = (v: unknown): boolean =>
  v === undefined ||
  v === null ||
  (typeof v === 'string' && v.trim() === '') ||
  (Array.isArray(v) && v.length === 0);

const requiredMessage = (f: SessionField): string => {
  switch (f.type) {
    case 'multiselect':
      return `Choose at least one option for ${f.label}`;
    case 'select':
      return `Choose an option for ${f.label}`;
    case 'boolean':
      return `${f.label} needs an answer`;
    default:
      return `${f.label} is required`;
  }
};

// Empty is checked before parsing, not after: an empty number string coerces
// to 0, which a schema with no `min` would accept as a silently "valid"
// required field. Boolean is exempt — false is a real answer, not an absence.
export const validateField = (f: SessionField, value: unknown): string | undefined => {
  if (f.type !== 'boolean' && isEmptyValue(value)) return requiredMessage(f);
  const result = fieldSchema(f).safeParse(value);
  if (result.success) return undefined;
  return result.error.issues[0]?.message ?? 'Invalid value';
};
