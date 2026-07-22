export interface SegmentedOption { value: string; label: string; }
export interface SegmentedProps {
  options: SegmentedOption[];
  value: string;
  onChange?: (value: string) => void;
}
export function Segmented(props: SegmentedProps): JSX.Element;
