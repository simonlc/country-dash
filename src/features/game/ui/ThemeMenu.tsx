import {
  Box,
  Button,
  Collapse,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useAppearance } from '@/app/appearance';
import type { AppThemeDefinition } from '@/app/theme';
import type { GlobeRenderer } from '@/features/game/types';

interface ThemeMenuProps {
  onAbout: () => void;
  onRefocus: () => void;
  onRestart: () => void;
  onQuit: () => void;
  renderer: GlobeRenderer;
  onRendererChange: (renderer: GlobeRenderer) => void;
}

function ThemePreview({ theme }: { theme: AppThemeDefinition }) {
  const isAtlas = theme.id === 'atlas';
  const globeStyle = useMemo(
    () => ({
      background: `radial-gradient(circle at 36% 34%, ${theme.preview.glow}, transparent 38%), ${theme.preview.ocean}`,
    }),
    [theme.preview.glow, theme.preview.ocean],
  );

  return (
    <Box
      sx={{
        background: theme.preview.sky,
        borderRadius: 2,
        height: 78,
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        '&::before': isAtlas
          ? {
              background:
                'radial-gradient(circle at 16% 28%, rgba(121, 71, 28, 0.18) 0, rgba(121, 71, 28, 0.1) 10%, rgba(121, 71, 28, 0) 20%), radial-gradient(circle at 82% 78%, rgba(101, 61, 20, 0.12) 0, rgba(101, 61, 20, 0.06) 12%, rgba(101, 61, 20, 0) 24%)',
              content: '""',
              inset: 0,
              mixBlendMode: 'multiply',
              position: 'absolute',
            }
          : undefined,
        '&::after': isAtlas
          ? {
              backgroundImage:
                'linear-gradient(90deg, rgba(95, 61, 28, 0.08) 0, rgba(95, 61, 28, 0.08) 1px, transparent 1px), linear-gradient(rgba(95, 61, 28, 0.08) 0, rgba(95, 61, 28, 0.08) 1px, transparent 1px)',
              backgroundSize: '16px 16px',
              content: '""',
              inset: 0,
              opacity: 0.45,
              position: 'absolute',
            }
          : undefined,
      }}
    >
      <Box
        sx={{
          border: `1px solid ${theme.globe.countryStroke}`,
          borderRadius: '50%',
          bottom: -12,
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
          height: 76,
          left: '50%',
          position: 'absolute',
          transform: 'translateX(-50%)',
          width: 76,
          ...globeStyle,
        }}
      >
        <Box
          sx={{
            backgroundColor: theme.preview.land,
            borderRadius: '46% 54% 47% 53% / 37% 54% 46% 63%',
            height: 16,
            left: 15,
            position: 'absolute',
            top: 17,
            transform: 'rotate(-12deg)',
            width: 28,
          }}
        />
        <Box
          sx={{
            backgroundColor: theme.preview.land,
            borderRadius: '49% 51% 65% 35% / 50% 36% 64% 50%',
            height: 18,
            position: 'absolute',
            right: 12,
            top: 29,
            transform: 'rotate(18deg)',
            width: 20,
          }}
        />
        <Box
          sx={{
            border: `2px solid ${theme.preview.accent}`,
            borderRadius: '50%',
            height: 16,
            left: 40,
            position: 'absolute',
            top: 14,
            width: 16,
          }}
        />
      </Box>
    </Box>
  );
}

export function ThemeMenu({
  onAbout,
  onQuit,
  onRefocus,
  onRestart,
  renderer,
  onRendererChange,
}: ThemeMenuProps) {
  const [open, setOpen] = useState(false);
  const { activeTheme, setTheme, themes } = useAppearance();

  return (
    <Box
      sx={{
        left: { md: 24, xs: 16 },
        pointerEvents: 'auto',
        position: 'fixed',
        top: { md: 24, xs: 16 },
        width: { md: 320, xs: 'calc(100% - 32px)' },
        zIndex: 20,
      }}
    >
      <Stack alignItems="flex-start" spacing={1.5}>
        <Button
          size="small"
          sx={{
            backgroundColor: activeTheme.background.panel,
            border: `1px solid ${activeTheme.background.panelBorder}`,
            borderRadius: 999,
            boxShadow: activeTheme.background.panelShadow,
            minWidth: 0,
            px: 1.5,
          }}
          variant="contained"
          onClick={() => setOpen((value) => !value)}
        >
          Menu
        </Button>
        <Collapse in={open} sx={{ width: '100%' }}>
          <Paper
            elevation={0}
            sx={{
              backgroundColor: activeTheme.background.panel,
              border: `1px solid ${activeTheme.background.panelBorder}`,
              borderRadius: 4,
              boxShadow: activeTheme.background.panelShadow,
              p: 2,
            }}
          >
            <Stack spacing={2}>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                <Button size="small" variant="contained" onClick={onRefocus}>
                  Refocus
                </Button>
                <Button size="small" variant="outlined" onClick={onRestart}>
                  Retry
                </Button>
                <Button size="small" variant="outlined" onClick={onQuit}>
                  Quit
                </Button>
                <Button size="small" variant="outlined" onClick={onAbout}>
                  About
                </Button>
              </Stack>
              <Stack spacing={0.5}>
                <Typography variant="overline">Theme picker</Typography>
                <Typography variant="body2" color="text.secondary">
                  Switches the interface, scene background, and globe styling.
                </Typography>
              </Stack>
              <Stack spacing={1.25}>
                {themes.map((theme) => {
                  const isActive = theme.id === activeTheme.id;

                  return (
                    <Button
                      key={theme.id}
                      color={isActive ? 'primary' : 'inherit'}
                      sx={{
                        alignItems: 'stretch',
                        borderColor: isActive
                          ? 'primary.main'
                          : activeTheme.background.panelBorder,
                        justifyContent: 'flex-start',
                        p: 0.75,
                        textAlign: 'left',
                        textTransform: 'none',
                      }}
                      variant={isActive ? 'contained' : 'outlined'}
                      onClick={() => setTheme(theme.id)}
                    >
                      <Stack
                        direction="row"
                        spacing={1.25}
                        sx={{ alignItems: 'center', width: '100%' }}
                      >
                        <Box sx={{ flexShrink: 0, width: 94 }}>
                          <ThemePreview theme={theme} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2">{theme.label}</Typography>
                          <Typography
                            color={isActive ? 'inherit' : 'text.secondary'}
                            variant="body2"
                          >
                            {theme.description}
                          </Typography>
                        </Box>
                      </Stack>
                    </Button>
                  );
                })}
              </Stack>
              <Stack spacing={0.5}>
                <Typography variant="overline">Renderer</Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose between SVG precision and WebGL acceleration.
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant={renderer === 'svg' ? 'contained' : 'outlined'}
                  onClick={() => onRendererChange('svg')}
                >
                  SVG
                </Button>
                <Button
                  size="small"
                  variant={renderer === 'webgl' ? 'contained' : 'outlined'}
                  onClick={() => onRendererChange('webgl')}
                >
                  WebGL
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Collapse>
      </Stack>
    </Box>
  );
}
