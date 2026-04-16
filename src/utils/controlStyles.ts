import type { SxProps, Theme } from '@mui/material/styles';
import { designTokens } from '@/app/designSystem';
import type { AppThemeDefinition } from '@/app/theme';

interface SelectorCardOptions {
  selected: boolean;
  tone?: 'panel' | 'muted';
}

function hexToRgba(value: string, alpha: number) {
  const hex = value.replace('#', '');

  if (hex.length !== 6) {
    return value;
  }

  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function getSelectorCardSx(
  activeTheme: AppThemeDefinition,
  options: SelectorCardOptions,
): SxProps<Theme> {
  const { selected, tone = 'muted' } = options;
  const backgroundColor =
    tone === 'panel'
      ? activeTheme.background.panel
      : activeTheme.background.mutedPanel;

  return {
    appearance: 'none',
    backgroundColor: selected
      ? hexToRgba(
          activeTheme.palette.primary,
          activeTheme.mode === 'light' ? 0.14 : 0.22,
        )
      : backgroundColor,
    border: `${selected ? 2 : 1}px solid ${
      selected
        ? hexToRgba(activeTheme.palette.primary, 0.72)
        : hexToRgba(activeTheme.palette.textPrimary, 0.14)
    }`,
    borderRadius: designTokens.radius.xs,
    color: 'inherit',
    cursor: 'pointer',
    font: 'inherit',
    lineHeight: 'inherit',
    margin: 0,
    outline: 'none',
    textDecoration: 'none',
    textAlign: 'start',
    transition: `border-color ${designTokens.motion.fast} ease, box-shadow ${designTokens.motion.fast} ease, background-color ${designTokens.motion.fast} ease`,
    inlineSize: '100%',
    boxShadow: 'none',
    '&:hover': {
      backgroundColor: selected
        ? hexToRgba(
            activeTheme.palette.primary,
            activeTheme.mode === 'light' ? 0.18 : 0.26,
          )
        : hexToRgba(
            activeTheme.palette.primary,
            activeTheme.mode === 'light' ? 0.08 : 0.15,
          ),
      borderColor: hexToRgba(
        activeTheme.palette.primary,
        selected ? 0.84 : 0.52,
      ),
    },
    '&:focus-visible': {
      borderColor: activeTheme.palette.primary,
      boxShadow: `0 0 0 3px ${hexToRgba(activeTheme.palette.primary, 0.3)}`,
    },
  };
}

interface FloatingPanelSxOptions {
  compact: boolean;
  maxWidth: number | string;
}

export function getFloatingPanelSx({
  compact,
  maxWidth,
}: FloatingPanelSxOptions) {
  return {
    borderRadius: compact ? designTokens.radius.sm : designTokens.radius.md,
    inlineSize: '100%',
    maxInlineSize: maxWidth,
    paddingBlock: compact
      ? designTokens.componentDensity.mobile.py
      : designTokens.componentDensity.desktop.py,
    paddingInline: compact
      ? designTokens.componentDensity.mobile.px
      : designTokens.componentDensity.desktop.px,
  };
}

interface ChipShellSxOptions {
  compact: boolean;
  preferPill?: boolean;
  wrapped?: boolean;
}

export function getChipShellSx({
  compact,
  preferPill = true,
  wrapped = false,
}: ChipShellSxOptions) {
  const usePill = preferPill && !wrapped;

  return {
    borderRadius: usePill ? designTokens.radius.pill : designTokens.chip.fallbackRadius,
    minBlockSize: compact
      ? designTokens.touchTarget.min
      : designTokens.touchTarget.comfortable,
    overflow: 'hidden',
    paddingBlock: compact
      ? designTokens.componentDensity.mobile.py
      : designTokens.componentDensity.desktop.py,
    paddingInline: designTokens.chip.minInlinePadding,
  };
}

interface OverlayLayerSxOptions {
  alignItems: 'start' | 'end';
  desktopBlockEndPadding: number;
  desktopBlockStartPadding: number;
  desktopInlinePadding: number;
  mobileBlockEndPadding: number | string;
  mobileBlockStartPadding: number | string;
  mobileInlineEndInset: string;
  mobileInlineStartInset: string;
}

interface EdgeAttachedPanelRadiusSxOptions {
  desktopRadius: number;
  mobileAttach: 'bottom' | 'none' | 'top';
  mobileFreeRadius: number;
}

export function getEdgeAttachedPanelRadiusSx({
  desktopRadius,
  mobileAttach,
  mobileFreeRadius,
}: EdgeAttachedPanelRadiusSxOptions) {
  // Explicit mobile edge rule:
  // - top-attached panel => top corners must be square
  // - bottom-attached panel => bottom corners must be square
  // - unattached panel => all corners may be rounded
  if (mobileAttach === 'top') {
    return {
      borderEndEndRadius: { md: desktopRadius, xs: mobileFreeRadius },
      borderEndStartRadius: { md: desktopRadius, xs: mobileFreeRadius },
      borderStartEndRadius: { md: desktopRadius, xs: 0 },
      borderStartStartRadius: { md: desktopRadius, xs: 0 },
    };
  }

  if (mobileAttach === 'bottom') {
    return {
      borderEndEndRadius: { md: desktopRadius, xs: 0 },
      borderEndStartRadius: { md: desktopRadius, xs: 0 },
      borderStartEndRadius: { md: desktopRadius, xs: mobileFreeRadius },
      borderStartStartRadius: { md: desktopRadius, xs: mobileFreeRadius },
    };
  }

  return {
    borderRadius: { md: desktopRadius, xs: mobileFreeRadius },
  };
}

export function getOverlayLayerSx({
  alignItems,
  desktopBlockEndPadding,
  desktopBlockStartPadding,
  desktopInlinePadding,
  mobileBlockEndPadding,
  mobileBlockStartPadding,
  mobileInlineEndInset,
  mobileInlineStartInset,
}: OverlayLayerSxOptions): SxProps<Theme> {
  return {
    alignItems: alignItems === 'start' ? 'flex-start' : 'flex-end',
    display: 'flex',
    insetBlockEnd: 0,
    insetBlockStart: 0,
    insetInlineEnd: 0,
    insetInlineStart: 0,
    justifyContent: 'center',
    paddingBlockEnd: {
      md: desktopBlockEndPadding,
      xs: mobileBlockEndPadding,
    },
    paddingBlockStart: {
      md: desktopBlockStartPadding,
      xs: mobileBlockStartPadding,
    },
    paddingInlineEnd: {
      md: desktopInlinePadding,
      xs: mobileInlineEndInset,
    },
    paddingInlineStart: {
      md: desktopInlinePadding,
      xs: mobileInlineStartInset,
    },
    pointerEvents: 'none',
    position: 'absolute',
  };
}
