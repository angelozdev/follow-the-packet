// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useSendOnce } from './use-packet-runs';

describe('useSendOnce', () => {
  it('says yes once for a new send number and no on later calls with the same number', () => {
    const { result } = renderHook(({ send }) => useSendOnce(send), { initialProps: { send: 1 } });
    expect(result.current(0, 1)).toBe(true);
    expect(result.current(1, 2)).toBe(false);
    expect(result.current(2, 3)).toBe(false);
  });

  it('keeps saying no after the component renders again with the same number', () => {
    const { result, rerender } = renderHook(({ send }) => useSendOnce(send), { initialProps: { send: 1 } });
    expect(result.current(0, 1)).toBe(true);
    rerender({ send: 1 });
    expect(result.current(1, 2)).toBe(false);
  });

  it('says yes again, once, after the number grows', () => {
    const { result, rerender } = renderHook(({ send }) => useSendOnce(send), { initialProps: { send: 1 } });
    expect(result.current(0, 1)).toBe(true);
    rerender({ send: 2 });
    expect(result.current(1, 2)).toBe(true);
    expect(result.current(2, 3)).toBe(false);
  });

  it('says no while nothing has been sent', () => {
    const { result } = renderHook(({ send }) => useSendOnce(send), { initialProps: { send: 0 } });
    expect(result.current(0, 1)).toBe(false);
  });
});
