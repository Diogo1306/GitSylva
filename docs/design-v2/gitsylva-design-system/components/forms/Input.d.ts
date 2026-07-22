import * as React from 'react';
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Use the monospace family (branch names, paths, URLs). */
  mono?: boolean;
}
export function Input(props: InputProps): JSX.Element;
