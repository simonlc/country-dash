import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { designTokens } from '@/app/designSystem';
import {
  getEdgeAttachedPanelRadiusSx,
  getFloatingPanelSx,
} from '@/utils/controlStyles';

type PanelSurfaceSx = Exclude<SxProps<Theme>, readonly unknown[]>;

interface PanelProps {
  children: ReactNode;
  className?: string;
  compact?: boolean;
  edgeAttachment?: 'bottom' | 'none' | 'top';
  flat?: boolean;
  maxWidth?: number;
  panelSurface: PanelSurfaceSx;
  spacing?: number;
}

export function Panel({
  children,
  className,
  compact = false,
  edgeAttachment = 'none',
  flat = false,
  maxWidth = 560,
  panelSurface,
  spacing = 2,
}: PanelProps) {
  const mobileFreeRadius = compact
    ? designTokens.radius.sm
    : designTokens.radius.xs;
  const mobilePaddingBlock = compact
    ? designTokens.componentDensity.mobile.py
    : designTokens.componentSpacing.overlayPanel.mobile;
  const mobilePaddingInline = compact
    ? designTokens.componentDensity.mobile.px
    : designTokens.componentSpacing.overlayPanel.mobile;
  const panelShellSx = {
    ...getFloatingPanelSx({
      compact,
      maxWidth,
    }),
    ...getEdgeAttachedPanelRadiusSx({
      desktopRadius: designTokens.radius.sm,
      mobileAttach: edgeAttachment,
      mobileFreeRadius,
    }),
    alignSelf: 'end',
    marginBlockEnd: {
      md: designTokens.layout.floatingOffset.desktopBottom,
      xs: 0,
    },
    maxInlineSize: { md: maxWidth, xs: '100%' },
    overflow: 'visible',
    paddingBlock: {
      md: designTokens.componentSpacing.overlayPanel.desktop,
      xs: mobilePaddingBlock,
    },
    paddingInline: {
      md: designTokens.componentSpacing.overlayPanel.desktop,
      xs: mobilePaddingInline,
    },
    pointerEvents: 'auto',
    textAlign: 'center',
    ...(edgeAttachment === 'bottom'
      ? {
          paddingBlockEnd: 'calc(16px + env(safe-area-inset-bottom))',
        }
      : null),
    ...(flat
      ? {
          backgroundImage: 'none',
          boxShadow: 'none',
        }
      : null),
  } as const;
  const resolvedSx = (theme: Theme) => {
    const resolvedPanelSurface = typeof panelSurface === 'function'
      ? panelSurface(theme)
      : panelSurface;

    return {
      ...resolvedPanelSurface,
      ...panelShellSx,
    };
  };

  return (
    <Paper
      className={className}
      elevation={0}
      sx={resolvedSx}
    >
      <Stack spacing={spacing}>{children}</Stack>
    </Paper>
  );
}
