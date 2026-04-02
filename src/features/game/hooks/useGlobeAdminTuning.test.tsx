import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { AppThemeId, GlobeQualityConfig } from '@/app/theme';
import { useGlobeAdminTuning } from './useGlobeAdminTuning';

const defaults: GlobeQualityConfig = {
  cityLightsEnabled: true,
  cityLightsIntensity: 2.25,
  cityLightsThreshold: 0.04,
  cityLightsGlow: 1.6,
  cityLightsColor: '#fff3cf',
  dayImageryEnabled: false,
  lightPollutionEnabled: true,
  lightPollutionIntensity: 0.85,
  lightPollutionSpread: 1.8,
  lightPollutionColor: '#ffb46a',
  nightImageryEnabled: false,
  reliefHeight: 1,
  reliefMapEnabled: true,
  umbraDarkness: 1,
  waterMaskEnabled: false,
  showLakes: true,
  showRivers: true,
  lakesOpacity: 0.35,
  riversOpacity: 0.55,
  riversWidth: 0.9,
  lakesColor: '#5aaee8',
  riversColor: '#4a96d6',
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
  return `country-guesser-admin-quality:${themeId}`;
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
    );

    expect(result.current.adminEnabled).toBe(true);
    expect(result.current.effectiveQuality).toEqual(defaults);
  });

  it('loads and merges stored override for the active theme', () => {
    window.localStorage.setItem(
      getStorageKey('atlas'),
      JSON.stringify({
        dayImageryEnabled: true,
        reliefHeight: 1.75,
      }),
    );

    const { result } = renderHook(() =>
      useGlobeAdminTuning({
        defaults,
        themeId: 'atlas',
      }),
    );

    expect(result.current.effectiveQuality.dayImageryEnabled).toBe(true);
    expect(result.current.effectiveQuality.reliefHeight).toBe(1.75);
    expect(result.current.effectiveQuality.nightImageryEnabled).toBe(false);
  });

  it('applies patches and persists per-theme override', () => {
    const { result } = renderHook(() =>
      useGlobeAdminTuning({
        defaults,
        themeId: 'glacier',
      }),
    );

    act(() => {
      result.current.setAdminOverridePatch({
        nightImageryEnabled: true,
        reliefHeight: 2.25,
      });
    });

    expect(result.current.effectiveQuality.nightImageryEnabled).toBe(true);
    expect(result.current.effectiveQuality.reliefHeight).toBe(2.25);
    expect(window.localStorage.getItem(getStorageKey('glacier'))).toContain(
      '"nightImageryEnabled":true',
    );
  });

  it('clamps reliefHeight patch values to supported range', () => {
    const { result } = renderHook(() =>
      useGlobeAdminTuning({
        defaults,
        themeId: 'cipher',
      }),
    );

    act(() => {
      result.current.setAdminOverridePatch({
        reliefHeight: 9,
      });
    });

    expect(result.current.effectiveQuality.reliefHeight).toBe(3);

    act(() => {
      result.current.setAdminOverridePatch({
        reliefHeight: -2,
      });
    });

    expect(result.current.effectiveQuality.reliefHeight).toBe(0);
  });

  it('clamps umbraDarkness patch values to supported range', () => {
    const { result } = renderHook(() =>
      useGlobeAdminTuning({
        defaults,
        themeId: 'cipher',
      }),
    );

    act(() => {
      result.current.setAdminOverridePatch({
        umbraDarkness: 9,
      });
    });

    expect(result.current.effectiveQuality.umbraDarkness).toBe(1);

    act(() => {
      result.current.setAdminOverridePatch({
        umbraDarkness: -2,
      });
    });

    expect(result.current.effectiveQuality.umbraDarkness).toBe(0);
  });

  it('clamps city light and pollution controls to supported ranges', () => {
    const { result } = renderHook(() =>
      useGlobeAdminTuning({
        defaults,
        themeId: 'cipher',
      }),
    );

    act(() => {
      result.current.setAdminOverridePatch({
        cityLightsIntensity: 9,
        cityLightsThreshold: -1,
        cityLightsGlow: 7,
        lightPollutionIntensity: -2,
        lightPollutionSpread: 12,
      });
    });

    expect(result.current.effectiveQuality.cityLightsIntensity).toBe(4);
    expect(result.current.effectiveQuality.cityLightsThreshold).toBe(0);
    expect(result.current.effectiveQuality.cityLightsGlow).toBe(4);
    expect(result.current.effectiveQuality.lightPollutionIntensity).toBe(0);
    expect(result.current.effectiveQuality.lightPollutionSpread).toBe(6);
  });

  it('resets active theme override and clears storage', () => {
    const { result } = renderHook(() =>
      useGlobeAdminTuning({
        defaults,
        themeId: 'midnight',
      }),
    );

    act(() => {
      result.current.setAdminOverridePatch({
        dayImageryEnabled: true,
        waterMaskEnabled: true,
      });
    });

    expect(result.current.effectiveQuality.dayImageryEnabled).toBe(true);

    act(() => {
      result.current.resetAdminOverride();
    });

    expect(result.current.effectiveQuality).toEqual(defaults);
    expect(window.localStorage.getItem(getStorageKey('midnight'))).toBeNull();
  });

  it('loads overrides separately for each theme id', () => {
    window.localStorage.setItem(
      getStorageKey('daybreak'),
      JSON.stringify({ dayImageryEnabled: true }),
    );
    window.localStorage.setItem(
      getStorageKey('ember'),
      JSON.stringify({ nightImageryEnabled: true }),
    );

    const { result, rerender } = renderHook(
      ({ themeId }) =>
        useGlobeAdminTuning({
          defaults,
          themeId,
        }),
      {
        initialProps: { themeId: 'daybreak' as AppThemeId },
      },
    );

    expect(result.current.effectiveQuality.dayImageryEnabled).toBe(true);
    expect(result.current.effectiveQuality.nightImageryEnabled).toBe(false);

    rerender({ themeId: 'ember' });

    expect(result.current.effectiveQuality.dayImageryEnabled).toBe(false);
    expect(result.current.effectiveQuality.nightImageryEnabled).toBe(true);
  });
});
