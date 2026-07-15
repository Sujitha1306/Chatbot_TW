import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function arrayFormatValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value?.trim();
    if (!value) return null; // Allow empty

    // Regex to match format: [<a>, <b>, <c>] etc.
    const pattern = /^\[\s*(<[^<>]+>\s*(,\s*<[^<>]+>\s*)*)?\]$/;

    return pattern.test(value)
      ? null
      : { invalidArrayFormat: 'Input must look like [<a>, <b>, <c>]' };
  };
}

export function jsonStructureValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null; // Allow empty

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;
      try {
        JSON.parse(trimmed);
        return null;
      } catch (e) {
        return { invalidJsonStructure: 'Input must be a valid JSON structure' };
      }
    }

    if (typeof value === 'object') {
      return null;
    }

    return { invalidJsonStructure: 'Input must be a valid JSON structure' };
  };
}

