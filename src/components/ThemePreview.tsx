import type { AppThemeDefinition } from '@/app/theme';
import { cn } from '@/lib/utils';

interface ThemePreviewProps {
  ariaLabel?: string;
  onClick?: () => void;
  selected?: boolean;
  theme: AppThemeDefinition;
}

export function ThemePreview({
  ariaLabel,
  onClick,
  selected = false,
  theme,
}: ThemePreviewProps) {
  const atlasStyleEnabled = theme.render.atlasStyleEnabled;
  const isInteractive = typeof onClick === 'function';
  const sharedClassName = cn(
    'theme-preview relative h-[78px] w-full overflow-hidden rounded-md outline outline-2 transition-[outline-color,box-shadow]',
    selected
      ? 'outline-[var(--tp-primary)]'
      : 'outline-[var(--tp-outline)]',
    isInteractive ? 'cursor-pointer hover:outline-[var(--tp-primary)] focus-visible:outline-[var(--tp-primary)] focus-visible:ring-2 focus-visible:ring-[var(--tp-primary)]' : 'cursor-default',
  );

  const content = (
    <>
      {atlasStyleEnabled ? (
        <>
          <div className="theme-preview-atlas-overlay-a" />
          <div className="theme-preview-atlas-overlay-b" />
        </>
      ) : null}
      <div className={cn('theme-preview-globe', atlasStyleEnabled ? 'theme-preview-globe-atlas' : null)}>
        <div className={cn('theme-preview-land-a', atlasStyleEnabled ? 'theme-preview-land-atlas' : null)} />
        <div className={cn('theme-preview-land-b', atlasStyleEnabled ? 'theme-preview-land-atlas' : null)} />
        <div className="theme-preview-target" />
      </div>
    </>
  );

  if (isInteractive) {
    return (
      <button
        aria-label={ariaLabel}
        aria-pressed={selected}
        className={sharedClassName}
        data-theme-id={theme.id}
        type="button"
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return (
    <div aria-label={ariaLabel} className={sharedClassName} data-theme-id={theme.id}>
      {content}
    </div>
  );
}
