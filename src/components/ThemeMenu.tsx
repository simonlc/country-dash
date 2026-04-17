import { Check, Crosshair, Globe, Info, MoreVertical, RotateCcw, XCircle } from 'react-feather';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppearance } from '@/app/appearance';
import { useI18n } from '@/app/i18n';
import { m } from '@/paraglide/messages.js';
import { ThemePreview } from '@/components/ThemePreview';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { getThemeLabel } from '@/utils/themeTranslations';

interface ThemeMenuProps {
  onAbout: () => void;
  onRefocus: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

interface MenuAction {
  color?: 'danger' | 'primary';
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
  const [languageDialogOpen, setLanguageDialogOpen] = useState(false);
  const { languages, locale, setLocale } = useI18n();
  const { activeTheme, setTheme, themes } = useAppearance();
  const menuPanelId = 'theme-menu-panel';
  const isRtlDocument =
    typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
  const menuAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (menuAnchorRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const actions = useMemo<MenuAction[]>(
    () => [
      {
        icon: Crosshair,
        label: m.action_refocus(),
        onClick: () => {
          setOpen(false);
          onRefocus();
        },
      },
      {
        icon: RotateCcw,
        label: m.action_retry(),
        onClick: () => {
          setOpen(false);
          onRestart();
        },
      },
      {
        icon: XCircle,
        label: m.action_quit(),
        color: 'danger',
        onClick: () => {
          setOpen(false);
          setConfirmQuitOpen(true);
        },
      },
      {
        icon: Info,
        label: m.action_about(),
        onClick: () => {
          setOpen(false);
          onAbout();
        },
      },
      {
        icon: Globe,
        label: m.menu_language_selector_aria(),
        onClick: () => {
          setOpen(false);
          setLanguageDialogOpen(true);
        },
      },
    ],
    [onAbout, onRefocus, onRestart],
  );

  return (
    <>
      <div className="pointer-events-auto relative inline-flex z-[2]" ref={menuAnchorRef}>
        <button
          aria-controls={open ? menuPanelId : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-label={open ? m.action_close() : m.action_menu()}
          className="surface-elevated grid min-h-11 min-w-11 place-items-center rounded-sm border border-[var(--surface-panel-border)] text-[var(--color-primary)]"
          type="button"
          onClick={() => setOpen((value) => !value)}
        >
          <MoreVertical size={17} />
        </button>
        {open ? (
          <div
            className={`surface-elevated absolute top-[calc(100%+8px)] z-[1300] max-h-[min(calc(var(--visual-viewport-height,100dvh)-env(safe-area-inset-top)-136px),70vh)] w-[min(92vw,360px)] overflow-y-auto rounded-sm border border-[var(--surface-panel-border)] p-4 ${isRtlDocument ? 'left-0' : 'right-0'}`}
            id={menuPanelId}
          >
            <div className="grid gap-3">
              <div className="grid gap-2 sm:grid-cols-2">
                {actions.map((action) => {
                  const ActionIcon = action.icon;

                  return (
                    <Button
                      aria-label={
                        action.label === m.action_refocus()
                          ? m.game_refocus_country_aria()
                          : action.label
                      }
                      className="justify-start text-start"
                      tone={action.color ?? 'primary'}
                      key={action.label}
                      size="sm"
                      startIcon={<ActionIcon size={14} />}
                      variant="contained"
                      onClick={action.onClick}
                    >
                      {action.label}
                    </Button>
                  );
                })}
              </div>
              <p className="m-0 text-xs text-[var(--color-muted)]">{m.menu_themes()}</p>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
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
                        setOpen(false);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <Dialog
        actions={(
          <Button onClick={() => setLanguageDialogOpen(false)}>
            {m.action_close()}
          </Button>
        )}
        open={languageDialogOpen}
        size="sm"
        title={m.menu_language_selector_aria()}
        onClose={() => setLanguageDialogOpen(false)}
      >
        <div className="grid gap-2">
          {languages.map((language) => {
            const isActiveLocale = language.locale === locale;

            return (
              <Button
                className="justify-between text-start"
                key={language.locale}
                size="lg"
                variant={isActiveLocale ? 'contained' : 'outlined'}
                onClick={() => {
                  void setLocale(language.locale);
                  setLanguageDialogOpen(false);
                }}
              >
                <span className="grid min-w-0 text-start">
                  <span className="text-sm font-medium">{language.nativeLabel}</span>
                  {language.englishLabel !== language.nativeLabel ? (
                    <span className="break-words text-xs text-[var(--color-muted)]">
                      {language.englishLabel}
                    </span>
                  ) : null}
                </span>
                {isActiveLocale ? <Check size={15} /> : null}
              </Button>
            );
          })}
        </div>
      </Dialog>

      <Dialog
        actions={(
          <>
            <Button onClick={() => setConfirmQuitOpen(false)}>
              {m.action_cancel()}
            </Button>
            <Button
              tone="danger"
              variant="contained"
              onClick={() => {
                setConfirmQuitOpen(false);
                onQuit();
              }}
            >
              {m.action_quit()}
            </Button>
          </>
        )}
        open={confirmQuitOpen}
        size="sm"
        title={m.menu_quit_current_run_title()}
        onClose={() => setConfirmQuitOpen(false)}
      >
        <p className="m-0 text-sm text-[var(--color-muted)]">
          {m.menu_quit_current_run_body()}
        </p>
      </Dialog>
    </>
  );
}
