export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return String(value);
  }

  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 1e12 || abs < 1e-6)) {
    return value.toExponential(6).replace(/\.?0+e/, 'e');
  }

  const rounded = Number.parseFloat(value.toPrecision(12));
  return String(rounded);
}

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
