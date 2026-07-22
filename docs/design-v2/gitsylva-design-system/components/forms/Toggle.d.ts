export interface ToggleProps {
  checked: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
}
export function Toggle(props: ToggleProps): JSX.Element;
