import Box from '@mui/material/Box';
import type { BoxProps } from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';
import { designTokens } from '@/app/designSystem';

type UiCardSx = Exclude<SxProps<Theme>, readonly unknown[]>;

interface UiCardProps extends Omit<BoxProps, 'sx'> {
  outlined?: boolean;
  sx?: UiCardSx;
}

export function UiCard({ outlined = false, sx, ...props }: UiCardProps) {
  const resolvedSx = (theme: Theme) => {
    const baseStyles = {
      borderRadius: designTokens.radius.sm,
      boxShadow: 'none',
      overflow: 'hidden',
    };
    const outlinedStyles = outlined
      ? {
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }
      : {};

    if (!sx) {
      return {
        ...baseStyles,
        ...outlinedStyles,
      };
    }

    if (typeof sx === 'function') {
      return {
        ...baseStyles,
        ...outlinedStyles,
        ...sx(theme),
      };
    }

    return {
      ...baseStyles,
      ...outlinedStyles,
      ...sx,
    };
  };

  return (
    <Box
      {...props}
      sx={resolvedSx}
    />
  );
}
