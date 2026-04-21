import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { ApiError } from '../../src/types/calculator';

vi.mock('../../src/api/calculator', () => ({
  calculate: vi.fn(),
}));

import { calculate } from '../../src/api/calculator';
import { useCalculator } from '../../src/hooks/useCalculator';

const mockedCalculate = vi.mocked(calculate);

describe('useCalculator', () => {
  beforeEach(() => {
    mockedCalculate.mockReset();
  });

  it('starts with display "0" and no pending state', () => {
    const { result } = renderHook(() => useCalculator());
    expect(result.current.state.display).toBe('0');
    expect(result.current.state.pendingOperand).toBeNull();
    expect(result.current.state.pendingOperation).toBeNull();
    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.error).toBeNull();
  });

  it('pressDigit replaces leading zero', () => {
    const { result } = renderHook(() => useCalculator());
    act(() => result.current.actions.pressDigit('5'));
    expect(result.current.state.display).toBe('5');
  });

  it('accumulates multiple digits', () => {
    const { result } = renderHook(() => useCalculator());
    act(() => result.current.actions.pressDigit('5'));
    act(() => result.current.actions.pressDigit('2'));
    expect(result.current.state.display).toBe('52');
  });

  it('pressDecimal adds a single decimal point', () => {
    const { result } = renderHook(() => useCalculator());
    act(() => result.current.actions.pressDigit('3'));
    act(() => result.current.actions.pressDecimal());
    expect(result.current.state.display).toBe('3.');

    // Second press is a no-op.
    act(() => result.current.actions.pressDecimal());
    expect(result.current.state.display).toBe('3.');
  });

  it('pressDecimal after evaluation starts "0."', async () => {
    const { result } = renderHook(() => useCalculator());
    // Fake justEvaluated by running a calc.
    mockedCalculate.mockResolvedValueOnce({
      operation: 'add',
      operands: [1, 1],
      result: 2,
    });
    act(() => result.current.actions.pressDigit('1'));
    await act(async () => {
      await result.current.actions.pressOperator('add');
    });
    act(() => result.current.actions.pressDigit('1'));

    await act(async () => {
      await result.current.actions.pressEquals();
    });
    act(() => result.current.actions.pressDecimal());
    expect(result.current.state.display).toBe('0.');
  });

  it('pressSign toggles minus prefix', () => {
    const { result } = renderHook(() => useCalculator());
    act(() => result.current.actions.pressDigit('7'));
    act(() => result.current.actions.pressSign());
    expect(result.current.state.display).toBe('-7');
    act(() => result.current.actions.pressSign());
    expect(result.current.state.display).toBe('7');
  });

  it('pressSign on zero is a no-op', () => {
    const { result } = renderHook(() => useCalculator());
    act(() => result.current.actions.pressSign());
    expect(result.current.state.display).toBe('0');
  });

  it('pressBackspace removes the last character', () => {
    const { result } = renderHook(() => useCalculator());
    act(() => result.current.actions.pressDigit('1'));
    act(() => result.current.actions.pressDigit('2'));
    act(() => result.current.actions.pressBackspace());
    expect(result.current.state.display).toBe('1');
    act(() => result.current.actions.pressBackspace());
    expect(result.current.state.display).toBe('0');
  });

  it('pressOperator stores pending op and operand', async () => {
    const { result } = renderHook(() => useCalculator());
    act(() => result.current.actions.pressDigit('9'));
    await act(async () => {
      await result.current.actions.pressOperator('add');
    });
    expect(result.current.state.pendingOperand).toBe(9);
    expect(result.current.state.pendingOperation).toBe('add');
    expect(result.current.state.justEvaluated).toBe(true);
  });

  it('pressEquals calls the API and updates the display with the result', async () => {
    mockedCalculate.mockResolvedValueOnce({
      operation: 'add',
      operands: [2, 3],
      result: 5,
    });

    const { result } = renderHook(() => useCalculator());
    act(() => result.current.actions.pressDigit('2'));
    await act(async () => {
      await result.current.actions.pressOperator('add');
    });
    act(() => result.current.actions.pressDigit('3'));

    await act(async () => {
      await result.current.actions.pressEquals();
    });

    expect(mockedCalculate).toHaveBeenCalledWith({
      operation: 'add',
      operands: [2, 3],
    });
    expect(result.current.state.display).toBe('5');
    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.justEvaluated).toBe(true);
    expect(result.current.state.error).toBeNull();
  });

  it('pressEquals with no pending op is a no-op', async () => {
    const { result } = renderHook(() => useCalculator());
    await act(async () => {
      await result.current.actions.pressEquals();
    });
    expect(mockedCalculate).not.toHaveBeenCalled();
    expect(result.current.state.display).toBe('0');
  });

  it('pressEquals surfaces ApiError messages', async () => {
    mockedCalculate.mockRejectedValueOnce(
      new ApiError(400, {
        error: 'division_by_zero',
        message: 'Cannot divide by zero',
        details: null,
      }),
    );

    const { result } = renderHook(() => useCalculator());
    act(() => result.current.actions.pressDigit('4'));
    await act(async () => {
      await result.current.actions.pressOperator('divide');
    });
    act(() => result.current.actions.pressDigit('0'));

    await act(async () => {
      await result.current.actions.pressEquals();
    });

    await waitFor(() =>
      expect(result.current.state.error).toBe('Cannot divide by zero'),
    );
    expect(result.current.state.isLoading).toBe(false);
  });

  it('pressEquals surfaces a generic error on network failure', async () => {
    mockedCalculate.mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useCalculator());
    act(() => result.current.actions.pressDigit('1'));
    await act(async () => {
      await result.current.actions.pressOperator('add');
    });
    act(() => result.current.actions.pressDigit('2'));

    await act(async () => {
      await result.current.actions.pressEquals();
    });

    await waitFor(() =>
      expect(result.current.state.error).toBe(
        'Could not reach the calculator service.',
      ),
    );
  });

  it('clear resets to the initial state', async () => {
    const { result } = renderHook(() => useCalculator());
    act(() => result.current.actions.pressDigit('9'));
    await act(async () => {
      await result.current.actions.pressOperator('add');
    });
    act(() => result.current.actions.pressDigit('2'));
    act(() => result.current.actions.clear());

    expect(result.current.state.display).toBe('0');
    expect(result.current.state.pendingOperand).toBeNull();
    expect(result.current.state.pendingOperation).toBeNull();
  });

  it('chains operations: pressing an operator with a pending one evaluates first', async () => {
    // 2 + 2 + 2 should: (1) compute 2+2=4 on the second "+", (2) compute 4+2=6 on "=".
    mockedCalculate
      .mockResolvedValueOnce({ operation: 'add', operands: [2, 2], result: 4 })
      .mockResolvedValueOnce({ operation: 'add', operands: [4, 2], result: 6 });

    const { result } = renderHook(() => useCalculator());

    act(() => result.current.actions.pressDigit('2'));
    await act(async () => {
      await result.current.actions.pressOperator('add');
    });
    act(() => result.current.actions.pressDigit('2'));

    // Second "+" triggers the chained evaluation of 2+2.
    await act(async () => {
      await result.current.actions.pressOperator('add');
    });

    expect(mockedCalculate).toHaveBeenNthCalledWith(1, {
      operation: 'add',
      operands: [2, 2],
    });
    expect(result.current.state.display).toBe('4');
    expect(result.current.state.pendingOperand).toBe(4);
    expect(result.current.state.pendingOperation).toBe('add');
    expect(result.current.state.isLoading).toBe(false);

    act(() => result.current.actions.pressDigit('2'));
    await act(async () => {
      await result.current.actions.pressEquals();
    });

    expect(mockedCalculate).toHaveBeenNthCalledWith(2, {
      operation: 'add',
      operands: [4, 2],
    });
    expect(result.current.state.display).toBe('6');
  });

  it('pressing a different operator right after one swaps it without calling the API', async () => {
    const { result } = renderHook(() => useCalculator());
    act(() => result.current.actions.pressDigit('5'));
    await act(async () => {
      await result.current.actions.pressOperator('add');
    });
    await act(async () => {
      await result.current.actions.pressOperator('multiply');
    });
    expect(mockedCalculate).not.toHaveBeenCalled();
    expect(result.current.state.pendingOperand).toBe(5);
    expect(result.current.state.pendingOperation).toBe('multiply');
  });

  it('chain surfaces ApiError when the intermediate call fails', async () => {
    mockedCalculate.mockRejectedValueOnce(
      new ApiError(400, {
        error: 'division_by_zero',
        message: 'Cannot divide by zero',
        details: null,
      }),
    );

    const { result } = renderHook(() => useCalculator());
    act(() => result.current.actions.pressDigit('4'));
    await act(async () => {
      await result.current.actions.pressOperator('divide');
    });
    act(() => result.current.actions.pressDigit('0'));
    await act(async () => {
      await result.current.actions.pressOperator('add');
    });

    await waitFor(() =>
      expect(result.current.state.error).toBe('Cannot divide by zero'),
    );
    expect(result.current.state.isLoading).toBe(false);
  });

  it('typing a digit after evaluation replaces the display', async () => {
    mockedCalculate.mockResolvedValueOnce({
      operation: 'add',
      operands: [1, 1],
      result: 2,
    });

    const { result } = renderHook(() => useCalculator());
    act(() => result.current.actions.pressDigit('1'));
    await act(async () => {
      await result.current.actions.pressOperator('add');
    });
    act(() => result.current.actions.pressDigit('1'));
    await act(async () => {
      await result.current.actions.pressEquals();
    });

    expect(result.current.state.display).toBe('2');

    act(() => result.current.actions.pressDigit('7'));
    expect(result.current.state.display).toBe('7');
  });
});
