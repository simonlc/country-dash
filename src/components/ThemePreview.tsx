import { Box } from '@mui/material';
import { designTokens } from '@/app/designSystem';
import type { AppThemeDefinition } from '@/app/theme';

interface ThemePreviewProps {
  theme: AppThemeDefinition;
}

export function ThemePreview({ theme }: ThemePreviewProps) {
  const isAtlas = theme.id === 'atlas';

  return (
    <Box
      sx={{
        background: theme.preview.sky,
        borderRadius: designTokens.radius.sm,
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
          background: `radial-gradient(circle at 36% 34%, ${theme.preview.glow}, transparent 38%), ${theme.preview.ocean}`,
          border: `1px solid ${theme.globe.countryStroke}`,
          borderRadius: '50%',
          bottom: -12,
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
          height: 76,
          left: '50%',
          position: 'absolute',
          transform: 'translateX(-50%)',
          width: 76,
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
