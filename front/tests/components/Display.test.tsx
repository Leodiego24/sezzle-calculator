import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Display } from '../../src/components/Display';

describe('<Display />', () => {
  it('renders the current display value', () => {
    render(
      <Display
        display="42"
        expression=""
        error={null}
        isLoading={false}
      />,
    );
    expect(screen.getByTestId('display-value')).toHaveTextContent('42');
  });

  it('renders the expression when provided', () => {
    render(
      <Display
        display="3"
        expression="12 + 3"
        error={null}
        isLoading={false}
      />,
    );
    expect(screen.getByTestId('expression')).toHaveTextContent('12 + 3');
  });

  it('shows the error message when error is provided', () => {
    render(
      <Display
        display="0"
        expression=""
        error="Cannot divide by zero"
        isLoading={false}
      />,
    );
    expect(screen.getByTestId('error-message')).toHaveTextContent(
      'Cannot divide by zero',
    );
    expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
  });

  it('shows the loading indicator when isLoading is true', () => {
    render(
      <Display
        display="0"
        expression=""
        error={null}
        isLoading={true}
      />,
    );
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
  });

  it('prefers loading over error when both are set', () => {
    render(
      <Display
        display="0"
        expression=""
        error="Some error"
        isLoading={true}
      />,
    );
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
  });
});
