import React from 'react';
import { Box, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import { useTheme, ThemeMode } from '@/theme/ThemeContext';

export const TopBar: React.FC = () => {
    const { mode, setMode } = useTheme();

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: { xs: 2, sm: 3, md: 4 },
                py: 1,
                borderBottom: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-elevated)',
                backdropFilter: 'blur(8px)',
                position: 'sticky',
                top: 0,
                zIndex: 100,
            }}
        >
            <Typography
                variant="h6"
                sx={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    letterSpacing: '-0.02em',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                }}
            >
                <Box
                    component="span"
                    sx={{
                        width: 20,
                        height: 20,
                        borderRadius: 1,
                        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                        display: 'inline-block',
                    }}
                />
                Overtabbed
            </Typography>

            <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={(_, newMode) => newMode && setMode(newMode as ThemeMode)}
                size="small"
                sx={{
                    backgroundColor: 'var(--bg-muted)',
                    borderRadius: 2,
                    padding: 0.25,
                    '& .MuiToggleButtonGroup-grouped': {
                        border: 'none',
                        borderRadius: '6px !important',
                        px: 1.25,
                        py: 0.5,
                        color: 'var(--text-tertiary)',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                            backgroundColor: 'var(--bg-hover)',
                        },
                        '&.Mui-selected': {
                            backgroundColor: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                            boxShadow: 'var(--shadow-sm)',
                            '&:hover': {
                                backgroundColor: 'var(--bg-surface)',
                            },
                        },
                    },
                }}
            >
                <ToggleButton value="light" aria-label="light mode">
                    <LightModeIcon sx={{ fontSize: 16 }} />
                </ToggleButton>
                <ToggleButton value="auto" aria-label="auto mode">
                    <SettingsBrightnessIcon sx={{ fontSize: 16 }} />
                </ToggleButton>
                <ToggleButton value="dark" aria-label="dark mode">
                    <DarkModeIcon sx={{ fontSize: 16 }} />
                </ToggleButton>
            </ToggleButtonGroup>
        </Box>
    );
};

