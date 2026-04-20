import { createStore } from 'jotai';
import { describe, expect, it } from 'vitest';
import {
  bottomOverlayHeightAtom,
  topOverlayHeightAtom,
  viewportStateAtom,
} from './game-atoms';
import {
  effectiveKeyboardInsetAtom,
  isKeyboardOpenAtom,
  viewportTopInsetAtom,
  viewportVisualHeightAtom,
} from './game-derived-atoms';

describe('game-derived viewport atoms', () => {
  it('uses the measured bottom overlay height for mobile globe centering', () => {
    const store = createStore();

    store.set(viewportStateAtom, {
      height: 844,
      keyboardInset: 0,
      isKeyboardOpen: false,
      visualHeight: 844,
      width: 390,
    });
    store.set(topOverlayHeightAtom, 64);
    store.set(bottomOverlayHeightAtom, 280);

    expect(store.get(effectiveKeyboardInsetAtom)).toBe(280);
    expect(store.get(viewportTopInsetAtom)).toBe(64);
    expect(store.get(viewportVisualHeightAtom)).toBe(500);
    expect(store.get(isKeyboardOpenAtom)).toBe(false);
  });

  it('ignores the measured overlay height on desktop while preserving native keyboard state', () => {
    const store = createStore();

    store.set(viewportStateAtom, {
      height: 900,
      keyboardInset: 180,
      isKeyboardOpen: true,
      visualHeight: 720,
      width: 1280,
    });
    store.set(topOverlayHeightAtom, 72);
    store.set(bottomOverlayHeightAtom, 320);

    expect(store.get(effectiveKeyboardInsetAtom)).toBe(180);
    expect(store.get(viewportTopInsetAtom)).toBe(0);
    expect(store.get(viewportVisualHeightAtom)).toBe(720);
    expect(store.get(isKeyboardOpenAtom)).toBe(true);
  });

  it('treats 768px wide viewports as desktop layout', () => {
    const store = createStore();

    store.set(viewportStateAtom, {
      height: 900,
      keyboardInset: 0,
      isKeyboardOpen: false,
      visualHeight: 900,
      width: 768,
    });
    store.set(topOverlayHeightAtom, 72);
    store.set(bottomOverlayHeightAtom, 320);

    expect(store.get(effectiveKeyboardInsetAtom)).toBe(0);
    expect(store.get(viewportTopInsetAtom)).toBe(0);
    expect(store.get(viewportVisualHeightAtom)).toBe(900);
  });
});
