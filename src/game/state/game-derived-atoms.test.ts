import { createStore } from 'jotai';
import { describe, expect, it } from 'vitest';
import { bottomOverlayHeightAtom, viewportStateAtom } from './game-atoms';
import {
  effectiveKeyboardInsetAtom,
  isKeyboardOpenAtom,
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
    store.set(bottomOverlayHeightAtom, 280);

    expect(store.get(effectiveKeyboardInsetAtom)).toBe(280);
    expect(store.get(viewportVisualHeightAtom)).toBe(564);
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
    store.set(bottomOverlayHeightAtom, 320);

    expect(store.get(effectiveKeyboardInsetAtom)).toBe(180);
    expect(store.get(viewportVisualHeightAtom)).toBe(720);
    expect(store.get(isKeyboardOpenAtom)).toBe(true);
  });
});
