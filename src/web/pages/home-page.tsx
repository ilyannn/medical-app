import { usePersonScope } from "@/web/components/app-shell";
import { MetricCard } from "@/web/components/metric-card";
import { api } from "@/web/lib/api";
import { useLocale } from "@/web/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

export function HomePage() {
  const { personScope } = usePersonScope();
  const { t } = useLocale();
  const overviewQuery = useQuery({
    queryKey: ["overview", personScope],
    queryFn: () => api.getOverview(personScope),
  });

  const data = overviewQuery.data;
  if (!data) {
    return (
      <div className="glass-panel rounded-[2rem] p-8">Loading dashboard…</div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Active prescriptions"
          value={data.stats.activePrescriptions}
          accent="var(--teal)"
          detail="Renewals and ongoing medication plans."
        />
        <MetricCard
          title="Pending bills"
          value={data.stats.pendingBills}
          accent="var(--amber)"
          detail="Invoices still waiting for settlement."
        />
        <MetricCard
          title="Reimbursements"
          value={data.stats.pendingReimbursements}
          accent="var(--plum)"
          detail="Claims that still need attention."
        />
        <MetricCard
          title="Documents"
          value={data.stats.documentCount}
          accent="#334155"
          detail="Managed files in the iCloud source of truth."
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="glass-panel rounded-[2rem] p-6">
          <div className="flex items-center justify-between">
            <h2 className="page-title text-2xl">{t("recentNotes")}</h2>
            <Link
              className="text-sm font-medium text-[var(--teal)]"
              to="/areas"
            >
              View areas
            </Link>
          </div>
          <div className="mt-5 space-y-4">
            {data.recentNotes.map((note) => (
              <article
                key={note.id}
                className="rounded-[1.5rem] border border-[var(--line)] bg-white/50 p-4"
              >
                <div className="flex items-center justify-between text-sm text-[var(--muted)]">
                  <span>{note.visitDate}</span>
                  <span>{note.personId}</span>
                </div>
                <h3 className="mt-2 text-lg font-semibold">{note.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {note.body}
                </p>
                <p className="mt-3 text-sm font-medium">
                  Next: {note.nextStep}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-[2rem] p-6">
            <h2 className="page-title text-2xl">{t("quickActions")}</h2>
            <div className="mt-4 grid gap-3">
              <Link
                className="rounded-2xl bg-[rgba(15,118,110,0.12)] px-4 py-3 text-sm font-medium text-[var(--teal)]"
                to="/drafts"
              >
                {t("createDraft")}
              </Link>
              <Link
                className="rounded-2xl bg-[rgba(180,101,29,0.12)] px-4 py-3 text-sm font-medium text-[var(--amber)]"
                to="/documents"
              >
                {t("importFromPaperless")}
              </Link>
              <Link
                className="rounded-2xl bg-[rgba(139,61,129,0.12)] px-4 py-3 text-sm font-medium text-[var(--plum)]"
                to="/appointments"
              >
                {t("createAppointment")}
              </Link>
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <h2 className="page-title text-2xl">{t("upcomingAppointments")}</h2>
            <div className="mt-4 space-y-3">
              {data.upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-2xl border border-[var(--line)] bg-white/50 p-4"
                >
                  <p className="font-semibold">{appointment.title}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {new Date(appointment.start).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
