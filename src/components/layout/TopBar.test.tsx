import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TopBar } from './TopBar';

const mockSetMode = vi.fn();
let mockMode = 'auto';

vi.mock('@/theme/ThemeContext', () => ({
    useTheme: () => ({
        mode: mockMode,
        setMode: mockSetMode,
        resolvedMode: 'dark',
    }),
}));

function renderTopBar() {
    return render(<TopBar />);
}

describe('TopBar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockMode = 'auto';
    });

    describe('rendering', () => {
        it('renders the app title', () => {
            renderTopBar();
            expect(screen.getByText('Overtabbed')).toBeInTheDocument();
        });

        it('does not render page navigation tabs', () => {
            renderTopBar();
            expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
        });

        it('renders all theme mode toggle buttons', () => {
            renderTopBar();
            expect(screen.getByRole('button', { name: /light mode/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /auto mode/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /dark mode/i })).toBeInTheDocument();
        });
    });

    describe('theme mode toggle', () => {
        it('calls setMode with "light" when light mode button is clicked', async () => {
            mockMode = 'dark';
            const user = userEvent.setup();
            renderTopBar();

            await user.click(screen.getByRole('button', { name: /light mode/i }));

            expect(mockSetMode).toHaveBeenCalledWith('light');
        });

        it('calls setMode with "auto" when auto mode button is clicked', async () => {
            mockMode = 'light';
            const user = userEvent.setup();
            renderTopBar();

            await user.click(screen.getByRole('button', { name: /auto mode/i }));

            expect(mockSetMode).toHaveBeenCalledWith('auto');
        });

        it('calls setMode with "dark" when dark mode button is clicked', async () => {
            mockMode = 'light';
            const user = userEvent.setup();
            renderTopBar();

            await user.click(screen.getByRole('button', { name: /dark mode/i }));

            expect(mockSetMode).toHaveBeenCalledWith('dark');
        });
    });

    describe('accessibility', () => {
        it('has proper group role for theme toggle buttons', () => {
            renderTopBar();
            const toggleGroup = screen.getByRole('group');
            expect(toggleGroup).toBeInTheDocument();
            expect(within(toggleGroup).getByRole('button', { name: /light mode/i })).toBeInTheDocument();
        });
    });
});

