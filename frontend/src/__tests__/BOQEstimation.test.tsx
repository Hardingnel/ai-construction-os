import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { BOQEstimation } from '../pages/BOQEstimation';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn().mockResolvedValue([]), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

vi.mock('@/components/ui/toast', () => ({ toast: vi.fn() }));

describe('BOQEstimation page', () => {
  it('renders the page title', async () => {
    render(<MemoryRouter><BOQEstimation /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText(/bill of quantities/i)).toBeInTheDocument());
  });

  it('renders tabs', async () => {
    render(<MemoryRouter><BOQEstimation /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/items/i)).toBeInTheDocument();
    });
  });
});
