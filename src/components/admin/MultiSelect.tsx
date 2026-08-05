import { Check, ChevronDown } from "lucide-react";

type Option<T extends string | number> = {
  value: T;
  label: string;
};

export function MultiSelect<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option<T>[];
  value: T[];
  onChange: (value: T[]) => void;
}) {
  const selected = new Set(value);
  const text =
    value.length === 0
      ? `${label}：全部`
      : value.length === 1
        ? options.find((option) => option.value === value[0])?.label || label
        : `${label}：已选 ${value.length} 项`;
  return (
    <details className="group relative min-w-0 flex-1 md:min-w-40 md:flex-none">
      <summary className="flex h-10 cursor-pointer list-none items-center justify-between gap-3 rounded-md border bg-background px-3 text-sm outline-none transition-[background-color,transform,filter] duration-100 hover:bg-accent active:translate-y-px active:scale-[0.98] active:brightness-90 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none motion-reduce:active:translate-y-0 motion-reduce:active:scale-100 [&::-webkit-details-marker]:hidden">
        <span className="truncate">{text}</span>
        <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute left-0 top-[calc(100%+0.4rem)] z-40 min-w-full rounded-lg border bg-card p-1.5 shadow-xl">
        {options.map((option) => {
          const checked = selected.has(option.value);
          return (
            <label
              className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-[background-color,transform] duration-100 hover:bg-accent active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
              key={option.value}
            >
              <span
                className={`grid size-4 place-items-center rounded border ${
                  checked
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-background"
                }`}
              >
                {checked && <Check className="size-3" />}
              </span>
              <input
                className="sr-only"
                type="checkbox"
                checked={checked}
                onChange={() =>
                  onChange(
                    checked
                      ? value.filter((item) => item !== option.value)
                      : [...value, option.value],
                  )
                }
              />
              <span className="whitespace-nowrap">{option.label}</span>
            </label>
          );
        })}
      </div>
    </details>
  );
}
