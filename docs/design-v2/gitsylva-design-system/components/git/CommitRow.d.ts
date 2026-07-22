import * as React from 'react';
import { ChipProps } from '../display/Chip';
export interface CommitRowProps {
  message: string;
  chips?: ChipProps[];
  author?: string;
  initials: string;
  tone?: 'AS' | 'MD' | 'LF';
  hash: string;
  time: string;
  /** merge commits render dimmer/lighter */
  merge?: boolean;
  selected?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export function CommitRow(props: CommitRowProps): JSX.Element;
