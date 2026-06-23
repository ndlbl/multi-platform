import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordComplexityValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value) return null; // pass empty to .required

  const errors: ValidationErrors = {};
  if (value.length < 8) errors['minLength'] = true;
  if (!/[a-z]/.test(value)) errors['lowercase'] = true;
  if (!/[A-Z]/.test(value)) errors['uppercase'] = true;
  if (!/\d/.test(value)) errors['digit'] = true;
  if (!/[^a-zA-Z0-9]/.test(value)) errors['special'] = true;

  return Object.keys(errors).length ? errors : null;
}

export function matchValidator(field1: string, field2: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const v1 = group.get(field1)?.value;
    const v2 = group.get(field2)?.value;
    return !v1 || !v2 || v1 === v2 ? null : { mismatch: true };
  };
}
