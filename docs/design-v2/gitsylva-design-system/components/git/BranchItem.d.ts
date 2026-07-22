import * as React from 'react';
export interface BranchItemProps {
  name: string;
  lane?: 0 | 1 | 2;
  current?: boolean;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}
export function BranchItem(props: BranchItemProps): JSX.Element;
