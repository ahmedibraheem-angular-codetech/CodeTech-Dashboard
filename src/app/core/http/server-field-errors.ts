import type { AbstractControl, FormGroup } from '@angular/forms';

import { isApiError } from './api-error';

/**
 * Puts a 422 response on the matching form fields as a `server` error, so the
 * field shows its own localized message. Keys of `fields` are the names the API
 * uses, values are the form control names. Returns true when a field was marked.
 */
export function applyServerFieldErrors(
  form: FormGroup,
  error: unknown,
  fields: Readonly<Record<string, string>>,
): boolean {
  if (!isApiError(error) || error.kind !== 'validation') {
    return false;
  }
  let applied = false;
  for (const key of Object.keys(error.fieldErrors)) {
    const name = fields[key];
    const control: AbstractControl | null = name ? form.get(name) : null;
    if (control) {
      control.setErrors({ ...(control.errors ?? {}), server: true });
      control.markAsTouched();
      applied = true;
    }
  }
  return applied;
}
