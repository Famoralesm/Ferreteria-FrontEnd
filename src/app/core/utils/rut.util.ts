import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';

/**
 * Normaliza un RUT chileno:
 * elimina puntos y guion, y convierte la K a mayúscula.
 */
export function normalizeRut(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(/\./g, '')
    .replace(/-/g, '')
    .toUpperCase();
}

/**
 * Valida el RUT chileno mediante módulo 11.
 */
export const rutValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {

  const value = normalizeRut(control.value);

  if (!value) {
    return null;
  }

  if (!/^\d{7,8}[0-9K]$/.test(value)) {
    return { rutInvalido: true };
  }

  const cuerpo = value.slice(0, -1);
  const dvIngresado = value.slice(-1);

  let suma = 0;
  let multiplicador = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {

    suma += Number(cuerpo[i]) * multiplicador;

    multiplicador =
      multiplicador === 7
        ? 2
        : multiplicador + 1;
  }

  const resto = 11 - (suma % 11);

  const dvCalculado =
    resto === 11
      ? '0'
      : resto === 10
        ? 'K'
        : String(resto);

  return dvIngresado === dvCalculado
    ? null
    : { rutInvalido: true };
};