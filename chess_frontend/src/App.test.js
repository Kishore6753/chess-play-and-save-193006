import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Ocean Chess header', () => {
  render(<App />);
  expect(screen.getByText(/Ocean Chess/i)).toBeInTheDocument();
});
