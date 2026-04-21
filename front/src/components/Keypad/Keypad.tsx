import type { Operation } from '../../types/calculator';
import styles from './Keypad.module.css';

export interface KeypadProps {
  onDigit: (digit: string) => void;
  onOperator: (op: Operation) => void;
  onEquals: () => void;
  onClear: () => void;
  onDecimal: () => void;
  onSign: () => void;
  onBackspace: () => void;
  disabled: boolean;
}

type Key =
  | { label: string; kind: 'digit'; v: string; wide?: boolean }
  | { label: string; kind: 'operator'; op: Operation }
  | { label: string; kind: 'equals' }
  | { label: string; kind: 'clear' }
  | { label: string; kind: 'decimal' }
  | { label: string; kind: 'sign' }
  | { label: string; kind: 'backspace' };

const KEYS: Key[] = [
  { label: 'AC', kind: 'clear' },
  { label: '+/-', kind: 'sign' },
  { label: '⌫', kind: 'backspace' },
  { label: '÷', kind: 'operator', op: 'divide' },

  { label: '7', kind: 'digit', v: '7' },
  { label: '8', kind: 'digit', v: '8' },
  { label: '9', kind: 'digit', v: '9' },
  { label: '×', kind: 'operator', op: 'multiply' },

  { label: '4', kind: 'digit', v: '4' },
  { label: '5', kind: 'digit', v: '5' },
  { label: '6', kind: 'digit', v: '6' },
  { label: '−', kind: 'operator', op: 'subtract' },

  { label: '1', kind: 'digit', v: '1' },
  { label: '2', kind: 'digit', v: '2' },
  { label: '3', kind: 'digit', v: '3' },
  { label: '+', kind: 'operator', op: 'add' },

  { label: '0', kind: 'digit', v: '0', wide: true },
  { label: '.', kind: 'decimal' },
  { label: '=', kind: 'equals' },
];

function ariaLabelFor(key: Key): string {
  switch (key.kind) {
    case 'digit':
      return `Digit ${key.v}`;
    case 'operator':
      return key.op;
    case 'equals':
      return 'Equals';
    case 'clear':
      return 'All clear';
    case 'decimal':
      return 'Decimal point';
    case 'sign':
      return 'Toggle sign';
    case 'backspace':
      return 'Backspace';
  }
}

function classFor(key: Key): string {
  const base = styles.key;
  switch (key.kind) {
    case 'digit':
      return `${base} ${styles.digit}${key.wide ? ' ' + styles.wide : ''}`;
    case 'operator':
      return `${base} ${styles.operator}`;
    case 'equals':
      return `${base} ${styles.equals}`;
    case 'clear':
      return `${base} ${styles.utility}`;
    case 'decimal':
      return `${base} ${styles.digit}`;
    case 'sign':
      return `${base} ${styles.utility}`;
    case 'backspace':
      return `${base} ${styles.utility}`;
  }
}

export function Keypad({
  onDigit,
  onOperator,
  onEquals,
  onClear,
  onDecimal,
  onSign,
  onBackspace,
  disabled,
}: KeypadProps) {
  const handleClick = (key: Key) => {
    switch (key.kind) {
      case 'digit':
        onDigit(key.v);
        return;
      case 'operator':
        onOperator(key.op);
        return;
      case 'equals':
        onEquals();
        return;
      case 'clear':
        onClear();
        return;
      case 'decimal':
        onDecimal();
        return;
      case 'sign':
        onSign();
        return;
      case 'backspace':
        onBackspace();
        return;
    }
  };

  return (
    <div className={styles.keypad} role="group" aria-label="Keypad">
      {KEYS.map((key) => (
        <button
          key={key.label + key.kind + ('v' in key ? key.v : '')}
          type="button"
          className={classFor(key)}
          onClick={() => handleClick(key)}
          disabled={disabled}
          aria-label={ariaLabelFor(key)}
          data-kind={key.kind}
        >
          {key.label}
        </button>
      ))}
    </div>
  );
}

export default Keypad;
