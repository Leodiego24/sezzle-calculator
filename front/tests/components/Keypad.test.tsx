import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Keypad } from '../../src/components/Keypad';

function setup(overrides: Partial<Parameters<typeof Keypad>[0]> = {}) {
  const props = {
    onDigit: vi.fn(),
    onOperator: vi.fn(),
    onEquals: vi.fn(),
    onClear: vi.fn(),
    onDecimal: vi.fn(),
    onSign: vi.fn(),
    onBackspace: vi.fn(),
    disabled: false,
    ...overrides,
  };
  render(<Keypad {...props} />);
  return props;
}

describe('<Keypad />', () => {
  it('calls onDigit with the pressed digit', async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(screen.getByRole('button', { name: 'Digit 7' }));
    expect(props.onDigit).toHaveBeenCalledWith('7');
  });

  it('calls onOperator with the correct operation', async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(screen.getByRole('button', { name: 'add' }));
    expect(props.onOperator).toHaveBeenCalledWith('add');

    await user.click(screen.getByRole('button', { name: 'subtract' }));
    expect(props.onOperator).toHaveBeenCalledWith('subtract');

    await user.click(screen.getByRole('button', { name: 'multiply' }));
    expect(props.onOperator).toHaveBeenCalledWith('multiply');

    await user.click(screen.getByRole('button', { name: 'divide' }));
    expect(props.onOperator).toHaveBeenCalledWith('divide');
  });

  it('calls onEquals when equals is pressed', async () => {
    const user = userEvent.setup();
    const props = setup();
    await user.click(screen.getByRole('button', { name: 'Equals' }));
    expect(props.onEquals).toHaveBeenCalledTimes(1);
  });

  it('calls onClear when AC is pressed', async () => {
    const user = userEvent.setup();
    const props = setup();
    await user.click(screen.getByRole('button', { name: 'All clear' }));
    expect(props.onClear).toHaveBeenCalledTimes(1);
  });

  it('calls onDecimal when . is pressed', async () => {
    const user = userEvent.setup();
    const props = setup();
    await user.click(screen.getByRole('button', { name: 'Decimal point' }));
    expect(props.onDecimal).toHaveBeenCalledTimes(1);
  });

  it('calls onSign when +/- is pressed', async () => {
    const user = userEvent.setup();
    const props = setup();
    await user.click(screen.getByRole('button', { name: 'Toggle sign' }));
    expect(props.onSign).toHaveBeenCalledTimes(1);
  });

  it('calls onBackspace when backspace is pressed', async () => {
    const user = userEvent.setup();
    const props = setup();
    await user.click(screen.getByRole('button', { name: 'Backspace' }));
    expect(props.onBackspace).toHaveBeenCalledTimes(1);
  });

  it('disables all buttons when disabled is true', () => {
    setup({ disabled: true });
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) {
      expect(button).toBeDisabled();
    }
    // Equals is still rendered.
    expect(
      screen.getByRole('button', { name: 'Equals' }),
    ).toBeInTheDocument();
  });
});
