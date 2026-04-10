import { PersonScopePicker } from "@/web/components/person-scope-picker";
import { SearchDialog } from "@/web/components/search-dialog";
import { api } from "@/web/lib/api";
import { type Locale, useLocale } from "@/web/lib/i18n";
import { cn } from "@/web/lib/utils";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Transition,
} from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";
import { Fragment, type ReactNode, useMemo, useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";

const navItems = [
  { to: "/", key: "home" },
  { to: "/areas", key: "areas" },
  { to: "/doctors", key: "doctors" },
  { to: "/admin", key: "admin" },
  { to: "/documents", key: "documents" },
  { to: "/drafts", key: "drafts" },
  { to: "/appointments", key: "appointments" },
] as const;

export function usePersonScope() {
  const [searchParams, setSearchParams] = useSearchParams();
  const personScope = searchParams.get("personScope") ?? "all";

  return {
    personScope,
    setPersonScope: (nextScope: string) => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("personScope", nextScope);
      setSearchParams(nextParams, { replace: true });
    },
  };
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t, locale, setLocale } = useLocale();
  const { personScope, setPersonScope } = usePersonScope();
  const overviewQuery = useQuery({
    queryKey: ["overview", personScope],
    queryFn: () => api.getOverview(personScope),
  });
  const [searchOpen, setSearchOpen] = useState(false);

  const localeOptions: Locale[] = ["en", "de", "ru"];
  const people = overviewQuery.data?.filters.people ?? [];
  const filters = useMemo(
    () => people.map((person) => person.label).join(" / "),
    [people],
  );

  return (
    <div className="mx-auto flex min-h-screen max-w-[1440px] gap-6 px-4 py-6 lg:px-8">
      <aside className="glass-panel hidden w-72 shrink-0 rounded-[2rem] p-6 lg:flex lg:flex-col">
        <p className="page-title text-3xl leading-none">
          Household
          <br />
          medical desk
        </p>
        <p className="mt-4 text-sm text-[var(--muted)]">
          Shared care operations across documents, admin work, and appointment
          flow.
        </p>
        <nav className="mt-8 flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[rgba(15,118,110,0.12)] text-[var(--teal)]"
                    : "text-[var(--ink)] hover:bg-white/60",
                )
              }
            >
              {t(item.key)}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-[1.5rem] bg-[rgba(255,255,255,0.6)] p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
            Managed folders
          </p>
          <p className="mt-2 text-sm">{filters || "Me / Wife"}</p>
        </div>
      </aside>

      <div className="flex-1">
        <header className="glass-panel rounded-[2rem] px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
                Open-source household medical app
              </p>
              <h1 className="page-title mt-2 text-4xl">
                Shared command center
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm font-medium"
                onClick={() => setSearchOpen(true)}
              >
                {t("search")}
              </button>
              <PersonScopePicker
                people={people}
                value={personScope}
                onChange={setPersonScope}
              />
              <div className="glass-panel flex rounded-full p-1">
                {localeOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={cn(
                      "rounded-full px-3 py-1 text-sm font-medium uppercase",
                      locale === option
                        ? "bg-[rgba(15,118,110,0.14)] text-[var(--teal)]"
                        : "text-[var(--muted)]",
                    )}
                    onClick={() => setLocale(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <main className="mt-6">{children}</main>
        <SearchDialog
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          personScope={personScope}
        />
      </div>
    </div>
  );
}
