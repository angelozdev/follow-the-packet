import type { ComponentProps, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'small' | 'text';

const BUTTON_CLASS: Record<ButtonVariant, string> = {
  primary: 'btn btn--primary',
  secondary: 'btn',
  small: 'btn btn--small',
  text: 'link',
};

type ActionProps = Omit<ComponentProps<'button'>, 'className' | 'style' | 'type'> & { href?: undefined };
type LinkProps = Omit<ComponentProps<'a'>, 'className' | 'style'> & { href: string };

export type ButtonProps = (ActionProps | LinkProps) & { variant?: ButtonVariant; children: ReactNode };

/** The one button of the game: a button that does not submit, or a link when it has an href. Its look comes only from its variant: primary for the main action of a screen, secondary, small, or text for navigation that reads as a link. */
export function Button({ variant = 'secondary', ...props }: ButtonProps) {
  const className = BUTTON_CLASS[variant];
  if (props.href === undefined) return <button type="button" className={className} {...(props as ActionProps)} />;
  return <a className={className} {...(props as LinkProps)} />;
}
