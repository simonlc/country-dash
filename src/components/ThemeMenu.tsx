import {
  Box,
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Crosshair, Info, RotateCcw, XCircle } from 'react-feather';
import { useState } from 'react';
import { useAppearance } from '@/app/appearance';
import { designTokens } from '@/app/designSystem';
import { getThemeSurfaceStyles } from '@/app/theme';
import { ThemePreview } from '@/components/ThemePreview';
import { getSelectorCardSx } from '@/utils/controlStyles';

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
}

export function ThemeMenu({
  onAbout,
  onQuit,
  onRefocus,
  onRestart,
}: ThemeMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirmQuitOpen, setConfirmQuitOpen] = useState(false);
  const theme = useTheme();
  const isCompactLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const { activeTheme, setTheme, themes } = useAppearance();
  const panelSurface = getThemeSurfaceStyles(activeTheme, 'elevated');
  const menuPanelId = 'theme-menu-panel';
  const actions: MenuAction[] = [
    {
      icon: Crosshair,
      label: 'Refocus',
      onClick: onRefocus,
    },
    { icon: RotateCcw, label: 'Retry', onClick: onRestart },
    {
      icon: XCircle,
      label: 'Quit',
      onClick: () => setConfirmQuitOpen(true),
    },
    { icon: Info, label: 'About', onClick: onAbout },
  ];

  return (
    <Box
      sx={{
        left: {
          md: 24,
          xs: 'calc(env(safe-area-inset-left) + 12px)',
        },
        pointerEvents: 'auto',
        position: 'fixed',
        top: {
          md: 24,
          xs: 'calc(env(safe-area-inset-top) + 12px)',
        },
        width: { md: 320, xs: 96 },
        zIndex: 20,
      }}
    >
      <Stack alignItems="flex-start" spacing={1.5}>
        <Button
          aria-controls={menuPanelId}
          aria-expanded={open}
          size={isCompactLayout ? 'medium' : 'small'}
          sx={{
            borderRadius: { md: designTokens.radius.sm, xs: designTokens.radius.xs },
            minHeight: { xs: 40 },
            minWidth: 0,
            px: 2,
            py: 0.85,
          }}
          variant="contained"
          onClick={() => setOpen((value) => !value)}
        >
          Menu
        </Button>
        <Collapse in={open} sx={{ width: '100%' }}>
          <Paper
            id={menuPanelId}
            elevation={0}
            sx={{
              ...panelSurface,
              borderRadius: { md: designTokens.radius.sm, xs: designTokens.radius.xs },
              maxHeight: {
                md: 'none',
                xs: 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 84px)',
              },
              overflowY: 'auto',
              p: 2,
            }}
          >
            <Stack spacing={1.25}>
              <Box
                sx={{
                  display: 'grid',
                  gap: 1,
                  gridTemplateColumns: {
                    md: 'repeat(4, minmax(0, 1fr))',
                    xs: 'repeat(2, minmax(0, 1fr))',
                  },
                  paddingBlock: 2,
                }}
              >
                {actions.map((action) => {
                  return (
                    <Button
                      aria-label={
                        action.label === 'Refocus'
                          ? 'Refocus country'
                          : action.label
                      }
                      key={action.label}
                      size="small"
                      sx={{
                        borderRadius: { md: designTokens.radius.sm, xs: designTokens.radius.xs },
                        display: 'grid',
                        gap: 0.55,
                        minHeight: 52,
                        minWidth: 0,
                      }}
                      variant="contained"
                      onClick={action.onClick}
                    >
                      <Typography variant="caption">{action.label}</Typography>
                    </Button>
                  );
                })}
              </Box>
              <Typography
                color="text.secondary"
                sx={{ px: 0.25 }}
                variant="caption"
              >
                Themes
              </Typography>
              <Stack spacing={0.9}>
                {themes.map((theme) => {
                  const isActive = theme.id === activeTheme.id;

                  return (
                    <Box
                      aria-pressed={isActive}
                      component="button"
                      key={theme.id}
                      type="button"
                      sx={{
                        alignItems: 'stretch',
                        ...getSelectorCardSx(activeTheme, {
                          selected: isActive,
                        }),
                        borderRadius: designTokens.radius.xs,
                        justifyContent: 'flex-start',
                        p: 0.95,
                        textAlign: 'left',
                      }}
                      onClick={() => setTheme(theme.id)}
                    >
                      <Stack
                        direction="row"
                        spacing={1.25}
                        sx={{ alignItems: 'center', width: '100%' }}
                      >
                        <Box sx={{ flexShrink: 0, width: { md: 82, xs: 72 } }}>
                          <ThemePreview theme={theme} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2">
                            {theme.label}
                          </Typography>
                          <Typography color="text.secondary" variant="caption">
                            {theme.description}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </Stack>
          </Paper>
        </Collapse>
      </Stack>
      <Dialog
        fullScreen={isCompactLayout}
        fullWidth
        maxWidth="xs"
        open={confirmQuitOpen}
        PaperProps={{
          sx: {
            ...panelSurface,
            borderRadius: { md: designTokens.radius.md, xs: designTokens.radius.xs },
            backgroundImage: 'none',
          },
        }}
        onClose={() => setConfirmQuitOpen(false)}
      >
        <DialogTitle>Quit current run?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Return to the main menu? Your current run progress will be lost.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmQuitOpen(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              setConfirmQuitOpen(false);
              onQuit();
            }}
          >
            Quit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
