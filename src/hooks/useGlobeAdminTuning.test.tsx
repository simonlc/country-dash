import { act, renderHook } from '@testing-library/react';
import { Provider } from 'jotai';
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { AppThemeId, GlobeThemeSettings } from '@/app/theme';
import { appThemes } from '@/app/theme';
import { useGlobeAdminTuning } from './useGlobeAdminTuning';

const defaults: GlobeThemeSettings = {
  globe: { ...appThemes[0]!.globe },
  quality: { ...appThemes[0]!.qualityDefaults },
  render: { ...appThemes[0]!.render },
};

function createStorage() {
  const store = new Map<string, string>();

  return {
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

function getStorageKey(themeId: AppThemeId) {
  return `country-dash:globe-admin:v1:${themeId}`;
}

function TestProvider({ children }: PropsWithChildren) {
  return <Provider>{children}</Provider>;
}

describe('useGlobeAdminTuning', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: createStorage(),
    });
    window.history.replaceState(null, '', '/?admin=1');
  });

  it('returns theme defaults when there is no admin override', () => {
    const { result } = renderHook(() =>
      useGlobeAdminTuning({
        defaults,
        themeId: 'daybreak',
      }),
      {
        wrapper: TestProvider,
      },
    );

    expect(result.current.adminEnabled).toBe(true);
    expect(result.current.effectiveSettings).toEqual(defaults);
  });

  it('loads and merges stored overrides for globe, quality, and render settings', () => {
    window.localStorage.setItem(
      getStorageKey('atlas'),
      JSON.stringify({
        globe: {
          atmosphereOpacity: 0.4,
        },
        quality: {
          dayImageryEnabled: true,
          reliefHeight: 1.75,
        },
        render: {
          atlasStyleEnabled: true,
          reliefStrengthMultiplier: 16,
        },
      }),
    );

    const { result } = renderHook(() =>
      useGlobeAdminTuning({
        defaults,
        themeId: 'atlas',
      }),
      {
        wrapper: TestProvider,
      },
    );

    expect(result.current.effectiveSettings.globe.atmosphereOpacity).toBe(0.4);
    expect(result.current.effectiveSettings.quality.dayImageryEnabled).toBe(
      true,
    );
    expect(result.current.effectiveSettings.quality.reliefHeight).toBe(1.75);
    expect(result.current.effectiveSettings.render.atlasStyleEnabled).toBe(
      true,
    );
  });

  it('applies nested patches and persists them per theme', () => {
    const { result } = renderHook(() =>
      useGlobeAdminTuning({
        defaults,
        themeId: 'cipher',
      }),
      {
        wrapper: TestProvider,
      },
    );

    act(() => {
      result.current.setAdminOverridePatch({
        globe: {
          noiseStrength: 0.22,
        },
        quality: {
          nightImageryEnabled: true,
        },
        render: {
          slowScanlineStrength: 0.8,
        },
      });
    });

    expect(result.current.effectiveSettings.globe.noiseStrength).toBe(0.22);
    expect(result.current.effectiveSettings.quality.nightImageryEnabled).toBe(
      true,
    );
    expect(result.current.effectiveSettings.render.slowScanlineStrength).toBe(
      0.8,
    );
    expect(window.localStorage.getItem(getStorageKey('cipher'))).toContain(
      '"slowScanlineStrength":0.8',
    );
  });

  it('clamps numeric quality and render values to supported ranges', () => {
    const { result } = renderHook(() =>
      useGlobeAdminTuning({
        defaults,
        themeId: 'midnight',
      }),
      {
        wrapper: TestProvider,
      },
    );

    act(() => {
      result.current.setAdminOverridePatch({
        quality: {
          cityLightsIntensity: 9,
          reliefHeight: -2,
        },
        render: {
          slowScanlineStrength: 8,
          reliefStrengthMultiplier: 40,
        },
      });
    });

    expect(result.current.effectiveSettings.quality.cityLightsIntensity).toBe(4);
    expect(result.current.effectiveSettings.quality.reliefHeight).toBe(0);
    expect(result.current.effectiveSettings.render.slowScanlineStrength).toBe(1);
    expect(result.current.effectiveSettings.render.reliefStrengthMultiplier).toBe(
      32,
    );
  });

  it('resets active theme override and clears storage', () => {
    const { result } = renderHook(() =>
      useGlobeAdminTuning({
        defaults,
        themeId: 'glacier',
      }),
      {
        wrapper: TestProvider,
      },
    );

    act(() => {
      result.current.setAdminOverridePatch({
        globe: {
          atmosphereOpacity: 0.3,
        },
        quality: {
          waterMaskEnabled: true,
        },
      });
    });

    expect(result.current.effectiveSettings.quality.waterMaskEnabled).toBe(true);

    act(() => {
      result.current.resetAdminOverride();
    });

    expect(result.current.effectiveSettings).toEqual(defaults);
    expect(result.current.resetRevision).toBe(1);
    expect(window.localStorage.getItem(getStorageKey('glacier'))).toBeNull();
  });

  it('loads overrides separately for each theme id', () => {
    window.localStorage.setItem(
      getStorageKey('daybreak'),
      JSON.stringify({ quality: { dayImageryEnabled: true } }),
    );
    window.localStorage.setItem(
      getStorageKey('ember'),
      JSON.stringify({ quality: { nightImageryEnabled: true } }),
    );

    const { result, rerender } = renderHook(
      ({ themeId }) =>
        useGlobeAdminTuning({
          defaults,
          themeId,
        }),
      {
        initialProps: { themeId: 'daybreak' as AppThemeId },
        wrapper: TestProvider,
      },
    );

    expect(result.current.effectiveSettings.quality.dayImageryEnabled).toBe(
      true,
    );
    expect(result.current.effectiveSettings.quality.nightImageryEnabled).toBe(
      false,
    );

    rerender({ themeId: 'ember' });

    expect(result.current.effectiveSettings.quality.dayImageryEnabled).toBe(
      false,
    );
    expect(result.current.effectiveSettings.quality.nightImageryEnabled).toBe(
      true,
    );
  });
});
