import { useAppearance } from '@/app/appearance';
import { useI18n } from '@/app/i18n';
import { AboutDialog } from '@/components/AboutDialog';
import { ThemePreview } from '@/components/ThemePreview';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  playAgainAtom,
  refocusAtom,
  returnToMenuAtom,
} from '@/game/state/game-actions';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { getThemeLabel } from '@/utils/themeTranslations';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { useSetAtom } from 'jotai';
import { useId, useState } from 'react';
import {
  Check,
  Crosshair,
  Globe,
  Info,
  MoreVertical,
  RotateCcw,
  XCircle,
} from 'react-feather';

interface MenuAction {
  color?: 'danger' | 'primary';
  id: 'about' | 'language' | 'quit' | 'refocus' | 'retry';
  icon: typeof Crosshair;
  label: string;
  onSelect: () => void;
}

export function Menu() {
  const requestRefocus = useSetAtom(refocusAtom);
  const playAgain = useSetAtom(playAgainAtom);
  const [open, setOpen] = useState(false);
  const menuTriggerId = useId();
  const { activeTheme, setTheme, themes } = useAppearance();
  const quitConfirm = useModal(QuitConfirmDialog);
  const selectLanguage = useModal(LanguageSelectorDialog);
  const isRtlDocument =
    typeof document !== 'undefined' && document.documentElement.dir === 'rtl';

  const actions: MenuAction[] = [
    {
      id: 'refocus',
      icon: Crosshair,
      label: m.action_refocus(),
      onSelect: () => {
        setOpen(false);
        requestRefocus();
      },
    },
    {
      id: 'retry',
      icon: RotateCcw,
      label: m.action_retry(),
      onSelect: () => {
        setOpen(false);
        playAgain();
      },
    },
    {
      id: 'quit',
      icon: XCircle,
      label: m.action_quit(),
      color: 'danger',
      onSelect: () => {
        setOpen(false);
        void quitConfirm.show();
      },
    },
    {
      id: 'about',
      icon: Info,
      label: m.action_about(),
      onSelect: () => {
        setOpen(false);
        void NiceModal.show(AboutDialog);
      },
    },
    {
      id: 'language',
      icon: Globe,
      label: m.menu_language_selector_aria(),
      onSelect: () => {
        setOpen(false);
        void selectLanguage.show();
      },
    },
  ];

  return (
    <div className="pointer-events-auto relative">
      <DropdownMenu
        modal={false}
        open={open}
        triggerId={menuTriggerId}
        onOpenChange={setOpen}
      >
        <DropdownMenuTrigger
          aria-label={open ? m.action_close() : m.action_menu()}
          className={cn(
            buttonVariants({ size: 'sm', variant: 'text' }),
            'surface-elevated min-h-11 min-w-11 rounded-full border border-[var(--surface-panel-border)] p-0 text-primary',
          )}
          id={menuTriggerId}
          onClick={() => {
            if (!open) {
              setOpen(true);
            }
          }}
        >
          <MoreVertical size={17} />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={isRtlDocument ? 'start' : 'end'}
          className="w-[min(90vw,320px)]"
        >
          <div className="grid gap-2">
            <DropdownMenuGroup>
              {actions.map((action) => {
                const ActionIcon = action.icon;

                return (
                  <DropdownMenuItem
                    aria-label={
                      action.id === 'refocus'
                        ? m.game_refocus_country_aria()
                        : action.label
                    }
                    className={cn(
                      'justify-start',
                      action.color === 'danger'
                        ? 'text-[#d54b41] focus:bg-[rgba(213,75,65,0.16)]'
                        : null,
                    )}
                    key={action.id}
                    onClick={() => {
                      action.onSelect();
                    }}
                  >
                    <ActionIcon size={14} />
                    <span>{action.label}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-1 text-xs">
                {m.menu_themes()}
              </DropdownMenuLabel>
              <div className="grid grid-cols-2 gap-3 p-2">
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
            </DropdownMenuGroup>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

const LanguageSelectorDialog = NiceModal.create(() => {
  const modal = useModal();
  const { languages, locale, setLocale } = useI18n();
  return (
    <Dialog
      open={modal.visible}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          void modal.hide();
        }
      }}
    >
      <DialogContent className="sm:max-w-[420px]" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{m.menu_language_selector_aria()}</DialogTitle>
        </DialogHeader>
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
                  void modal.hide();
                }}
              >
                <span className="grid min-w-0 text-start">
                  <span className="text-sm font-medium">
                    {language.nativeLabel}
                  </span>
                  {language.englishLabel !== language.nativeLabel ? (
                    <span className="wrap-break-words text-xs text-[var(--color-muted)]">
                      {language.englishLabel}
                    </span>
                  ) : null}
                </span>
                {isActiveLocale ? <Check size={15} /> : null}
              </Button>
            );
          })}
        </div>
        <DialogFooter className="-mb-0 -mx-0 border-none bg-transparent p-0">
          <Button
            onClick={() => {
              void modal.hide();
            }}
          >
            {m.action_close()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

interface QuitConfirmDialogProps {
  onConfirm?: () => void;
}

const QuitConfirmDialog = NiceModal.create(
  ({ onConfirm }: QuitConfirmDialogProps) => {
    const modal = useModal();
    const returnToMenu = useSetAtom(returnToMenuAtom);
    return (
      <Dialog
        open={modal.visible}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            void modal.hide();
          }
        }}
      >
        <DialogContent className="sm:max-w-[420px]" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{m.menu_quit_current_run_title()}</DialogTitle>
            <DialogDescription>
              {m.menu_quit_current_run_body()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="-mb-0 -mx-0 border-none bg-transparent p-0">
            <Button
              onClick={() => {
                void modal.hide();
              }}
            >
              {m.action_cancel()}
            </Button>
            <Button
              tone="danger"
              variant="contained"
              onClick={() => {
                void modal.hide();
                if (onConfirm) {
                  onConfirm();
                  return;
                }
                returnToMenu();
              }}
            >
              {m.action_quit()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);
