// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { CATALOG_TEXT, NOTICE_TEXT, ROADMAP_TEXT } from '@/copy';
import { CHAPTERS, INCIDENTS } from '@/levels';
import { PROGRESS_KEY, type Progress } from '@/storage';
import { App } from './app';

vi.mock('@/scene/catalog/catalog-scene', () => ({ CatalogScene: () => null }));

const SOON_COUNT = CHAPTERS.length - new Set(INCIDENTS.map((i) => i.chapter)).size;
const ROADMAP_TITLE = 'Sigue el paquete';
const CHAPTER_1 = INCIDENTS.filter(({ chapter }) => chapter === 1);
const CHAPTER_2 = INCIDENTS.filter(({ chapter }) => chapter === 2);
const [OFFICE, SECOND_OF_CHAPTER_1] = CHAPTER_1;
const LAST_OF_CHAPTER_1 = CHAPTER_1[CHAPTER_1.length - 1];
const [ONE_MACHINE] = CHAPTER_2;
const LAST_BUILT_OF_CHAPTER_2 = CHAPTER_2[CHAPTER_2.length - 1];
const FIRST_PING = { id: '04-01', title: 'El primer ping' };
const OPENING_RULE = { id: '04-02', title: 'Abre lo justo' };

function linkTo(order: number, title: string): HTMLElement {
  return screen.getByRole('link', { name: `${order}. ${title}` });
}

function levelItem(id: string): HTMLElement {
  const item = document.querySelector<HTMLElement>(`li[data-level-id="${id}"]`);
  if (item === null) throw new Error(`the roadmap has no incident ${id}`);
  return item;
}

function openWith(progress: Progress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  return render(<App />);
}

function expectFirstPingOpen() {
  expect(linkTo(1, FIRST_PING.title)).toHaveAttribute('href', `#/level/${FIRST_PING.id}`);
  expect(levelItem(FIRST_PING.id)).not.toHaveTextContent(ROADMAP_TEXT.locked);
}

afterEach(() => {
  window.location.hash = '';
  localStorage.clear();
});

describe('App', () => {
  it('shows the roadmap with the chapters without incidents coming soon', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Sigue el paquete' })).toBeInTheDocument();
    expect(screen.getAllByText('Próximamente')).toHaveLength(SOON_COUNT);
  });

  it('an unknown incident shows "Incidente no encontrado" with a link back', () => {
    window.location.hash = '#/level/09-99';
    render(<App />);
    expect(screen.getByRole('heading', { name: NOTICE_TEXT.notFound.title })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: NOTICE_TEXT.back })).toHaveAttribute('href', '#/');
  });

  it('a locked incident does not open from its URL', () => {
    window.location.hash = `#/level/${INCIDENTS[1].id}`;
    render(<App />);
    expect(screen.getByRole('heading', { name: NOTICE_TEXT.locked.title })).toBeInTheDocument();
  });

  it('the locked notice names the single incident to finish first', () => {
    window.location.hash = `#/level/${INCIDENTS[1].id}`;
    render(<App />);
    expect(screen.getByText(`Para abrir el ${INCIDENTS[1].id}, termina antes el incidente anterior.`)).toBeInTheDocument();
  });

  it('an unknown incident shows its notice as an error message and a locked one as a warning message', () => {
    window.location.hash = '#/level/09-99';
    const unknown = render(<App />);
    const missing = screen.getByText(NOTICE_TEXT.notFound.body('09-99'));
    expect(missing).toHaveClass('message message--error', { exact: true });
    expect(missing.querySelector('.message__tab')).toHaveTextContent('✕ Error');
    unknown.unmount();
    window.location.hash = `#/level/${INCIDENTS[1].id}`;
    render(<App />);
    const locked = screen.getByText(NOTICE_TEXT.locked.body(INCIDENTS[1].id));
    expect(locked).toHaveClass('message message--warning', { exact: true });
    expect(locked.querySelector('.message__tab')).toHaveTextContent('! Aviso');
  });

  it('the roadmap does not link to the entity catalog', () => {
    render(<App />);
    expect(document.querySelector('a[href="#/entidades"]')).toBeNull();
  });

  it('the entity catalog opens from its URL', () => {
    window.location.hash = '#/entidades';
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: CATALOG_TEXT.title })).toBeInTheDocument();
  });

  it('corrupt saved progress does not break the roadmap', () => {
    localStorage.setItem(PROGRESS_KEY, '{broken');
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Sigue el paquete' })).toBeInTheDocument();
  });
});

