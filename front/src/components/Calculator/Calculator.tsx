import { useCalculator } from '../../hooks/useCalculator';
import { operationSymbol } from '../../utils/format';
import { Display } from '../Display';
import { Keypad } from '../Keypad';
import styles from './Calculator.module.css';

export function Calculator() {
  const { state, actions } = useCalculator();

  const expression =
    state.pendingOperand !== null && state.pendingOperation !== null
      ? `${state.pendingOperand} ${operationSymbol(state.pendingOperation)}${
          state.justEvaluated ? '' : ' ' + state.display
        }`
      : '';

  return (
    <div className={styles.page}>
      <main className={styles.card} aria-label="Calculator">
        <h1 className={styles.title}>Sezzle Calculator</h1>
        <Display
          display={state.display}
          expression={expression}
          error={state.error}
          isLoading={state.isLoading}
        />
        <Keypad
          onDigit={actions.pressDigit}
          onOperator={actions.pressOperator}
          onEquals={actions.pressEquals}
          onClear={actions.clear}
          onDecimal={actions.pressDecimal}
          onSign={actions.pressSign}
          onBackspace={actions.pressBackspace}
          disabled={state.isLoading}
        />
      </main>
    </div>
  );
}

export default Calculator;
