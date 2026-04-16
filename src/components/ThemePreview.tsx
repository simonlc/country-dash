import { Box } from '@mui/material';
import type { AppThemeDefinition } from '@/app/theme';

interface ThemePreviewProps {
  theme: AppThemeDefinition;
  selected?: boolean;
  ariaLabel?: string;
  onClick?: () => void;
}

export function ThemePreview({
  theme,
  selected = false,
  ariaLabel,
  onClick,
}: ThemePreviewProps) {
  const atlasStyleEnabled = theme.render.atlasStyleEnabled;
  const isInteractive = typeof onClick === 'function';

  return (
    <Box
      aria-label={ariaLabel}
      aria-pressed={isInteractive ? selected : undefined}
      component={isInteractive ? 'button' : 'div'}
      type={isInteractive ? 'button' : undefined}
      sx={{
        appearance: 'none',
        background: theme.preview.sky,
        borderRadius: 3,
        cursor: isInteractive ? 'pointer' : 'default',
        height: 78,
        margin: 0,
        outline: `2px solid ${
          selected ? theme.palette.primary : theme.background.panelBorder
        }`,
        overflow: 'hidden',
        p: 0,
        position: 'relative',
        transition: 'outline-color 160ms ease, box-shadow 160ms ease',
        width: '100%',
        '&:focus-visible': {
          boxShadow: `0 0 0 3px ${theme.palette.primary}`,
          outlineColor: theme.palette.primary,
        },
        '&:hover': isInteractive
          ? {
              outlineColor: theme.palette.primary,
            }
          : undefined,
        '&::before': atlasStyleEnabled
          ? {
              background:
                'radial-gradient(circle at 16% 28%, rgba(126, 92, 61, 0.16) 0, rgba(126, 92, 61, 0.08) 11%, rgba(126, 92, 61, 0) 22%), radial-gradient(circle at 82% 78%, rgba(63, 78, 92, 0.14) 0, rgba(63, 78, 92, 0.06) 14%, rgba(63, 78, 92, 0) 26%), linear-gradient(180deg, rgba(255,255,255,0.14), rgba(120,99,73,0.08))',
              content: '""',
              inset: 0,
              mixBlendMode: 'multiply',
              position: 'absolute',
            }
          : undefined,
        '&::after': atlasStyleEnabled
          ? {
              backgroundImage:
                'linear-gradient(90deg, rgba(82, 62, 43, 0.08) 0, rgba(82, 62, 43, 0.08) 1px, transparent 1px), linear-gradient(rgba(82, 62, 43, 0.07) 0, rgba(82, 62, 43, 0.07) 1px, transparent 1px), linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0) 32%)',
              backgroundSize: '16px 16px, 16px 16px, 100% 100%',
              content: '""',
              inset: 0,
              opacity: 0.4,
              position: 'absolute',
            }
          : undefined,
      }}
      onClick={onClick}
    >
      <Box
        sx={{
          background: atlasStyleEnabled
            ? `radial-gradient(circle at 34% 30%, rgba(255,255,255,0.2), transparent 22%), radial-gradient(circle at 54% 36%, ${theme.preview.glow}, transparent 42%), linear-gradient(180deg, rgba(78, 95, 112, 0.3), rgba(245, 238, 221, 0) 58%), ${theme.preview.ocean}`
            : `radial-gradient(circle at 36% 34%, ${theme.preview.glow}, transparent 38%), ${theme.preview.ocean}`,
          border: `1px solid ${theme.globe.countryStroke}`,
          borderRadius: '50%',
          bottom: -12,
          boxShadow: atlasStyleEnabled
            ? 'inset 0 0 0 1px rgba(255,255,255,0.12), inset 0 -12px 24px rgba(61, 77, 87, 0.14)'
            : 'inset 0 0 0 1px rgba(255,255,255,0.08)',
          height: 76,
          left: '50%',
          position: 'absolute',
          transform: 'translateX(-50%)',
          width: 76,
        }}
      >
        <Box
          sx={{
            background: atlasStyleEnabled
              ? `linear-gradient(160deg, rgba(237, 231, 208, 0.22), rgba(237, 231, 208, 0)), ${theme.preview.land}`
              : theme.preview.land,
            borderRadius: '46% 54% 47% 53% / 37% 54% 46% 63%',
            boxShadow: atlasStyleEnabled
              ? `0 0 0 1px ${theme.globe.countryStroke}`
              : undefined,
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
            background: atlasStyleEnabled
              ? `linear-gradient(160deg, rgba(237, 231, 208, 0.22), rgba(237, 231, 208, 0)), ${theme.preview.land}`
              : theme.preview.land,
            borderRadius: '49% 51% 65% 35% / 50% 36% 64% 50%',
            boxShadow: atlasStyleEnabled
              ? `0 0 0 1px ${theme.globe.countryStroke}`
              : undefined,
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
