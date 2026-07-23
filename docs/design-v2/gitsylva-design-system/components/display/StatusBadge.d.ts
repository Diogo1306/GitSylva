import * as React from 'react';
export interface StatusBadgeProps { status?: 'A' | 'M' | 'D'; style?: React.CSSProperties; }
export function StatusBadge(props: StatusBadgeProps): JSX.Element;
