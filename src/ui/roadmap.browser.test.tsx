import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { ROADMAP_TEXT } from '@/copy';
import { INCIDENTS } from '@/levels';
import { Roadmap } from './roadmap';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const PHONE = { width: 390, height: 844 };

describe('the roadmap in a real browser', () => {
  afterEach(async () => {
    await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
  });

  it('the roadmap fits a phone screen, without a horizontal scroll', async () => {
    await page.viewport(PHONE.width, PHONE.height);
    render(<Roadmap levels={INCIDENTS} progress={{}} />);
    await expect.element(page.getByRole('heading', { level: 1, name: ROADMAP_TEXT.title })).toBeVisible();
    expect(window.innerWidth).toBe(PHONE.width);
    expect(document.documentElement.scrollWidth - window.innerWidth).toBe(0);
  });
});
