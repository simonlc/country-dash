import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { appThemes } from '@/app/theme';
import { useGlobeAssets } from './useGlobeAssets';

class MockImage {
  static instances = 0;

  decoding = 'async';
  onerror: (() => void) | null = null;
  onload: (() => void) | null = null;
  private currentSrc = '';

  constructor() {
    MockImage.instances += 1;
  }

  get src() {
    return this.currentSrc;
  }

  set src(value: string) {
    this.currentSrc = value;
  }
}

const OriginalImage = window.Image;

describe('useGlobeAssets', () => {
  beforeEach(() => {
    MockImage.instances = 0;
    Object.defineProperty(window, 'Image', {
      configurable: true,
      value: MockImage,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'Image', {
      configurable: true,
      value: OriginalImage,
    });
  });

  it('skips disabled asset and data loading paths', () => {
    const fetchSpy = vi.spyOn(window, 'fetch');

    renderHook(() =>
      useGlobeAssets({
        quality: {
          ...appThemes[0]!.qualityDefaults,
          cityLightsEnabled: false,
          dayImageryEnabled: false,
          lightPollutionEnabled: false,
          nightImageryEnabled: false,
          reliefMapEnabled: false,
          showLakes: false,
          showRivers: false,
          waterMaskEnabled: false,
        },
        themeId: 'daybreak',
      }),
    );

    expect(MockImage.instances).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
