import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Group-level validator: flags `confirmField` with `{ mismatch: true }` when it differs from `passwordField`. */
export function passwordMatchValidator(passwordField: string, confirmField: string) {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordField);
    const confirm = group.get(confirmField);
    if (password && confirm && password.value !== confirm.value) {
      confirm.setErrors({ ...confirm.errors, mismatch: true });
      return { mismatch: true };
    }
    if (confirm?.errors) {
      const { mismatch, ...rest } = confirm.errors;
      confirm.setErrors(Object.keys(rest).length ? rest : null);
    }
    return null;
  };
}
