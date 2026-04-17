import Button from '@mui/material/Button';
import type { ButtonProps } from '@mui/material/Button';
import type { SxProps, Theme } from '@mui/material/styles';
import { designTokens } from '@/app/designSystem';

const baseActionButtonSx = {
  borderRadius: designTokens.radius.sm,
  boxShadow: 'none',
  minBlockSize: designTokens.touchTarget.min,
  minInlineSize: { sm: 168, xs: 0 },
  paddingInline: { sm: 2.5, xs: 2 },
  textAlign: 'center',
  inlineSize: { xs: '100%', sm: 'auto' },
  whiteSpace: 'normal',
  wordBreak: 'break-word',
  '&:hover': {
    backgroundImage: 'none',
    boxShadow: 'none',
    transform: 'none',
  },
} as const;

type UiActionButtonSx = Exclude<SxProps<Theme>, readonly unknown[]>;

interface UiActionButtonProps extends Omit<ButtonProps, 'sx'> {
  sx?: UiActionButtonSx;
}

export function UiActionButton({ sx, ...props }: UiActionButtonProps) {
  const resolvedSx = (theme: Theme) => {
    const customSx = typeof sx === 'function' ? sx(theme) : (sx ?? {});
    return {
      ...baseActionButtonSx,
      ...customSx,
    };
  };

  return (
    <Button
      {...props}
      sx={resolvedSx}
    />
  );
}
