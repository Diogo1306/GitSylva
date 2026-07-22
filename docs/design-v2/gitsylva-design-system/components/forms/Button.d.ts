import * as React from 'react';
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual weight. @default 'secondary' */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  /** Shows a spinning ⟳ and hides iconLeft. */
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}
export function Button(props: ButtonProps): JSX.Element;