describe('the roadmap opens the incidents as the progress saved in the browser says', () => {
  let consoleErrors: MockInstance<typeof console.error>;

  beforeEach(() => {
    consoleErrors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrors.mockRestore();
  });

  it('chapter 1 opens at 01-01 and 04-01 opens once the incident before it has a star', () => {
    const fresh = render(<App />);
    expect(linkTo(1, OFFICE.title)).toHaveAttribute('href', `#/level/${OFFICE.id}`);
    expect(levelItem(SECOND_OF_CHAPTER_1.id)).toHaveTextContent(ROADMAP_TEXT.locked);
    expect(levelItem(FIRST_PING.id)).toHaveTextContent(ROADMAP_TEXT.locked);
    fresh.unmount();
    openWith({ [LAST_BUILT_OF_CHAPTER_2.id]: 1 });
    expectFirstPingOpen();
    expect(consoleErrors).not.toHaveBeenCalled();
  });

  it('04-01 stays locked after 01-14 has a star and opens after the last built incident of chapter 2 has one', () => {
    const upToThirteen = openWith({ '01-13': 3 });
    expect(levelItem(FIRST_PING.id)).toHaveTextContent(ROADMAP_TEXT.locked);
    upToThirteen.unmount();
    const upToFourteen = openWith({ [LAST_OF_CHAPTER_1.id]: 1 });
    expect(levelItem(FIRST_PING.id)).toHaveTextContent(ROADMAP_TEXT.locked);
    upToFourteen.unmount();
    openWith({ [LAST_BUILT_OF_CHAPTER_2.id]: 1 });
    expectFirstPingOpen();
    expect(consoleErrors).not.toHaveBeenCalled();
  });

  it('04-01 stays open with its stored stars although chapter 1 has none, and 04-02 opens after it', async () => {
    const user = userEvent.setup();
    openWith({ [FIRST_PING.id]: 2 });
    expect(linkTo(1, FIRST_PING.title)).toHaveAttribute('href', `#/level/${FIRST_PING.id}`);
    expect(linkTo(2, OPENING_RULE.title)).toHaveAttribute('href', `#/level/${OPENING_RULE.id}`);
    expect(levelItem(SECOND_OF_CHAPTER_1.id)).toHaveTextContent(ROADMAP_TEXT.locked);
    await user.click(linkTo(1, FIRST_PING.title));
    expect(await screen.findByRole('heading', { level: 1, name: FIRST_PING.title })).toBeInTheDocument();
  });

  it('chapter 2 opens at 02-01 once 01-14 has a star and 04-01 stays closed', () => {
    const upToThirteen = openWith({ '01-13': 3 });
    expect(levelItem(ONE_MACHINE.id)).toHaveTextContent(ROADMAP_TEXT.locked);
    upToThirteen.unmount();
    openWith({ [LAST_OF_CHAPTER_1.id]: 1 });
    expect(linkTo(1, ONE_MACHINE.title)).toHaveAttribute('href', `#/level/${ONE_MACHINE.id}`);
    expect(levelItem(FIRST_PING.id)).toHaveTextContent(ROADMAP_TEXT.locked);
    expect(consoleErrors).not.toHaveBeenCalled();
  });
});

describe('the notice of an incident that is not there', () => {
  it('an unknown incident leads back to the roadmap', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/level/09-99';
    render(<App />);
    expect(screen.getByRole('heading', { name: NOTICE_TEXT.notFound.title })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: NOTICE_TEXT.back }));
    expect(await screen.findByRole('heading', { level: 1, name: ROADMAP_TITLE })).toBeInTheDocument();
  });
});
