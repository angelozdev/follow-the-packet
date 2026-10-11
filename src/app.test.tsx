// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CATALOG_TEXT, NOTICE_TEXT } from '@/copy';
import { CHAPTERS, INCIDENTS } from '@/levels';
import { PROGRESS_KEY } from '@/storage';
import { App } from './app';

vi.mock('@/scene/catalog/catalog-scene', () => ({ CatalogScene: () => null }));

const SOON_COUNT = CHAPTERS.length - new Set(INCIDENTS.map((i) => i.chapter)).size;

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
