import { describe, expect, it } from 'vitest';
import {
  appThemes,
  getThemeDisplaySurfaceStyles,
  type AppThemeDefinition,
} from '@/app/theme';
import {
  getContrastRatio,
  resolveColorAgainstBackground,
  withAlpha,
} from '@/utils/colorContrast';

function getResolvedPanelColor(theme: AppThemeDefinition) {
  return resolveColorAgainstBackground(
    theme.background.panel,
    theme.palette.backgroundDefault,
  );
}

function getResolvedMutedColor(theme: AppThemeDefinition) {
  return resolveColorAgainstBackground(
    theme.background.mutedPanel,
    theme.palette.backgroundDefault,
  );
}

function getResolvedDisplayAccentColor(theme: AppThemeDefinition) {
  const displayAccentSurface = getThemeDisplaySurfaceStyles(theme, 'accent');

  return resolveColorAgainstBackground(
    displayAccentSurface.background,
    theme.palette.backgroundDefault,
  );
}

function getResolvedInputColor(theme: AppThemeDefinition) {
  return resolveColorAgainstBackground(
    withAlpha(
      theme.palette.backgroundPaper,
      theme.mode === 'light' ? 0.74 : 0.12,
    ),
    theme.palette.backgroundDefault,
  );
}

function getResolvedSelectedTone(
  theme: AppThemeDefinition,
  tone: 'panel' | 'muted',
) {
  const surface =
    tone === 'panel' ? getResolvedPanelColor(theme) : getResolvedMutedColor(theme);

  return resolveColorAgainstBackground(
    withAlpha(theme.palette.primary, theme.mode === 'light' ? 0.14 : 0.22),
    surface,
  );
}

describe('theme accessibility contrast', () => {
  it.each(appThemes.map((theme) => [theme.label, theme] as const))(
    'keeps text readable on key surfaces for %s',
    (_label, theme) => {
      const paper = theme.palette.backgroundPaper;
      const panel = getResolvedPanelColor(theme);
      const muted = getResolvedMutedColor(theme);
      const displayAccent = getResolvedDisplayAccentColor(theme);
      const input = getResolvedInputColor(theme);
      const selectedPanel = getResolvedSelectedTone(theme, 'panel');
      const selectedMuted = getResolvedSelectedTone(theme, 'muted');

      expect(getContrastRatio(theme.palette.textPrimary, paper)).toBeGreaterThanOrEqual(7);

      for (const [, surface] of [
        ['paper', paper],
        ['panel', panel],
        ['muted panel', muted],
        ['input', input],
      ] as const) {
        expect(getContrastRatio(theme.palette.textSecondary, surface)).toBeGreaterThanOrEqual(
          4.5,
        );
      }

      for (const [, surface] of [
        ['display accent', displayAccent],
        ['selected panel', selectedPanel],
        ['selected muted', selectedMuted],
      ] as const) {
        expect(getContrastRatio(theme.palette.textPrimary, surface)).toBeGreaterThanOrEqual(
          4.5,
        );
      }
    },
  );

  it('keeps cipher telemetry copy above minimum contrast', () => {
    const background = resolveColorAgainstBackground(
      'rgba(4, 18, 19, 0.74)',
      '#030b09',
    );

    for (const [, color] of [
      ['system line', 'rgba(153, 255, 236, 0.92)'],
      ['ticker', 'rgba(149, 255, 239, 0.82)'],
      ['error status', 'rgba(255, 169, 150, 0.98)'],
      ['cache status', 'rgba(248, 255, 182, 0.98)'],
      ['live status', 'rgba(149, 255, 239, 0.98)'],
      ['offline status', 'rgba(182, 212, 206, 0.96)'],
    ] as const) {
      expect(getContrastRatio(color, background)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
