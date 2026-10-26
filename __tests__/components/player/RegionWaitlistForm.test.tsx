import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RegionWaitlistForm from '@/components/player/RegionWaitlistForm';

describe('RegionWaitlistForm', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('submits email and region and confirms successful signup', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'You are on the waitlist. Thank you.' }),
    }) as jest.Mock;

    render(<RegionWaitlistForm />);
    fireEvent.change(screen.getByLabelText(/Country or region/i), {
      target: { value: 'Central Africa' },
    });
    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: 'player@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Join waitlist' }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        'You are on the waitlist. Thank you.',
      );
    });
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/region-waitlist',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'player@example.com',
          region: 'Central Africa',
        }),
      }),
    );
  });

  it('shows an error instead of claiming success when the API fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'The regional waitlist is not configured yet.' }),
    }) as jest.Mock;

    render(<RegionWaitlistForm />);
    fireEvent.change(screen.getByLabelText(/Country or region/i), {
      target: { value: 'Central Africa' },
    });
    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: 'player@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Join waitlist' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'The regional waitlist is not configured yet.',
      );
    });
  });
});
