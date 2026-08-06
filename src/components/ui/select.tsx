import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption<T extends string | number> = {
  value: T;
  label: string;
};

export function Select<T extends string | number>({
  value,
  onChange,
  options,
  disabled,
  placeholder,
  ariaLabel,
  id,
  className,
  variant = "outlined",
}: {
  value: T | "";
  onChange: (value: T) => void;
  options: readonly SelectOption<T>[];
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  id?: string;
  className?: string;
  variant?: "outlined" | "filled";
}) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  const toggle = () => {
    if (!open && rootRef.current) {
      const rect = rootRef.current.getBoundingClientRect();
      setOpenUp(window.innerHeight - rect.bottom < 220);
    }
    setOpen((value) => !value);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        className={`flex h-10 w-full items-center justify-between gap-2 px-3 text-sm text-foreground outline-none transition-[background-color,transform] duration-100 focus:ring-2 focus:ring-ring active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100 ${
          variant === "filled"
            ? "rounded-t-lg border-0 border-b border-input bg-muted focus:border-primary"
            : "rounded-md border bg-background"
        }`}
        onClick={toggle}
      >
        <span
          className={selected ? "truncate" : "truncate text-muted-foreground"}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-muted-foreground transition-transform duration-150 motion-reduce:transition-none ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div
          role="listbox"
          className={`absolute left-0 z-50 max-h-60 min-w-full overflow-y-auto rounded-lg border bg-card p-1 shadow-lg ${
            openUp ? "bottom-full mb-1" : "mt-1"
          }`}
        >
          {options.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={option.value === value}
              key={option.value}
              className={`flex w-full items-center justify-between gap-3 whitespace-nowrap rounded-md px-2 py-1.5 text-left text-sm outline-none transition-colors duration-100 hover:bg-accent motion-reduce:transition-none ${
                option.value === value
                  ? "font-medium text-blue-600 dark:text-blue-400"
                  : "text-foreground"
              }`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
              {option.value === value && <Check className="size-4 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
