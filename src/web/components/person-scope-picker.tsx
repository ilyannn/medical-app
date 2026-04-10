import type { Person } from "@/shared/types";
import { useLocale } from "@/web/lib/i18n";
import { cn } from "@/web/lib/utils";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";

interface PersonScopePickerProps {
  people: Person[];
  value: string;
  onChange: (value: string) => void;
}

export function PersonScopePicker({
  people,
  value,
  onChange,
}: PersonScopePickerProps) {
  const { t } = useLocale();
  const options = [
    { id: "all", label: t("all") },
    ...people.map((person) => ({ id: person.id, label: person.label })),
  ];
  const current = options.find((option) => option.id === value) ?? options[0];

  return (
    <Listbox value={current.id} onChange={onChange}>
      <div className="relative min-w-32">
        <ListboxButton className="glass-panel flex w-full items-center justify-between rounded-full px-4 py-2 text-sm font-medium">
          <span>{current.label}</span>
          <span className="text-xs text-[var(--muted)]">Filter</span>
        </ListboxButton>
        <ListboxOptions className="glass-panel absolute right-0 z-10 mt-2 w-full rounded-2xl p-2">
          {options.map((option) => (
            <ListboxOption
              key={option.id}
              value={option.id}
              className={({ focus, selected }) =>
                cn(
                  "cursor-pointer rounded-xl px-3 py-2 text-sm",
                  focus && "bg-[rgba(15,118,110,0.08)]",
                  selected && "text-[var(--teal)]",
                )
              }
            >
              {option.label}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}
