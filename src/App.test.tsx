// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

// Sin JSX en la fábrica: vi.mock se sube al inicio del archivo, antes que el runtime de JSX.
vi.mock('./scene/GameScene', () => ({ GameScene: () => null }));

afterEach(() => {
  window.location.hash = '';
  localStorage.clear();
});

describe('App', () => {
  it('muestra el roadmap con los 20 capítulos', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Sigue el paquete' })).toBeInTheDocument();
    expect(screen.getByText('Infraestructura Tradicional y Compute Clásico (IaaS)')).toBeInTheDocument();
    expect(screen.getAllByText('Próximamente')).toHaveLength(19);
  });

  it('un nivel que no existe muestra "Nivel no encontrado" (Review Focus 2)', () => {
    window.location.hash = '#/level/99-99';
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Nivel no encontrado' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al roadmap' })).toHaveAttribute('href', '#/');
  });

  it('un progreso corrupto no rompe el roadmap (Review Focus 1)', () => {
    localStorage.setItem('follow-the-packet:progress:v1', '{roto');
    render(<App />);
    expect(screen.getByRole('link', { name: /¿Dónde muere el ping\?/ })).toBeInTheDocument();
  });
});
