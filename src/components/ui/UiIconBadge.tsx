import Box from '@mui/material/Box';
import type { BoxProps } from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';
import { designTokens } from '@/app/designSystem';

type UiIconBadgeSx = Exclude<SxProps<Theme>, readonly unknown[]>;

interface UiIconBadgeProps extends Omit<BoxProps, 'sx'> {
  badgeColor: string;
  badgeTextColor: string;
  sx?: UiIconBadgeSx;
}

export function UiIconBadge({
  badgeColor,
  badgeTextColor,
  sx,
  ...props
}: UiIconBadgeProps) {
  const resolvedSx = (theme: Theme) => {
    const customSx = typeof sx === 'function' ? sx(theme) : (sx ?? {});
    return {
      alignItems: 'center',
      bgcolor: badgeColor,
      borderRadius: { sm: designTokens.radius.sm, xs: designTokens.radius.xs },
      color: badgeTextColor,
      display: 'grid',
      justifyItems: 'center',
      minBlockSize: designTokens.touchTarget.min,
      minInlineSize: designTokens.touchTarget.min,
      p: 1,
      ...customSx,
    };
  };

  return (
    <Box
      {...props}
      sx={resolvedSx}
    />
  );
}
