import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Ocean Chess header', () => {
  render(<App />);
  // "Ocean Chess" is intentionally rendered in multiple places (e.g., sidebar brand + header title).
  expect(screen.getAllByText(/Ocean Chess/i).length).toBeGreaterThan(0);
});
