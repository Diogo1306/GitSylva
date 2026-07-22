import * as React from 'react';
export interface DiffLineProps { kind?: 'hunk' | 'context' | 'add' | 'del'; children: React.ReactNode; style?: React.CSSProperties; }
export function DiffLine(props: DiffLineProps): JSX.Element;
