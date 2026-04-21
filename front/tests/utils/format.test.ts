import { describe, it, expect } from 'vitest';
import { formatNumber, operationSymbol } from '../../src/utils/format';

describe('formatNumber', () => {
  it('formats integers without decimals', () => {
    expect(formatNumber(5)).toBe('5');
    expect(formatNumber(-42)).toBe('-42');
    expect(formatNumber(0)).toBe('0');
  });

  it('trims floating-point noise', () => {
    expect(formatNumber(0.1 + 0.2)).toBe('0.3');
  });

  it('uses exponential for very large numbers', () => {
    expect(formatNumber(1e15)).toMatch(/e\+?\d+$/);
  });

  it('uses exponential for very small numbers', () => {
    expect(formatNumber(1e-9)).toMatch(/e-\d+$/);
  });

  it('returns strings for non-finite values', () => {
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe('Infinity');
    expect(formatNumber(Number.NaN)).toBe('NaN');
  });
});

describe('operationSymbol', () => {
  it('maps each operation to its symbol', () => {
    expect(operationSymbol('add')).toBe('+');
    expect(operationSymbol('subtract')).toBe('−');
    expect(operationSymbol('multiply')).toBe('×');
    expect(operationSymbol('divide')).toBe('÷');
  });

  it('returns the input for unknown operations', () => {
    expect(operationSymbol('unknown')).toBe('unknown');
  });
});
