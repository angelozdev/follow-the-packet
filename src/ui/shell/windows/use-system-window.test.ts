// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useSystemWindow } from './use-system-window';

const REGISTRY = 'registry';
const OTHER = 'other';

describe('the state of the system window', () => {
  it('a registry that was open when the lines ran out stays closed when a line comes back', () => {
    const { result, rerender } = renderHook(({ available }) => useSystemWindow(available), { initialProps: { available: [REGISTRY] } });
    act(() => result.current.toggle(REGISTRY));
    expect(result.current.open).toBe(REGISTRY);

    rerender({ available: [] });
    expect(result.current.open).toBeNull();
    rerender({ available: [REGISTRY] });

    expect(result.current.open).toBeNull();
  });

  it('only one window is open at a time: opening another closes the one that is open, and the same button closes it', () => {
    const { result } = renderHook(() => useSystemWindow([REGISTRY, OTHER]));

    act(() => result.current.toggle(REGISTRY));
    act(() => result.current.toggle(OTHER));
    expect(result.current.open).toBe(OTHER);

    act(() => result.current.toggle(OTHER));
    expect(result.current.open).toBeNull();

    act(() => result.current.toggle(REGISTRY));
    act(() => result.current.close());
    expect(result.current.open).toBeNull();
  });

  it('each window has its own ids for its button and for what it controls', () => {
    const { result } = renderHook(() => useSystemWindow([REGISTRY, OTHER]));

    const ids = [result.current.buttonId(REGISTRY), result.current.controlsId(REGISTRY), result.current.buttonId(OTHER), result.current.controlsId(OTHER)];
    expect(new Set(ids).size).toBe(ids.length);
    expect(result.current.buttonId(REGISTRY)).toBe(result.current.buttonId(REGISTRY));
  });
});
