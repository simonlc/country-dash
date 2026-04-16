import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import { getOverlayLayerSx } from '@/utils/controlStyles';

interface FloatingOverlayLayerProps {
  alignItems: 'start' | 'end';
  children: ReactNode;
  desktopBlockEndPadding: number;
  desktopBlockStartPadding: number;
  desktopInlinePadding: number;
  maxInlineSize: number;
  mobileBlockEndPadding: number | string;
  mobileBlockStartPadding: number | string;
  mobileInlineEndInset: string;
  mobileInlineStartInset: string;
}

export function FloatingOverlayLayer({
  alignItems,
  children,
  desktopBlockEndPadding,
  desktopBlockStartPadding,
  desktopInlinePadding,
  maxInlineSize,
  mobileBlockEndPadding,
  mobileBlockStartPadding,
  mobileInlineEndInset,
  mobileInlineStartInset,
}: FloatingOverlayLayerProps) {
  return (
    <Box
      sx={getOverlayLayerSx({
        alignItems,
        desktopBlockEndPadding,
        desktopBlockStartPadding,
        desktopInlinePadding,
        mobileBlockEndPadding,
        mobileBlockStartPadding,
        mobileInlineEndInset,
        mobileInlineStartInset,
      })}
    >
      <Box sx={{ inlineSize: '100%', maxInlineSize }}>{children}</Box>
    </Box>
  );
}
