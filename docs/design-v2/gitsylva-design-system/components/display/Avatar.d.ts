import * as React from 'react';
export interface AvatarProps {
  initials: string;
  /** author color token key @default 'AS' */
  tone?: 'AS' | 'MD' | 'LF';
  size?: number;
  /** override with an explicit color */
  color?: string;
  style?: React.CSSProperties;
}
export function Avatar(props: AvatarProps): JSX.Element;
