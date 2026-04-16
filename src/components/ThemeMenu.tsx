import {
  Box,
  Button,
  ClickAwayListener,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { getThemeLabel } from '@/utils/themeTranslations';

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
  const isRtlDocument = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
  const inlineStartAnchor = isRtlDocument ? 'right' : 'left';
  const menuTransformOrigin = isRtlDocument ? 'top left' : 'top right';

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
            md: 'repeat(2, minmax(0, 1fr))',
            xs: 'repeat(1, minmax(0, 1fr))',
          },
          paddingBlock: 2,
        }}
      >
        {actions.map((action) => {
          const ActionIcon = action.icon;

          return (
            <Button
              aria-label={
                action.label === m.action_refocus()
                  ? m.game_refocus_country_aria()
                  : action.label
              }
              key={action.label}
              size="small"
              startIcon={<ActionIcon size={14} />}
              sx={{
                justifyContent: 'flex-start',
                minBlockSize: designTokens.touchTarget.comfortable,
                minInlineSize: 0,
                paddingInline: 1.5,
                textAlign: 'start',
                textTransform: 'none',
                whiteSpace: 'normal',
              }}
              variant="contained"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          );
        })}
      </Box>
      <Typography color="text.secondary" variant="caption">
        {m.menu_themes()}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gap: 0.9,
          gridTemplateColumns: {
            md: 'repeat(3, minmax(0, 1fr))',
            xs: 'repeat(2, minmax(0, 1fr))',
          },
        }}
      >
        {themes.map((themeOption) => {
          const isActive = themeOption.id === activeTheme.id;

          return (
            <ThemePreview
              ariaLabel={getThemeLabel(themeOption.id)}
              key={themeOption.id}
              selected={isActive}
              theme={themeOption}
              onClick={() => {
                setTheme(themeOption.id);
                closeMenu();
              }}
            />
          );
        })}
      </Box>
    </Stack>
  );

  return (
    <>
      <Box
        sx={{
          display: 'inline-flex',
          pointerEvents: 'auto',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <ClickAwayListener
          onClickAway={() => {
            if (open) {
              closeMenu();
            }
          }}
        >
          <Stack alignItems="flex-end" spacing={1} sx={{ position: 'relative' }}>
            <Stack direction="row" spacing={1}>
              <Button
                aria-controls={menuPanelId}
                aria-expanded={open}
                size={isCompactLayout ? 'medium' : 'small'}
                sx={{
                  minBlockSize: designTokens.touchTarget.min,
                  minInlineSize: 0,
                  paddingBlock: 0.85,
                  paddingInline: 2,
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
                    minBlockSize: designTokens.touchTarget.min,
                    minInlineSize: designTokens.touchTarget.min,
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
                anchorOrigin={{ horizontal: inlineStartAnchor, vertical: 'bottom' }}
                id={languageMenuId}
                open={languageMenuOpen}
                transformOrigin={{ horizontal: inlineStartAnchor, vertical: 'top' }}
                onClose={() => setLanguageAnchorEl(null)}
              >
                {languages.map((language) => {
                  const isActiveLocale = language.locale === locale;

                  return (
                    <MenuItem
                      key={language.locale}
                      selected={isActiveLocale}
                      sx={{ minInlineSize: designTokens.menu.languageItemMinWidth }}
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
            <Collapse
              in={open}
              sx={{
                position: 'absolute',
                insetBlockStart: 'calc(100% + 8px)',
                insetInlineEnd: 0,
                transformOrigin: menuTransformOrigin,
                inlineSize: {
                  md: designTokens.menu.panelWidth,
                  xs: `min(92vw, ${designTokens.menu.panelWidth + 40}px)`,
                },
                zIndex: theme.zIndex.modal,
              }}
            >
              <Paper
                id={menuPanelId}
                elevation={0}
                sx={{
                  ...panelSurface,
                  borderRadius: designTokens.radius.sm,
                  maxHeight: {
                    md: 'none',
                    xs: `min(calc(var(--visual-viewport-height, 100dvh) - env(safe-area-inset-top) - ${designTokens.menu.viewportOffset}px), 70vh)`,
                  },
                  overflowY: {
                    md: 'visible',
                    xs: 'auto',
                  },
                  padding: 2,
                }}
              >
                {menuContent}
              </Paper>
            </Collapse>
          </Stack>
        </ClickAwayListener>
      </Box>
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
