import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/font/google', () => ({
  DM_Sans: () => ({ variable: '--font-dm-sans' }),
  Literata: () => ({ variable: '--font-literata' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono' }),
}));

import RootLayout from '@/app/layout';

describe('RootLayout', () => {
  it('renders children content', () => {
    render(
      <RootLayout>
        <div>test child</div>
      </RootLayout>,
      { container: document.documentElement },
    );
    expect(screen.getByText('test child')).toBeDefined();
  });
});
