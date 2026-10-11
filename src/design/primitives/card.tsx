import type { ComponentProps, ReactNode } from 'react';

export type CardVariant = 'default' | 'soon';

/** What the dark stripe on top of a card holds: an icon (decorative); the card's own heading, when the stripe is its title; the type of card, in words; and a short value at the right edge. */
export interface CardHeader {
  icon?: ReactNode;
  title?: ReactNode;
  type?: ReactNode;
  meta?: ReactNode;
}

type CardProps = Omit<ComponentProps<'section'>, 'className' | 'style' | 'ref'> & {
  as?: 'section' | 'li';
  variant?: CardVariant;
  header?: CardHeader;
  children?: ReactNode;
};

function Stripe({ icon, title, type, meta }: CardHeader) {
  return (
    <div className="card__band">
      {icon}
      {title}
      {type !== undefined && <span className="card__type">{type}</span>}
      {meta !== undefined && <span className="card__meta">{meta}</span>}
    </div>
  );
}

/** The one card of the game, in style B: a paper panel with a thick ink border, rounded corners and a shadow below, as a section or as an item of a list. A card with a header wears a dark stripe on top, which rounds its own corners: the card clips nothing, so no parent can squeeze it below its content. The caller owns the heading that names the card, whether it goes in the stripe (`title`) or at the top of the content, and labels the card with it. A soon card holds what is not open yet: faded, dashed and without shadow. */
export function Card({ as: Element = 'section', variant = 'default', header, children, ...props }: CardProps) {
  return (
    <Element className={variant === 'soon' ? 'card card--soon' : 'card'} {...props}>
      {header && <Stripe {...header} />}
      <div className="card__body">{children}</div>
    </Element>
  );
}
