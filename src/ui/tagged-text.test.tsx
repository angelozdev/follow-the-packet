// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LUCIA_TEXT, type TermId } from '@/copy';
import { TaggedText } from './tagged-text';

describe('TaggedText', () => {
  it('reads like plain text, with each term shown by its official name', () => {
    const { container } = render(<TaggedText text="Mira el {{security-group}} de servidor2." />);
    expect(container).toHaveTextContent('Mira el Security Group de servidor2.');
    expect(screen.getByText('Security Group')).toHaveClass('term');
  });

  it('marks the new terms', () => {
    render(<TaggedText text="Una {{inbound-rule}} del {{security-group}}." newTerms={new Set<TermId>(['inbound-rule'])} />);
    expect(screen.getAllByText(LUCIA_TEXT.newBadge)).toHaveLength(1);
    expect(screen.getByText(LUCIA_TEXT.newBadge).closest('.term')).toHaveTextContent(/^regla de entrada nuevo$/);
  });
});
