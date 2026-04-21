import { useCallback, useEffect, useReducer, useRef } from 'react';
import { calculate } from '../api/calculator';
import { ApiError, type Operation } from '../types/calculator';
import { formatNumber } from '../utils/format';

export type CalculatorState = {
  display: string;
  pendingOperand: number | null;
  pendingOperation: Operation | null;
  justEvaluated: boolean;
  isLoading: boolean;
  error: string | null;
};

export const initialState: CalculatorState = {
  display: '0',
  pendingOperand: null,
  pendingOperation: null,
  justEvaluated: false,
  isLoading: false,
  error: null,
};

type Action =
  | { type: 'DIGIT'; digit: string }
  | { type: 'DECIMAL' }
  | { type: 'SIGN' }
  | { type: 'BACKSPACE' }
  | { type: 'CLEAR' }
  | { type: 'OPERATOR'; operation: Operation }
  | { type: 'EQUALS_START' }
  | { type: 'EQUALS_SUCCESS'; result: number }
  | { type: 'EQUALS_ERROR'; message: string }
  | { type: 'CHAIN_SUCCESS'; result: number; operation: Operation }
  | { type: 'UNARY_SUCCESS'; result: number };

export function reducer(
  state: CalculatorState,
  action: Action,
): CalculatorState {
  switch (action.type) {
    case 'DIGIT': {
      if (state.justEvaluated || state.display === '0') {
        return {
          ...state,
          display: action.digit,
          justEvaluated: false,
          error: null,
        };
      }
      return {
        ...state,
        display: state.display + action.digit,
        error: null,
      };
    }

    case 'DECIMAL': {
      if (state.justEvaluated) {
        return {
          ...state,
          display: '0.',
          justEvaluated: false,
          error: null,
        };
      }
      if (state.display.includes('.')) {
        return state;
      }
      return {
        ...state,
        display: state.display + '.',
        error: null,
      };
    }

    case 'SIGN': {
      if (state.display === '0' || state.display === '0.') {
        return state;
      }
      if (state.display.startsWith('-')) {
        return { ...state, display: state.display.slice(1) };
      }
      return { ...state, display: '-' + state.display };
    }

    case 'BACKSPACE': {
      if (state.justEvaluated) {
        return state;
      }
      const next = state.display.slice(0, -1);
      return {
        ...state,
        display: next === '' || next === '-' ? '0' : next,
      };
    }

    case 'CLEAR':
      return initialState;

    case 'OPERATOR': {
      const currentValue = Number.parseFloat(state.display);
      return {
        ...state,
        pendingOperand: Number.isFinite(currentValue) ? currentValue : 0,
        pendingOperation: action.operation,
        justEvaluated: true,
        error: null,
      };
    }

    case 'EQUALS_START':
      return { ...state, isLoading: true, error: null };

    case 'EQUALS_SUCCESS':
      return {
        ...state,
        display: formatNumber(action.result),
        pendingOperand: null,
        pendingOperation: null,
        justEvaluated: true,
        isLoading: false,
        error: null,
      };

    case 'EQUALS_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.message,
        pendingOperand: null,
        pendingOperation: null,
      };

    case 'CHAIN_SUCCESS':
      return {
        ...state,
        display: formatNumber(action.result),
        pendingOperand: action.result,
        pendingOperation: action.operation,
        justEvaluated: true,
        isLoading: false,
        error: null,
      };

    case 'UNARY_SUCCESS':
      return {
        ...state,
        display: formatNumber(action.result),
        justEvaluated: true,
        isLoading: false,
        error: null,
      };

    default:
      return state;
  }
}

export interface CalculatorActions {
  pressDigit: (digit: string) => void;
  pressDecimal: () => void;
  pressSign: () => void;
  pressBackspace: () => void;
  pressOperator: (operation: Operation) => Promise<void>;
  pressEquals: () => Promise<void>;
  pressSqrt: () => Promise<void>;
  clear: () => void;
}

export interface UseCalculatorResult {
  state: CalculatorState;
  actions: CalculatorActions;
}

export function useCalculator(): UseCalculatorResult {
  const [state, dispatch] = useReducer(reducer, initialState);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  stateRef.current = state;

  const pressDigit = useCallback((digit: string) => {
    dispatch({ type: 'DIGIT', digit });
  }, []);

  const pressDecimal = useCallback(() => {
    dispatch({ type: 'DECIMAL' });
  }, []);

  const pressSign = useCallback(() => {
    dispatch({ type: 'SIGN' });
  }, []);

  const pressBackspace = useCallback(() => {
    dispatch({ type: 'BACKSPACE' });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  const pressOperator = useCallback(async (operation: Operation) => {
    const current = stateRef.current;

    const shouldChain =
      current.pendingOperation !== null &&
      current.pendingOperand !== null &&
      !current.justEvaluated;

    if (!shouldChain) {
      dispatch({ type: 'OPERATOR', operation });
      return;
    }

    const second = Number.parseFloat(current.display);
    if (!Number.isFinite(second)) {
      dispatch({
        type: 'EQUALS_ERROR',
        message: 'Current value is not a valid number.',
      });
      return;
    }

    dispatch({ type: 'EQUALS_START' });

    try {
      const response = await calculate({
        operation: current.pendingOperation as Operation,
        operands: [current.pendingOperand as number, second],
      });
      dispatch({
        type: 'CHAIN_SUCCESS',
        result: response.result,
        operation,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        dispatch({ type: 'EQUALS_ERROR', message: err.payload.message });
      } else {
        dispatch({
          type: 'EQUALS_ERROR',
          message: 'Could not reach the calculator service.',
        });
      }
    }
  }, []);

  const pressEquals = useCallback(async () => {
    const current = stateRef.current;

    if (
      current.pendingOperation === null ||
      current.pendingOperand === null
    ) {
      return;
    }

    const second = Number.parseFloat(current.display);
    if (!Number.isFinite(second)) {
      dispatch({
        type: 'EQUALS_ERROR',
        message: 'Current value is not a valid number.',
      });
      return;
    }

    dispatch({ type: 'EQUALS_START' });

    try {
      const response = await calculate({
        operation: current.pendingOperation,
        operands: [current.pendingOperand, second],
      });
      dispatch({ type: 'EQUALS_SUCCESS', result: response.result });
    } catch (err) {
      if (err instanceof ApiError) {
        dispatch({ type: 'EQUALS_ERROR', message: err.payload.message });
      } else {
        dispatch({
          type: 'EQUALS_ERROR',
          message: 'Could not reach the calculator service.',
        });
      }
    }
  }, []);

  const pressSqrt = useCallback(async () => {
    const current = stateRef.current;
    const x = Number.parseFloat(current.display);
    if (!Number.isFinite(x)) {
      dispatch({
        type: 'EQUALS_ERROR',
        message: 'Current value is not a valid number.',
      });
      return;
    }

    dispatch({ type: 'EQUALS_START' });

    try {
      const response = await calculate({ operation: 'sqrt', operands: [x] });
      dispatch({ type: 'UNARY_SUCCESS', result: response.result });
    } catch (err) {
      if (err instanceof ApiError) {
        dispatch({ type: 'EQUALS_ERROR', message: err.payload.message });
      } else {
        dispatch({
          type: 'EQUALS_ERROR',
          message: 'Could not reach the calculator service.',
        });
      }
    }
  }, []);

  return {
    state,
    actions: {
      pressDigit,
      pressDecimal,
      pressSign,
      pressBackspace,
      clear,
      pressOperator,
      pressEquals,
      pressSqrt,
    },
  };
}
