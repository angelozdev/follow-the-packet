import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

class UnmeasuredObserver implements ResizeObserver {
  observe = () => undefined;
  unobserve = () => undefined;
  disconnect = () => undefined;
}

if (typeof Element !== 'undefined') {
  if (typeof Element.prototype.scrollIntoView === 'undefined') Element.prototype.scrollIntoView = () => undefined;
  if (typeof ResizeObserver === 'undefined') globalThis.ResizeObserver = UnmeasuredObserver;
}

afterEach(() => cleanup());
