import {
  Box,
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Check, Crosshair, Globe, Info, RotateCcw, XCircle } from 'react-feather';
import { useState } from 'react';
import { useAppearance } from '@/app/appearance';
import { useI18n } from '@/app/i18n';
import { designTokens } from '@/app/designSystem';
import { m } from '@/paraglide/messages.js';
import { getThemeSurfaceStyles } from '@/app/theme';
import { ThemePreview } from '@/components/ThemePreview';
import { getSelectorCardSx } from '@/utils/controlStyles';
import {
  getThemeDescription,
  getThemeLabel,
} from '@/utils/themeTranslations';

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
  const [languageAnchorEl, setLanguageAnchorEl] = useState<HTMLElement | null>(null);
  const theme = useTheme();
  const isCompactLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const { languages, locale, setLocale } = useI18n();
  const { activeTheme, setTheme, themes } = useAppearance();
  const panelSurface = getThemeSurfaceStyles(activeTheme, 'elevated');
  const menuPanelId = 'theme-menu-panel';
  const languageMenuId = 'language-menu-panel';
  const languageMenuOpen = Boolean(languageAnchorEl);

  const closeMenu = () => {
    setOpen(false);
  };

  const actions: MenuAction[] = [
    {
      icon: Crosshair,
      label: m.action_refocus(),
      onClick: () => {
        closeMenu();
        onRefocus();
      },
    },
    {
      icon: RotateCcw,
      label: m.action_retry(),
      onClick: () => {
        closeMenu();
        onRestart();
      },
    },
    {
      icon: XCircle,
      label: m.action_quit(),
      onClick: () => {
        closeMenu();
        setConfirmQuitOpen(true);
      },
    },
    {
      icon: Info,
      label: m.action_about(),
      onClick: () => {
        closeMenu();
        onAbout();
      },
    },
  ];

  const menuContent = (
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
        {actions.map((action) => (
          <Button
            aria-label={
              action.label === m.action_refocus()
                ? m.game_refocus_country_aria()
                : action.label
            }
            key={action.label}
            size="small"
            sx={{
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
        ))}
      </Box>
      <Typography color="text.secondary" sx={{ px: 0.25 }} variant="caption">
        {m.menu_themes()}
      </Typography>
      <Stack spacing={0.9}>
        {themes.map((themeOption) => {
          const isActive = themeOption.id === activeTheme.id;

          return (
            <Box
              aria-pressed={isActive}
              component="button"
              key={themeOption.id}
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
              onClick={() => {
                setTheme(themeOption.id);
                closeMenu();
              }}
            >
              <Stack
                direction="row"
                spacing={1.25}
                sx={{ alignItems: 'center', width: '100%' }}
              >
                <Box sx={{ flexShrink: 0, width: { md: 82, xs: 72 } }}>
                  <ThemePreview theme={themeOption} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2">
                    {getThemeLabel(themeOption.id)}
                  </Typography>
                  <Typography color="text.secondary" variant="caption">
                    {getThemeDescription(themeOption.id)}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Stack>
  );

  return (
    <>
      <Box
        sx={{
          left: {
            md: 24,
            xs: 'calc(env(safe-area-inset-left) + 12px)',
          },
          pointerEvents: 'none',
          position: 'fixed',
          top: {
            md: 24,
            xs: 'calc(env(safe-area-inset-top) + 12px)',
          },
          width: { md: 320, xs: 'auto' },
          zIndex: isCompactLayout ? theme.zIndex.drawer + 1 : 20,
        }}
      >
        <Stack alignItems="flex-start" spacing={1.5} sx={{ pointerEvents: 'auto' }}>
          <Stack direction="row" spacing={1}>
            <Button
              aria-controls={menuPanelId}
              aria-expanded={open}
              size={isCompactLayout ? 'medium' : 'small'}
              sx={{
                minHeight: { xs: 40 },
                minWidth: 0,
                px: 2,
                py: 0.85,
              }}
              variant="contained"
              onClick={() => setOpen((value) => !value)}
            >
              {open ? m.action_close() : m.action_menu()}
            </Button>
            <IconButton
              aria-controls={languageMenuOpen ? languageMenuId : undefined}
              aria-expanded={languageMenuOpen ? 'true' : undefined}
              aria-haspopup="menu"
              aria-label={m.menu_language_selector_aria()}
              color="primary"
              size={isCompactLayout ? 'medium' : 'small'}
              sx={[
                panelSurface,
                {
                  minHeight: { xs: 40 },
                  minWidth: { xs: 40 },
                },
              ]}
              onClick={(event) => {
                setLanguageAnchorEl(event.currentTarget);
              }}
            >
              <Globe size={16} />
            </IconButton>
            <Menu
              anchorEl={languageAnchorEl}
              anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
              id={languageMenuId}
              open={languageMenuOpen}
              transformOrigin={{ horizontal: 'left', vertical: 'top' }}
              onClose={() => setLanguageAnchorEl(null)}
            >
              {languages.map((language) => {
                const isActiveLocale = language.locale === locale;

                return (
                  <MenuItem
                    key={language.locale}
                    selected={isActiveLocale}
                    sx={{ minWidth: 224 }}
                    onClick={() => {
                      void setLocale(language.locale);
                      setLanguageAnchorEl(null);
                    }}
                  >
                    <Stack
                      alignItems="center"
                      direction="row"
                      justifyContent="space-between"
                      spacing={2}
                      sx={{ width: '100%' }}
                    >
                      <Stack spacing={0}>
                        <Typography variant="body2">{language.nativeLabel}</Typography>
                        {language.englishLabel !== language.nativeLabel ? (
                          <Typography color="text.secondary" variant="caption">
                            {language.englishLabel}
                          </Typography>
                        ) : null}
                      </Stack>
                      {isActiveLocale ? <Check size={15} /> : null}
                    </Stack>
                  </MenuItem>
                );
              })}
            </Menu>
          </Stack>
          {!isCompactLayout ? (
            <Collapse in={open} sx={{ width: '100%' }}>
              <Paper
                id={menuPanelId}
                elevation={0}
                sx={{
                  ...panelSurface,
                  borderRadius: designTokens.radius.sm,
                  p: 2,
                }}
              >
                {menuContent}
              </Paper>
            </Collapse>
          ) : null}
        </Stack>
      </Box>
      {isCompactLayout ? (
        <Drawer
          anchor="top"
          open={open}
          PaperProps={{
            id: menuPanelId,
            sx: {
              ...panelSurface,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              borderBottomLeftRadius: designTokens.radius.xs,
              borderBottomRightRadius: designTokens.radius.xs,
              maxHeight:
                'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 8px)',
              overflowY: 'auto',
              pb: 'max(env(safe-area-inset-bottom), 12px)',
              pt: 'calc(env(safe-area-inset-top) + 60px)',
              px: 1.5,
            },
          }}
          onClose={closeMenu}
        >
          {menuContent}
        </Drawer>
      ) : null}
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
        <DialogTitle>{m.menu_quit_current_run_title()}</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            {m.menu_quit_current_run_body()}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmQuitOpen(false)}>
            {m.action_cancel()}
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              setConfirmQuitOpen(false);
              onQuit();
            }}
          >
            {m.action_quit()}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
