/**
 * Formats a numeric result for display.
 *
 * - Preserves integers as-is.
 * - Trims trailing zeros from decimals.
 * - Uses a short exponential notation for very large/small numbers.
 */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return String(value);
  }

  // Very large or very small numbers: use exponential.
  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 1e12 || abs < 1e-6)) {
    return value.toExponential(6).replace(/\.?0+e/, 'e');
  }

  // Round to a reasonable precision to avoid floating-point noise.
  const rounded = Number.parseFloat(value.toPrecision(12));
  return String(rounded);
}

/**
 * Human-readable symbol for each operation, used when building the
 * expression line in the display.
 */
export function operationSymbol(op: string): string {
  switch (op) {
    case 'add':
      return '+';
    case 'subtract':
      return '−';
    case 'multiply':
      return '×';
    case 'divide':
      return '÷';
    default:
      return op;
  }
}
