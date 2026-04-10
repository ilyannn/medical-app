import {
  type ReactNode,
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

export type Locale = "de" | "en" | "ru";

const messages = {
  en: {
    home: "Home",
    areas: "Areas",
    doctors: "Doctors",
    admin: "Admin",
    documents: "Documents",
    drafts: "Drafts",
    appointments: "Appointments",
    all: "All",
    me: "Me",
    wife: "Wife",
    search: "Search",
    quickActions: "Quick actions",
    upcomingAppointments: "Upcoming appointments",
    recentNotes: "Recent notes",
    recentDrafts: "Recent drafts",
    prescriptions: "Prescriptions",
    bills: "Bills",
    reimbursements: "Reimbursements",
    importFromPaperless: "Import from Paperless",
    createDraft: "Create draft",
    createAppointment: "Create appointment",
    addDoctor: "Add doctor",
    noResults: "No results yet",
  },
  de: {
    home: "Start",
    areas: "Bereiche",
    doctors: "Arzte",
    admin: "Verwaltung",
    documents: "Dokumente",
    drafts: "Entwurfe",
    appointments: "Termine",
    all: "Alle",
    me: "Ich",
    wife: "Ehefrau",
    search: "Suche",
    quickActions: "Schnellaktionen",
    upcomingAppointments: "Kommende Termine",
    recentNotes: "Letzte Notizen",
    recentDrafts: "Letzte Entwurfe",
    prescriptions: "Rezepte",
    bills: "Rechnungen",
    reimbursements: "Erstattungen",
    importFromPaperless: "Aus Paperless importieren",
    createDraft: "Entwurf erstellen",
    createAppointment: "Termin erstellen",
    addDoctor: "Arzt hinzufugen",
    noResults: "Noch keine Eintrage",
  },
  ru: {
    home: "Главная",
    areas: "Направления",
    doctors: "Врачи",
    admin: "Админ",
    documents: "Документы",
    drafts: "Черновики",
    appointments: "Встречи",
    all: "Все",
    me: "Я",
    wife: "Жена",
    search: "Поиск",
    quickActions: "Быстрые действия",
    upcomingAppointments: "Ближайшие встречи",
    recentNotes: "Последние заметки",
    recentDrafts: "Последние черновики",
    prescriptions: "Рецепты",
    bills: "Счета",
    reimbursements: "Возмещения",
    importFromPaperless: "Импорт из Paperless",
    createDraft: "Создать черновик",
    createAppointment: "Создать встречу",
    addDoctor: "Добавить врача",
    noResults: "Пока ничего нет",
  },
} satisfies Record<Locale, Record<string, string>>;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: keyof (typeof messages)["en"]) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key) => messages[locale][key],
    }),
    [locale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("LocaleContext is not available");
  }
  return context;
}
