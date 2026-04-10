import { api } from "@/web/lib/api";
import { useLocale } from "@/web/lib/i18n";
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Dialog,
  DialogBackdrop,
  DialogPanel,
} from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export function SearchDialog({
  open,
  onClose,
  personScope,
}: {
  open: boolean;
  onClose: () => void;
  personScope: string;
}) {
  const [query, setQuery] = useState("");
  const { t } = useLocale();
  const searchQuery = useQuery({
    queryKey: ["search", query, personScope],
    queryFn: () => api.search(query, personScope),
    enabled: open && query.length > 1,
  });

  return (
    <Dialog open={open} onClose={onClose} className="relative z-30">
      <DialogBackdrop className="fixed inset-0 bg-black/20 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-start justify-center p-6 pt-24">
        <DialogPanel className="glass-panel w-full max-w-2xl rounded-[2rem] p-4">
          <Combobox value={null} onChange={() => undefined}>
            <ComboboxInput
              aria-label={t("search")}
              placeholder={`${t("search")} notes, doctors, documents...`}
              className="w-full rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-4 text-lg outline-none"
              onChange={(event) => setQuery(event.target.value)}
            />
            <ComboboxOptions
              anchor="bottom start"
              className="mt-3 max-h-96 overflow-auto rounded-2xl border border-[var(--line)] bg-white p-2 shadow-xl empty:hidden"
            >
              {(searchQuery.data ?? []).map((hit) => (
                <ComboboxOption
                  key={`${hit.kind}-${hit.id}`}
                  value={hit.id}
                  className="rounded-xl px-3 py-3 data-[focus]:bg-[rgba(15,118,110,0.08)]"
                >
                  <p className="font-medium">{hit.title}</p>
                  <p className="text-sm text-[var(--muted)]">{hit.excerpt}</p>
                </ComboboxOption>
              ))}
              {query.length > 1 && !searchQuery.data?.length ? (
                <div className="px-3 py-4 text-sm text-[var(--muted)]">
                  {t("noResults")}
                </div>
              ) : null}
            </ComboboxOptions>
          </Combobox>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
