import * as React from 'react';
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** square px @default 30 */
  size?: number;
  title?: string;
  active?: boolean;
}
export function IconButton(props: IconButtonProps): JSX.Element;
