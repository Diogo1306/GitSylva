import * as React from 'react';
export interface ChipProps {
  label: string;
  /** graph lane: 0 = main, 1 & 2 = branches @default 0 */
  lane?: 0 | 1 | 2;
  /** render as an outlined tag chip */
  tag?: boolean;
  style?: React.CSSProperties;
}
export function Chip(props: ChipProps): JSX.Element;
