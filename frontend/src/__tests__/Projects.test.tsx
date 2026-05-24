import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { Projects } from '../pages/Projects';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn().mockResolvedValue([]), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

vi.mock('@/components/ui/toast', () => ({ toast: vi.fn() }));

describe('Projects page', () => {
  it('renders the page title', async () => {
    render(<MemoryRouter><Projects /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('Projects')).toBeInTheDocument());
  });

  it('shows loading state initially', () => {
    render(<MemoryRouter><Projects /></MemoryRouter>);
    expect(screen.getByText(/loading projects/i)).toBeInTheDocument();
  });
});
