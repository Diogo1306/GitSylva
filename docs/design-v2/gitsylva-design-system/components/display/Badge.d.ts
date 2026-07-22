import * as React from 'react';
export interface BadgeProps { tone?: 'neutral' | 'accent'; children: React.ReactNode; style?: React.CSSProperties; }
export function Badge(props: BadgeProps): JSX.Element;
