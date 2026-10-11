// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card } from './card';

const ICON = <svg data-testid="card-icon" aria-hidden="true" />;

function stripeOf(container: HTMLElement): HTMLElement {
  const stripe = container.querySelector<HTMLElement>('.card__band');
  if (!stripe) throw new Error('the card draws no stripe');
  return stripe;
}

describe('Card', () => {
  it('shows the title, the icon and the type of the card in its header', () => {
    const { container } = render(<Card header={{ icon: ICON, title: <h2>Lucía</h2>, type: 'soporte' }}>Hola</Card>);
    const stripe = within(stripeOf(container));
    expect(stripe.getByTestId('card-icon')).toBeInTheDocument();
    expect(stripe.getByRole('heading', { name: 'Lucía' })).toBeInTheDocument();
    expect(stripe.getByText('soporte')).toBeInTheDocument();
  });

  it('names the card for a screen reader with its title', () => {
    render(<Card aria-labelledby="card-title" header={{ icon: ICON, title: <h2 id="card-title">Lucía</h2>, type: 'soporte' }}>Hola</Card>);
    expect(screen.getByRole('region', { name: 'Lucía' })).toHaveTextContent('Hola');
    expect(screen.getByRole('heading', { name: 'Lucía' })).toBeInTheDocument();
  });

  it('a card without a header draws no stripe', () => {
    const { container } = render(<Card aria-label="Sin franja">Hola</Card>);
    expect(container.querySelector('.card__band')).toBeNull();
    expect(screen.getByRole('region', { name: 'Sin franja' })).toHaveTextContent('Hola');
  });

  it('leaves the title to the content when the header has only a type, so the card keeps one heading', () => {
    const { container } = render(
      <Card aria-labelledby="result-title" header={{ icon: ICON, type: 'Resultado', meta: '3/14' }}>
        <h2 id="result-title">Incidente cerrado</h2>
      </Card>,
    );
    const stripe = within(stripeOf(container));
    expect(stripe.queryByRole('heading')).toBeNull();
    expect(stripe.getByText('Resultado')).toBeInTheDocument();
    expect(stripe.getByText('3/14')).toBeInTheDocument();
    expect(screen.getAllByRole('heading')).toHaveLength(1);
    expect(screen.getByRole('region', { name: 'Incidente cerrado' })).toBeInTheDocument();
  });

  it('keeps its stripe in the soon variant, which stays faded and dashed', () => {
    const { container } = render(<Card as="li" variant="soon" header={{ type: 'Capítulo 2' }}>Puertos y nombres</Card>);
    expect(container.querySelector('li')).toHaveClass('card card--soon', { exact: true });
    expect(stripeOf(container)).toHaveTextContent('Capítulo 2');
  });
});
