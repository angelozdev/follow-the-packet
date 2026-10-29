// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { registryLines, startSession } from '@/game';
import { INCIDENTS } from '@/levels';
import { useRegistryBox } from './use-registry-box';

const INCIDENT_WITH_LINES = '04-01';
const lines = registryLines(startSession(INCIDENTS, INCIDENT_WITH_LINES));

describe('the box of the registry', () => {
  it('a registry that was open when the lines ran out stays closed when a line comes back', () => {
    const { result, rerender } = renderHook(({ shown }) => useRegistryBox(shown), { initialProps: { shown: lines } });
    act(() => result.current.toggle());
    expect(result.current.open).toBe(true);
    expect(result.current.count).toBe(lines.length);

    rerender({ shown: [] });
    expect(result.current.open).toBe(false);
    rerender({ shown: lines });

    expect(result.current.open).toBe(false);
  });
});
