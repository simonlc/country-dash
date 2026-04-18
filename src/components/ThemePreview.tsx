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
  return (
    <button
      aria-label={ariaLabel}
      aria-pressed={selected}
      className={cn(
        'theme-preview relative h-[78px] w-full overflow-hidden rounded-lg',
        selected && 'outline-2 outline outline-blue-500',
      )}
      data-theme-id={theme.id}
      type="button"
      onClick={onClick}
    >
      <div className={cn('theme-preview-globe')}>
        <div className={cn('theme-preview-land-a')} />
        <div className={cn('theme-preview-land-b')} />
        <div className="theme-preview-target" />
      </div>
    </button>
  );
}
