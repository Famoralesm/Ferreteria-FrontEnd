import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';

/**
 * Normaliza un teléfono chileno eliminando
 * espacios, paréntesis, puntos y guiones.
 */
export function normalizeChileanPhone(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(/[\s().-]/g, '');
}

/**
 * Acepta teléfonos chilenos móviles y fijos
 * de 9 dígitos, con prefijo +56 opcional.
 *
 * El teléfono es opcional.
 */
export const chileanPhoneValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {

  const raw = String(control.value ?? '').trim();

  if (!raw) {
    return null;
  }

  const normalized = normalizeChileanPhone(raw);

  const valid =
    /^(?:\+?56)?[2-9]\d{8}$/.test(normalized);

  return valid
    ? null
    : { telefonoChilenoInvalido: true };
};