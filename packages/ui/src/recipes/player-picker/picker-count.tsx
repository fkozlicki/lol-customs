interface PickerCountProps {
  count: number;
  size: number;
  clearLabel: string;
  onClear: () => void;
}

/** How many are picked out of how many are needed, and a way to start over. */
export function PickerCount({
  count,
  size,
  clearLabel,
  onClear,
}: PickerCountProps) {
  return (
    <div className="flex items-baseline gap-4">
      <span className="num text-xl font-semibold">
        {count}/{size}
      </span>
      {count > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="label-caps underline-offset-4 hover:text-foreground hover:underline"
        >
          {clearLabel}
        </button>
      )}
    </div>
  );
}
