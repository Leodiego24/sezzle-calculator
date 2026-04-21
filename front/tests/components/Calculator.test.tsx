import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../src/api/calculator', () => ({
  calculate: vi.fn(),
}));

import { calculate } from '../../src/api/calculator';
import { Calculator } from '../../src/components/Calculator';

const mockedCalculate = vi.mocked(calculate);

describe('<Calculator /> integration', () => {
  beforeEach(() => {
    mockedCalculate.mockReset();
  });

  it('computes 2 + 3 = 5 via the mocked API', async () => {
    mockedCalculate.mockResolvedValueOnce({
      operation: 'add',
      operands: [2, 3],
      result: 5,
    });

    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(screen.getByRole('button', { name: 'Digit 2' }));
    await user.click(screen.getByRole('button', { name: 'add' }));
    await user.click(screen.getByRole('button', { name: 'Digit 3' }));
    await user.click(screen.getByRole('button', { name: 'Equals' }));

    await waitFor(() =>
      expect(screen.getByTestId('display-value')).toHaveTextContent('5'),
    );

    expect(mockedCalculate).toHaveBeenCalledWith({
      operation: 'add',
      operands: [2, 3],
    });
  });

  it('shows an error message when the API rejects with an ApiError', async () => {
    const { ApiError } = await import('../../src/types/calculator');
    mockedCalculate.mockRejectedValueOnce(
      new ApiError(400, {
        error: 'division_by_zero',
        message: 'Cannot divide by zero',
        details: null,
      }),
    );

    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(screen.getByRole('button', { name: 'Digit 5' }));
    await user.click(screen.getByRole('button', { name: 'divide' }));
    await user.click(screen.getByRole('button', { name: 'Digit 0' }));
    await user.click(screen.getByRole('button', { name: 'Equals' }));

    await waitFor(() =>
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Cannot divide by zero',
      ),
    );
  });

  it('AC resets the display', async () => {
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(screen.getByRole('button', { name: 'Digit 7' }));
    await user.click(screen.getByRole('button', { name: 'Digit 7' }));
    expect(screen.getByTestId('display-value')).toHaveTextContent('77');

    await user.click(screen.getByRole('button', { name: 'All clear' }));
    expect(screen.getByTestId('display-value')).toHaveTextContent('0');
  });
});
