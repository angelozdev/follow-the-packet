// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { Message, type MessageVariant } from './message';

const WORDS: Record<MessageVariant, string> = { note: 'Nota', success: 'Correcto', warning: 'Aviso', error: 'Error' };
const VARIANTS: MessageVariant[] = ['note', 'success', 'warning', 'error'];
const TEXT = 'La zona también tiene sus registros propios.';

function tabOf(message: HTMLElement): HTMLElement {
  const tab = message.querySelector<HTMLElement>('.message__tab');
  if (tab === null) throw new Error('the message has no tab');
  return tab;
}

function renderMessage(variant?: MessageVariant) {
  render(
    <Message variant={variant} words={WORDS}>
      {TEXT}
    </Message>,
  );
  return screen.getByText(TEXT);
}

function tabTextOf(variant: MessageVariant): string | null {
  const message = renderMessage(variant);
  const text = tabOf(message).textContent;
  cleanup();
  return text;
}

describe('Message', () => {
  it('renders a paragraph with its text and the note variant unless it says otherwise', () => {
    const message = renderMessage();
    expect(message.tagName).toBe('P');
    expect(message).toHaveClass('message message--note', { exact: true });
    expect(message).toHaveTextContent(TEXT);
  });

  it('renders the success, warning and error variants', () => {
    render(
      <>
        {VARIANTS.map((variant) => (
          <Message key={variant} variant={variant} words={WORDS}>
            {variant}
          </Message>
        ))}
      </>,
    );
    for (const variant of VARIANTS) expect(screen.getByText(variant)).toHaveClass(`message message--${variant}`, { exact: true });
  });

  it('each variant of Message carries its own mark or word, not only a colour', () => {
    const tabs = VARIANTS.map(tabTextOf);
    expect(tabs).toEqual(['Nota', '✓ Correcto', '! Aviso', '✕ Error']);
    expect(new Set(tabs).size).toBe(VARIANTS.length);
  });

  it('the success variant shows a check before its text', () => {
    const message = renderMessage('success');
    expect(tabOf(message).textContent?.startsWith('✓')).toBe(true);
    expect(message.firstChild).toBe(tabOf(message));
    expect(message.textContent?.indexOf('✓')).toBeLessThan(message.textContent?.indexOf(TEXT) ?? -1);
  });

  it('success and error differ by their word and mark, not only by colour', () => {
    const success = tabTextOf('success');
    const error = tabTextOf('error');
    expect(success).not.toBe(error);
    expect(success).toBe('✓ Correcto');
    expect(error).toBe('✕ Error');
    expect(success?.split(' ')[0]).not.toBe(error?.split(' ')[0]);
  });

  it('the tab is hidden from assistive technology and a visually hidden word names the kind before the text', () => {
    const message = renderMessage('error');
    expect(tabOf(message)).toHaveAttribute('aria-hidden', 'true');
    const spoken = message.querySelector('.sr-only');
    expect(spoken).toHaveTextContent('Error:');
    expect(spoken?.textContent).toBe('Error: ');
    expect(message.childNodes[1]).toBe(spoken);
    expect(message.lastChild?.textContent).toBe(TEXT);
  });

  it('has no role of its own and keeps the role and the aria attributes its owner gives it', () => {
    const { rerender } = render(
      <Message words={WORDS} id="plain">
        {TEXT}
      </Message>,
    );
    expect(document.getElementById('plain')).not.toHaveAttribute('role');
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    rerender(
      <Message variant="error" words={WORDS} role="alert" aria-live="assertive" id="owned">
        {TEXT}
      </Message>,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(alert).toHaveAttribute('id', 'owned');
    expect(alert).toHaveClass('message message--error', { exact: true });
  });

  it('takes no className and no style', () => {
    expectTypeOf<ComponentProps<typeof Message>>().not.toHaveProperty('className');
    expectTypeOf<ComponentProps<typeof Message>>().not.toHaveProperty('style');
    const extras = { className: 'extra', style: { color: 'red' } };
    const message = renderMessage('warning');
    expect(message).toHaveClass('message message--warning', { exact: true });
    expect(message).not.toHaveAttribute('style');
    expect(Array.from(message.querySelectorAll<HTMLElement>('*')).flatMap((element) => Array.from(element.style))).toEqual([]);
    render(
      <Message words={WORDS} {...extras}>
        other
      </Message>,
    );
    expect(screen.getByText('other')).toHaveClass('message message--note', { exact: true });
  });
});
