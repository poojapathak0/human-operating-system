import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../routes/App';

it('renders navigation links', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByText('Check-In')).toBeInTheDocument();
  expect(screen.getByText('Timeline')).toBeInTheDocument();
  expect(screen.getByText('Compass')).toBeInTheDocument();
  expect(screen.getByText('Vault')).toBeInTheDocument();
  expect(screen.getByText('Settings')).toBeInTheDocument();
});
