import type { ComponentProps, ReactNode } from 'react';

export type CardVariant = 'default' | 'soon';

type CardProps = Omit<ComponentProps<'section'>, 'className' | 'style' | 'ref'> & {
  as?: 'section' | 'li';
  variant?: CardVariant;
  children: ReactNode;
};

/** The one card of the game: a paper panel with an ink border and a shadow, as a section or as an item of a list. A soon card holds what is not open yet: faded, dashed and without shadow. */
export function Card({ as: Element = 'section', variant = 'default', ...props }: CardProps) {
  return <Element className={variant === 'soon' ? 'card card--soon' : 'card'} {...props} />;
}
