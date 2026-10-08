// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CHAPTERS, INCIDENTS } from '@/levels';
import { App } from './app';

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

  it('an old level link shows "Nivel no encontrado" with a link back', () => {
    window.location.hash = '#/level/04-01';
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Nivel no encontrado' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al roadmap' })).toHaveAttribute('href', '#/');
  });

  it('corrupt saved progress does not break the roadmap', () => {
    localStorage.setItem('follow-the-packet:progress:v1', '{broken');
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Sigue el paquete' })).toBeInTheDocument();
  });
});
