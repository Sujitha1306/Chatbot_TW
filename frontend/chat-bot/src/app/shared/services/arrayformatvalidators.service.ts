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
