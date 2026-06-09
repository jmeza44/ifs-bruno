import { QuestionIcon } from "@phosphor-icons/react";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type HintFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  hint?: string;
};

export function HintField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = true,
  hint,
}: HintFieldProps) {
  return (
    <Field>
      <FieldLabel htmlFor={id} className="justify-between">
        <span>{label}</span>
        {hint && (
          <Popover>
            <PopoverTrigger
              type="button"
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label={`What is "${label}"?`}
            >
              <QuestionIcon size={14} />
            </PopoverTrigger>
            <PopoverContent className="w-64 text-xs text-muted-foreground">{hint}</PopoverContent>
          </Popover>
        )}
      </FieldLabel>
      <FieldContent>
        <Input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      </FieldContent>
    </Field>
  );
}
