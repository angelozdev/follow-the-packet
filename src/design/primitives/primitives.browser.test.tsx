import { render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { emulateReducedMotion, holdTheMouseDown } from '@/testing/browser-play';
import { Button } from './button';
import { Message, type MessageVariant } from './message';

const SEND = 'Send';
const TILT_DEGREES = -2;
const PRESS_PX = 2;
const MESSAGE_VARIANTS: MessageVariant[] = ['note', 'success', 'warning', 'error'];
const MESSAGE_WORDS = { note: 'Note', success: 'Right', warning: 'Warning', error: 'Wrong' };
const MESSAGE_TABS = { note: 'Note', success: '✓ Right', warning: '! Warning', error: '✕ Wrong' };
const MESSAGE_TEXT = 'The zone has records of its own too. They are not edited here.';
const REGULAR_STROKE_PX = 1;
const MESSAGE_FRAMES = { note: ['solid', REGULAR_STROKE_PX], success: ['solid', 2], warning: ['dashed', REGULAR_STROKE_PX], error: ['double', 4] };
const MESSAGE_TAB_LEFT_PX = { min: 11, max: 12 };
const MESSAGE_TAB_OVERLAP_PX = { min: 1, max: 2 };

interface Look {
  textTransform: string;
  borderStyle: string;
  borderColor: string;
  color: string;
  emphasis: string;
  radius: number;
  height: number;
  tilt: number;
  lift: number;
}

function lookOf(button: HTMLElement): Look {
  const style = getComputedStyle(button);
  const probe = document.createElement('span');
  probe.style.color = 'var(--color-emphasis)';
  document.body.append(probe);
  const emphasis = getComputedStyle(probe).color;
  probe.remove();
  const matrix = new DOMMatrix(style.transform);
  return {
    textTransform: style.textTransform,
    borderStyle: style.borderTopStyle,
    borderColor: style.borderTopColor,
    color: style.color,
    emphasis,
    radius: Number.parseFloat(style.borderTopLeftRadius),
    height: button.getBoundingClientRect().height,
    tilt: (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI,
    lift: matrix.f,
  };
}

async function pressedLookOf(button: HTMLElement): Promise<Look> {
  const release = await holdTheMouseDown(button);
  try {
    return lookOf(button);
  } finally {
    await release();
  }
}

function drawMessages(variants: MessageVariant[]): HTMLElement[] {
  const { container } = render(
    <div style={{ position: 'relative', width: '20rem', padding: '0 1rem 1rem' }}>
      {variants.map((variant, index) => (
        <Message key={index} variant={variant} words={MESSAGE_WORDS}>
          {MESSAGE_TEXT}
        </Message>
      ))}
    </div>,
  );
  return [...container.querySelectorAll<HTMLElement>('.message')];
}

function tabOf(message: HTMLElement): HTMLElement {
  const tab = message.querySelector<HTMLElement>('.message__tab');
  if (tab === null) throw new Error('a message has no tab');
  return tab;
}

afterEach(async () => {
  await emulateReducedMotion(false);
});

it('the primary button looks like a stamp and does not move when pressed under reduced motion', async () => {
  await emulateReducedMotion(true);
  const { getByRole } = render(<Button variant="primary">{SEND}</Button>);
  const stamp = getByRole('button', { name: SEND });
  const rest = lookOf(stamp);
  expect(rest.textTransform).toBe('uppercase');
  expect(rest.borderStyle).toBe('dashed');
  expect(rest.borderColor).toBe(rest.emphasis);
  expect(rest.color).toBe(rest.emphasis);
  expect(rest.radius).toBeGreaterThanOrEqual(rest.height / 2);
  expect(rest.tilt).toBeCloseTo(TILT_DEGREES, 1);
  const pressed = await pressedLookOf(stamp);
  expect(pressed.tilt).toBeCloseTo(rest.tilt, 5);
  expect(pressed.lift).toBeCloseTo(rest.lift, 5);
});

it('the disabled primary button keeps the tilt of the stamp and does not move when pressed', async () => {
  await emulateReducedMotion(true);
  const { getByRole } = render(
    <Button variant="primary" disabled>
      {SEND}
    </Button>,
  );
  const disabled = getByRole('button', { name: SEND });
  expect(disabled).toBeDisabled();
  const rest = lookOf(disabled);
  expect(rest.tilt).toBeCloseTo(TILT_DEGREES, 1);
  expect(rest.color).not.toBe(rest.emphasis);
  const pressed = await pressedLookOf(disabled);
  expect(pressed.tilt).toBeCloseTo(TILT_DEGREES, 1);
  expect(pressed.lift).toBeCloseTo(rest.lift, 5);
});

it('without reduced motion the pressed primary button moves 2 px down and keeps its tilt', async () => {
  const { getByRole } = render(<Button variant="primary">{SEND}</Button>);
  const stamp = getByRole('button', { name: SEND });
  const rest = lookOf(stamp);
  const pressed = await pressedLookOf(stamp);
  expect(pressed.tilt).toBeCloseTo(TILT_DEGREES, 1);
  expect(pressed.lift - rest.lift).toBeCloseTo(PRESS_PX, 1);
});

it('each variant of Message is told apart by a mark or a border shape and not only by colour', () => {
  const messages = drawMessages(MESSAGE_VARIANTS);
  const looks = messages.map((message, index) => {
    const frame = getComputedStyle(message);
    const tabStyle = getComputedStyle(tabOf(message));
    return {
      variant: MESSAGE_VARIANTS[index],
      frame: [frame.borderTopStyle, Number.parseFloat(frame.borderTopWidth)],
      tab: tabOf(message).textContent,
      tabBorder: tabStyle.borderTopStyle,
      transform: tabStyle.textTransform,
    };
  });
  expect(looks).toHaveLength(MESSAGE_VARIANTS.length);
  for (const look of looks) {
    expect(look.frame, `the frame of a ${look.variant} message`).toEqual(MESSAGE_FRAMES[look.variant]);
    expect(look.tab, `the tab of a ${look.variant} message`).toBe(MESSAGE_TABS[look.variant]);
    expect(look.transform).toBe('uppercase');
  }
  const shapes = MESSAGE_VARIANTS.map((variant) => JSON.stringify([MESSAGE_FRAMES[variant], MESSAGE_TABS[variant]]));
  expect(new Set(shapes).size, 'no two variants share a frame and a word').toBe(MESSAGE_VARIANTS.length);
  expect(new Set(MESSAGE_VARIANTS.map((variant) => JSON.stringify(MESSAGE_FRAMES[variant]))).size, 'no two variants share a frame').toBe(MESSAGE_VARIANTS.length);
  expect(looks.find((look) => look.variant === 'warning')?.tabBorder, 'the tab of a warning is dashed like its frame').toBe('dashed');
});

it('the tab of a Message sticks out above its frame without covering the message above it', () => {
  const messages = drawMessages([...MESSAGE_VARIANTS, 'error']);
  expect(messages).toHaveLength(MESSAGE_VARIANTS.length + 1);
  const boxes = messages.map((message) => {
    const [frame, tab] = [message.getBoundingClientRect(), tabOf(message).getBoundingClientRect()];
    const above = document.elementFromPoint(frame.x + frame.width / 2, frame.y + frame.height / 2);
    const onTab = document.elementFromPoint(tab.x + tab.width / 2, tab.y + tab.height / 2);
    return {
      frame,
      tab,
      frameOnTop: above?.closest('.message') === message,
      tabOnTop: onTab?.closest('.message__tab') === tabOf(message),
    };
  });
  boxes.forEach((box, index) => {
    expect(box.tab.top, `the tab ${index} sticks out above its frame`).toBeLessThan(box.frame.top);
    expect(box.tab.bottom - box.frame.top, `the tab ${index} sits on the top edge of its frame`).toBeGreaterThanOrEqual(MESSAGE_TAB_OVERLAP_PX.min);
    expect(box.tab.bottom - box.frame.top, `the tab ${index} does not sink into its frame`).toBeLessThanOrEqual(MESSAGE_TAB_OVERLAP_PX.max);
    expect(box.tab.left - box.frame.left, `the tab ${index} starts at the left of its frame`).toBeGreaterThanOrEqual(MESSAGE_TAB_LEFT_PX.min);
    expect(box.tab.left - box.frame.left, `the tab ${index} starts near the corner of its frame`).toBeLessThanOrEqual(MESSAGE_TAB_LEFT_PX.max);
    expect(box.tab.right, `the tab ${index} ends before the right edge of its frame`).toBeLessThanOrEqual(box.frame.right);
    expect(box.frameOnTop, `nothing covers the middle of the message ${index}`).toBe(true);
    expect(box.tabOnTop, `the tab ${index} is not covered by anything`).toBe(true);
    if (index === 0) return;
    expect(box.tab.top, `the tab ${index} stays below the message above it`).toBeGreaterThan(boxes[index - 1].frame.bottom);
  });
});
