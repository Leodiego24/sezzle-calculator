import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../src/api/calculator', () => ({
  calculate: vi.fn(),
}));

import App from '../src/App';

describe('<App />', () => {
  it('renders the calculator', () => {
    render(<App />);
    expect(
      screen.getByRole('main', { name: 'Calculator' }),
    ).toBeInTheDocument();
  });
});
