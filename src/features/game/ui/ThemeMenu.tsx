import {
  Box,
  Button,
  Collapse,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { Crosshair, Info, RotateCcw, XCircle } from 'react-feather';
import { useMemo, useState } from 'react';
import { useAppearance } from '@/app/appearance';
import {
  getThemeAccentSurfaceStyles,
  getThemeSurfaceStyles,
  type AppThemeDefinition,
} from '@/app/theme';

interface ThemeMenuProps {
  onAbout: () => void;
  onRefocus: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

interface MenuAction {
  icon: typeof Crosshair;
  label: string;
  onClick: () => void;
  tone?: 'contained' | 'outlined';
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
}: ThemeMenuProps) {
  const [open, setOpen] = useState(false);
  const { activeTheme, setTheme, themes } = useAppearance();
  const panelSurface = getThemeSurfaceStyles(activeTheme, 'elevated');
  const mutedSurface = getThemeSurfaceStyles(activeTheme, 'muted');
  const actions: MenuAction[] = [
    { icon: Crosshair, label: 'Refocus', onClick: onRefocus, tone: 'contained' },
    { icon: RotateCcw, label: 'Retry', onClick: onRestart },
    { icon: XCircle, label: 'Quit', onClick: onQuit },
    { icon: Info, label: 'About', onClick: onAbout },
  ];

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
          aria-expanded={open}
          size="small"
          sx={{
            ...panelSurface,
            minWidth: 0,
          }}
          variant="outlined"
          onClick={() => setOpen((value) => !value)}
        >
          Menu
        </Button>
        <Collapse in={open} sx={{ width: '100%' }}>
          <Paper
            elevation={0}
            sx={{
              ...panelSurface,
              borderRadius: 5,
              p: 1.5,
            }}
          >
            <Stack spacing={1.25}>
              <Box
                sx={{
                  display: 'grid',
                  gap: 1,
                  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                }}
              >
                {actions.map((action) => {
                  const ActionIcon = action.icon;

                  return (
                  <Button
                    aria-label={action.label === 'Refocus' ? 'Refocus country' : action.label}
                    key={action.label}
                    size="small"
                    sx={{
                      ...((action.tone === 'contained' ? panelSurface : mutedSurface) as object),
                      borderRadius: 3,
                      display: 'grid',
                      gap: 0.4,
                      minHeight: 72,
                      minWidth: 0,
                      p: 1,
                    }}
                    variant={action.tone === 'contained' ? 'contained' : 'outlined'}
                    onClick={action.onClick}
                  >
                    <Box
                      aria-hidden
                      sx={{ display: 'grid', lineHeight: 0, placeItems: 'center' }}
                    >
                      <ActionIcon size={16} strokeWidth={2} />
                    </Box>
                    <Typography variant="caption">{action.label}</Typography>
                  </Button>
                  );
                })}
              </Box>
              <Typography color="text.secondary" sx={{ px: 0.25 }} variant="caption">
                Themes
              </Typography>
              <Stack spacing={0.9}>
                {themes.map((theme) => {
                  const isActive = theme.id === activeTheme.id;

                  return (
                    <Button
                      key={theme.id}
                      sx={{
                        alignItems: 'stretch',
                        ...(isActive
                          ? getThemeAccentSurfaceStyles(activeTheme, 'strong')
                          : mutedSurface),
                        borderColor: isActive
                          ? 'primary.main'
                          : activeTheme.background.panelBorder,
                        borderRadius: 3,
                        justifyContent: 'flex-start',
                        p: 0.75,
                        textAlign: 'left',
                      }}
                      variant="outlined"
                      onClick={() => setTheme(theme.id)}
                    >
                      <Stack
                        direction="row"
                        spacing={1.25}
                        sx={{ alignItems: 'center', width: '100%' }}
                      >
                        <Box sx={{ flexShrink: 0, width: 82 }}>
                          <ThemePreview theme={theme} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2">{theme.label}</Typography>
                          <Typography color="text.secondary" variant="caption">
                            {theme.description}
                          </Typography>
                        </Box>
                      </Stack>
                    </Button>
                  );
                })}
              </Stack>
            </Stack>
          </Paper>
        </Collapse>
      </Stack>
    </Box>
  );
}
