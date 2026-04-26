/**
 * Expo Router search params are often `string | string[]`. Normalize to one string.
 */
export function asSingleParam(value: string | string[] | undefined): string {
  if (value == null) {
    return '';
  }
  return Array.isArray(value) ? String(value[0] ?? '') : String(value);
}
