// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LUCIA_TEXT, type TermId } from '@/copy';
import { TaggedText } from './tagged-text';

describe('TaggedText', () => {
  it('reads like plain text, with each term shown by its name', () => {
    const { container } = render(<TaggedText text="Mira la {{security-group}} de servidor2." />);
    expect(container).toHaveTextContent('Mira la puerta de servidor2.');
    expect(screen.getByText('puerta')).toHaveClass('term');
  });

  it('marks the new terms', () => {
    render(<TaggedText text="Una {{rule}} de la {{security-group}}." newTerms={new Set<TermId>(['rule'])} />);
    expect(screen.getAllByText(LUCIA_TEXT.newBadge)).toHaveLength(1);
    expect(screen.getByText(LUCIA_TEXT.newBadge).closest('.term')).toHaveTextContent(/^regla nuevo$/);
  });
});
