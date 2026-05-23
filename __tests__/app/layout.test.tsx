import {render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

// Mock next/font/google since it's not available in test environment
vi.mock('next/font/google', () => ({
    Geist: () => ({variable: '--font-geist-sans'}),
    Geist_Mono: () => ({variable: '--font-geist-mono'}),
}));

import RootLayout from '@/app/layout';

describe('RootLayout', () => {
    it('renders children content', () => {
        render(
            <RootLayout>
                <div>test child</div>
            </RootLayout>
        );
        expect(screen.getByText('test child')).toBeDefined();
    });
});
