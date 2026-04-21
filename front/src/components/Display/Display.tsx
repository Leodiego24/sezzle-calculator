import styles from './Display.module.css';

export interface DisplayProps {
  display: string;
  expression: string;
  error: string | null;
  isLoading: boolean;
}

export function Display({
  display,
  expression,
  error,
  isLoading,
}: DisplayProps) {
  return (
    <div className={styles.display} role="region" aria-label="Display">
      <div className={styles.expression} data-testid="expression">
        {expression || ' '}
      </div>
      <div
        className={styles.value}
        data-testid="display-value"
        aria-live="polite"
      >
        {display}
      </div>
      <div className={styles.statusRow}>
        {isLoading ? (
          <span
            className={styles.loading}
            data-testid="loading-indicator"
            aria-label="Calculating"
            role="status"
          >
            Calculating...
          </span>
        ) : error ? (
          <span
            className={styles.error}
            data-testid="error-message"
            role="alert"
          >
            {error}
          </span>
        ) : (
          <span className={styles.placeholder}>&nbsp;</span>
        )}
      </div>
    </div>
  );
}

export default Display;
