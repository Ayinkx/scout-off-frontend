import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PlayerQRScanner, { getPlayerPath } from '@/components/scout/PlayerQRScanner';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe('getPlayerPath', () => {
  it('accepts a same-origin localized player profile URL', () => {
    expect(getPlayerPath('http://localhost/en/player/GABC123?from=qr')).toBe(
      '/en/player/GABC123?from=qr',
    );
  });

  it('rejects unrelated and external URLs', () => {
    expect(getPlayerPath('https://example.com/en/player/GABC123')).toBeNull();
    expect(getPlayerPath('http://localhost/en/settings')).toBeNull();
    expect(getPlayerPath('not a URL')).toBeNull();
  });
});

describe('PlayerQRScanner', () => {
  it('explains when native QR detection is unavailable', async () => {
    render(<PlayerQRScanner />);
    fireEvent.click(screen.getByRole('button', { name: 'Scan player QR' }));
    await waitFor(() => {
      expect(
        screen.getByText(/QR scanning is not supported by this browser/i),
      ).toBeInTheDocument();
    });
  });
});
