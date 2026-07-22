import * as React from 'react';
export interface NotificationProps {
  title: string;
  sub?: string;
  /** dot color; use --leaf, --l1, --ddT for info/success/warning */
  dot?: string;
  /** true plays the slide-out-right exit; unmount after ~340ms */
  closing?: boolean;
  onClose?: () => void;
  style?: React.CSSProperties;
}
export function Notification(props: NotificationProps): JSX.Element;
