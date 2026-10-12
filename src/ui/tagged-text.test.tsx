// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { LUCIA_TEXT, TERMS, type TermId } from '@/copy';
import { TaggedText } from './tagged-text';

const SECURITY_GROUP = TERMS['security-group'];

describe('TaggedText', () => {
  it('reads like plain text, with each term shown by its official name', () => {
    const { container } = render(<TaggedText text="Mira el {{security-group}} de servidor2." />);
    expect(container).toHaveTextContent('Mira el Security Group de servidor2.');
    expect(screen.getByText(SECURITY_GROUP.name)).toHaveClass('term');
  });

  it('draws a resource name as a name tag', () => {
    const { container } = render(<TaggedText text="servidor1 a [[servidor2]]" />);
    expect(container.querySelectorAll('.name-tag')).toHaveLength(1);
    expect(screen.getByText('servidor2')).toHaveClass('name-tag');
    expect(container).toHaveTextContent('servidor1 a servidor2');
  });

  it('marks the new terms right after them', () => {
    render(<TaggedText text="Una {{inbound-rule}} del {{security-group}}." newTerms={new Set<TermId>(['inbound-rule'])} />);
    expect(screen.getAllByText(LUCIA_TEXT.newBadge)).toHaveLength(1);
    expect(screen.getByText(TERMS['inbound-rule'].name).nextElementSibling).toHaveTextContent(LUCIA_TEXT.newBadge);
  });

  it('marks a new term only at its first appearance in the text', () => {
    const { container } = render(<TaggedText text="Un {{ping}} va, otro {{ping}} vuelve y el {{security-group}} mira." newTerms={new Set<TermId>(['ping', 'security-group'])} />);
    const [firstPing, secondPing] = screen.getAllByText(TERMS.ping.name);
    expect(firstPing.nextElementSibling).toHaveTextContent(LUCIA_TEXT.newBadge);
    expect(secondPing.nextElementSibling).not.toHaveClass('term__new');
    expect(container.querySelectorAll('.term__new')).toHaveLength(2);
  });

  it('hovering a term shows its definition in document.body, out of any clipping box, and leaving hides it after the grace', async () => {
    const user = userEvent.setup();
    render(
      <div data-testid="clipping-box" style={{ overflow: 'hidden' }}>
        <TaggedText text="Mira el {{security-group}} de servidor2." />
      </div>,
    );
    const term = screen.getByText(SECURITY_GROUP.name);
    await user.hover(term);
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent(`${SECURITY_GROUP.name}: ${SECURITY_GROUP.definition}`);
    expect(tooltip.parentElement).toBe(document.body);
    expect(screen.getByTestId('clipping-box')).not.toContainElement(tooltip);
    await user.unhover(term);
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
  });

  it('shows one definition at a time when the same term appears twice', async () => {
    const user = userEvent.setup();
    render(<TaggedText text="Un {{ping}} va y otro {{ping}} vuelve." />);
    const [firstPing, secondPing] = screen.getAllByText(TERMS.ping.name);
    await user.hover(firstPing);
    await user.hover(secondPing);
    expect(await screen.findAllByRole('tooltip')).toHaveLength(1);
  });

  it('a term is not a Tab stop', async () => {
    const user = userEvent.setup();
    render(
      <>
        <TaggedText text="Mira el {{security-group}}." />
        <button type="button">Siguiente</button>
      </>,
    );
    await user.tab();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toHaveFocus();
  });

  it('without tips a term stays bold, with no underline and no definition', async () => {
    const user = userEvent.setup();
    render(<TaggedText text="El {{security-group}}." tips={false} />);
    const term = screen.getByText(SECURITY_GROUP.name);
    await user.hover(term);
    expect(term).toHaveClass('term');
    expect(term).not.toHaveClass('term--tip');
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
