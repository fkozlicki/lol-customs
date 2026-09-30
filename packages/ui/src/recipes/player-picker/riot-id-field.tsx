import { Button } from "../../components/button";
import { Input } from "../../components/input";

interface RiotIdFieldProps {
  id: string;
  label: string;
  placeholder: string;
  addLabel: string;
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
  /** Nothing more can be picked. */
  disabled: boolean;
}

/** Picks someone who is not on the ladder yet, by Riot ID; Enter adds, as the button does. */
export function RiotIdField({
  id,
  label,
  placeholder,
  addLabel,
  value,
  onChange,
  onAdd,
  disabled,
}: RiotIdFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="label-caps">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !disabled) {
              event.preventDefault();
              onAdd();
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
        />
        <Button
          type="button"
          variant="outline"
          onClick={onAdd}
          disabled={disabled}
        >
          {addLabel}
        </Button>
      </div>
    </div>
  );
}
