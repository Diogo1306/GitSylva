import * as React from 'react';
export interface ModalProps {
  title: string;
  children?: React.ReactNode;
  onClose: () => void;
  actionLabel?: string;
  onAction?: () => void;
  /** red primary action for destructive dialogs */
  danger?: boolean;
  cancelLabel?: string;
  width?: number;
}
export function Modal(props: ModalProps): JSX.Element;
